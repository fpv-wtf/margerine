const crypto = require('./crypto');

class pack {
    constructor() {
        this.sof = 85;

        this.version = 1;

        this.packRepeatTimes = 2;
        this.packTimeOut = 1000;
        this.repeatTimes = 2;
        this.timeOut = 1000;
    }

    getLength() {
        return this.length;
    }

    encodeSequenceNo() {
        let sequence = new Uint8Array(2);
        sequence[0] = (this.seq & 255);
        sequence[1] = ((this.seq & 65280) >> 8);
        return sequence;
    }

    decodeBytes(offset, length) {
        let value = 0;
        for (let i = (offset + length) - 1; i >= offset; i--) {
            value = (value << 8) | (this.buffer[i] & 255);
        }
        return value;
    }

    reCrc() {
        if (this.buffer != null) {
            let endOfBuffer = this.buffer.length - 2;
            let crcs = crypto.calcCrc16(this.buffer, endOfBuffer)
            this.buffer[endOfBuffer - 0] = (crcs & 255);
            this.buffer[endOfBuffer + 1] = ((65280 & crcs) >> 8);
        }
    }

    isNeedCcode() {
        //  NOT IMPLEMENTED
        // try {
        //     this.cmdSetObj = CmdSet.find(this.cmdSet);
        //     if (this.cmdSetObj == null || this.cmdSetObj.cmdIdClass() == null) {

        //     } else {
        //         this.isNeedCcode = this.cmdSetObj.cmdIdClass().isNeedCcode(this.cmdId);
        //     }
        // } catch (e) {

        // }
    }

    pack() {
        if (this.data == null) {
            this.length = 13;
        } else {
            this.length = this.data.length + 13;
        }
        this.buffer = new Uint8Array(this.length);
        let box_head = this.buffer
        box_head[0] = this.sof;
        box_head[1] = (this.length & 255);
        box_head[2] = ((this.length >> 8) & 3);
        box_head[2] = (box_head[2] | 4);
        box_head[3] = crypto.calcCrc8(box_head, 3);
        this.crc8 = box_head[3];
        box_head[4] = ((this.senderId << 5) | this.senderType);
        box_head[5] = ((this.receiverId << 5) | this.receiverType);
        box_head[6] = this.encodeSequenceNo()[0];
        box_head[7] = this.encodeSequenceNo()[1];
        box_head[8] = ((this.cmdType << 7) | (this.isNeedAck << 5) | this.encryptType);
        box_head[9] = this.cmdSet;
        box_head[10] = this.cmdId;

        if (this.data != null) {
            this.data.forEach((e, i) => {
                box_head[i + 11] = e
            });
        }

        let endOfBuffer = this.length - 2;
        let crcs = crypto.calcCrc16(box_head, endOfBuffer)
        this.crc16 = crcs;
        box_head[this.length - 2] = (crcs & 255);
        box_head[this.length - 1] = ((65280 & crcs) >> 8);

        this.buffer = box_head;
    }

    unpack(buffer, request) {
        if (buffer != null && buffer.length >= 13) {
            this.buffer = buffer;
            this.sof = buffer[0];

            let VL = this.decodeBytes(1, 2);
            this.version = VL >> 10;
            this.length = VL & 1023;
            //if more length then possibly dumb ack first
            //try next packet instead
            /*if(buffer.length > this.length && buffer[this.length] == 0x55) {
                //console.info("multiple responses")
                return this.unpack(buffer.subarray(this.length));
            }*/
            this.crc8 = this.buffer[3];
            this.senderId = parseInt(this.buffer[4]) >> 5;
            this.senderType = parseInt(this.buffer[4]) & 31;
            this.receiverId = parseInt(this.buffer[5]) >> 5;
            this.receiverType = parseInt(this.buffer[5]) & 31;
            this.seq = this.decodeBytes(6, 2);
            this.cmdType = parseInt(this.buffer[8]) >> 7;
            this.isNeedAck = (parseInt(this.buffer[8]) >> 5) & 3;
            this.encryptType = parseInt(this.buffer[8]) & 7;
            this.cmdSet = parseInt(this.buffer[9]);
            this.cmdId = parseInt(this.buffer[10]);

            //this.seq matching _would_ be proper
            //if the devices didn't sometimes respond with the wrong seq!
            if(request && (this.cmdId !== request.cmdId || this.cmdSet !== request.cmdSet)) {
                if(buffer.length > this.length && buffer[this.length] == 0x55) {
                    //console.log("multiple responses", this.cmdId)
                    return this.unpack(buffer.subarray(this.length), request)
                }
                else {
                    throw "unexpected response seq and no more packets to try"
                }
            }

            if (this.cmdType == 1) {
                this.ccode = parseInt(this.buffer[11]);
            }

            let dataLen = this.length - 11 - 2;
            if (dataLen > 0) {
                this.data = new Uint8Array(dataLen);
                this.data.forEach((e, i) => {
                    this.data[i] = this.buffer[i + 11]
                });
            }
            this.crc16 = this.decodeBytes(this.length-2, 2); //BytesUtil.getInt(buffer, buffer.length - 2, 2);
        }
    }

    resetData() {
        this.isNeedCcode = true;
        this.buffer = null;
        this.sof = 0;
        this.version = 1;
        this.length = 0;
        this.crc8 = 0;
        this.senderId = 0;
        this.senderType = 0;
        this.receiverId = 0;
        this.receiverType = 0;
        this.seq = 0;
        this.cmdType = 0;
        this.isNeedAck = 0;
        this.encryptType = 0;
        this.cmdSet = 0;
        this.cmdId = 0;
        this.ccode = 0;
        this.data = null;
        this.crc16 = 0;
    }

    toString() {
        if (this.buffer != null) {
            return Array.prototype.map.call(new Uint8Array(this.buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
        } else return "";
    }

    toBuffer() {
        return this.buffer;
    }

    toObject() {
        return {
            sof: this.sof,
            version: this.version,
            ccode: this.ccode,
            cmdId: this.cmdId,
            cmdSet: this.cmdSet,
            cmdType: this.cmdType,
            crc16: this.crc16,
            crc8: this.crc8,
            encryptType: this.encryptType,
            isNeedAck: this.isNeedAck,
            length: this.length,
            receiverId: this.receiverId,
            receiverType: this.receiverType,
            senderId: this.senderId,
            senderType: this.senderType,
            seq: this.seq,
            data: this.data,
            buffer: this.buffer

        }
    }


}

module.exports = pack;
