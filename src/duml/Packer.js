const CRC8 = new Int8Array([0, 94, 188, 226, 97, 63, 221, 131, 194, 156, 126, 32, 163, 253, 31, 65, 157, 195, 33, 127, 252, 162, 64, 30, 95, 1, 227, 189, 62, 96, 130, 220, 35, 125, 159, 193, 66, 28, 254, 160, 225, 191, 93, 3, 128, 222, 60, 98, 190, 224, 2, 92, 223, 129, 99, 61, 124, 34, 192, 158, 29, 67, 161, 255, 70, 24, 250, 164, 39, 121, 155, 197, 132, 218, 56, 102, 229, 187, 89, 7, 219, 133, 103, 57, 186, 228, 6, 88, 25, 71, 165, 251, 120, 38, 196, 154, 101, 59, 217, 135, 4, 90, 184, 230, 167, 249, 27, 69, 198, 152, 122, 36, 248, 166, 68, 26, 153, 199, 37, 123, 58, 100, 134, 216, 91, 5, 231, 185, 140, 210, 48, 110, 237, 179, 81, 15, 78, 16, 242, 172, 47, 113, 147, 205, 17, 79, 173, 243, 112, 46, 204, 146, 211, 141, 111, 49, 178, 236, 14, 80, 175, 241, 19, 77, 206, 144, 114, 44, 109, 51, 209, 143, 12, 82, 176, 238, 50, 108, 142, 208, 83, 13, 239, 177, 240, 174, 76, 18, 145, 207, 45, 115, 202, 148, 118, 40, 171, 245, 23, 73, 8, 86, 180, 234, 105, 55, 213, 139, 87, 9, 235, 181, 54, 104, 138, 212, 149, 203, 41, 119, 244, 170, 72, 22, 233, 183, 85, 11, 136, 214, 52, 106, 43, 117, 151, 201, 74, 20, 246, 168, 116, 42, 200, 150, 21, 75, 169, 247, 182, 232, 10, 84, 215, 137, 107, 53,])
const CRC16 = new Int16Array([0, 4489, 8978, 12955, 17956, 22445, 25910, 29887, 35912, 40385, 44890, 48851, 51820, 56293, 59774, 63735, 4225, 264, 13203, 8730, 22181, 18220, 30135, 25662, 40137, 36160, 49115, 44626, 56045, 52068, 63999, 59510, 8450, 12427, 528, 5017, 26406, 30383, 17460, 21949, 44362, 48323, 36440, 40913, 60270, 64231, 51324, 55797, 12675, 8202, 4753, 792, 30631, 26158, 21685, 17724, 48587, 44098, 40665, 36688, 64495, 60006, 55549, 51572, 16900, 21389, 24854, 28831, 1056, 5545, 10034, 14011, 52812, 57285, 60766, 64727, 34920, 39393, 43898, 47859, 21125, 17164, 29079, 24606, 5281, 1320, 14259, 9786, 57037, 53060, 64991, 60502, 39145, 35168, 48123, 43634, 25350, 29327, 16404, 20893, 9506, 13483, 1584, 6073, 61262, 65223, 52316, 56789, 43370, 47331, 35448, 39921, 29575, 25102, 20629, 16668, 13731, 9258, 5809, 1848, 65487, 60998, 56541, 52564, 47595, 43106, 39673, 35696, 33800, 38273, 42778, 46739, 49708, 54181, 57662, 61623, 2112, 6601, 11090, 15067, 20068, 24557, 28022, 31999, 38025, 34048, 47003, 42514, 53933, 49956, 61887, 57398, 6337, 2376, 15315, 10842, 24293, 20332, 32247, 27774, 42250, 46211, 34328, 38801, 58158, 62119, 49212, 53685, 10562, 14539, 2640, 7129, 28518, 32495, 19572, 24061, 46475, 41986, 38553, 34576, 62383, 57894, 53437, 49460, 14787, 10314, 6865, 2904, 32743, 28270, 23797, 19836, 50700, 55173, 58654, 62615, 32808, 37281, 41786, 45747, 19012, 23501, 26966, 30943, 3168, 7657, 12146, 16123, 54925, 50948, 62879, 58390, 37033, 33056, 46011, 41522, 23237, 19276, 31191, 26718, 7393, 3432, 16371, 11898, 59150, 63111, 50204, 54677, 41258, 45219, 33336, 37809, 27462, 31439, 18516, 23005, 11618, 15595, 3696, 8185, 63375, 58886, 54429, 50452, 45483, 40994, 37561, 33584, 31687, 27214, 22741, 18780, 15843, 11370, 7921, 3960])


const calcCrc16 = (array, length) => {
    let seed = 0x3692;

    // seed = 0x1012 // Naza M
    // seed = 0x1013 // Phantom 2
    // seed = 0x7000 // Naza M V2
    // seed = 0x3692 // P3/P4/Mavic/Later

    for (let pos = 0; pos < length; pos++) {
        seed = (CRC16[((seed ^ array[pos]) & 0xff)] & 0xffff) ^ (seed >> 8);
    }
    return seed;
}

const calcCrc8 = (array, length) => {
    let crc = 0x77;
    for (let pos = 0; pos < length; pos++) {
        crc = CRC8[(crc ^ array[pos]) & 0xff];
    }
    return crc;
}

class pack {
    constructor(inputArray = null) {
        this.buffer;
        this.sof = 85;
        this.ccode;
        this.cmdId;
        this.cmdSet;
        this.cmdType;
        this.crc16;
        this.crc8;
        this.encryptType;
        this.isNeedAck;
        this.length;
        this.receiverId;
        this.receiverType;
        this.senderId;
        this.senderType;
        this.seq;
        this.data;
        this.version = 1;

        this.packRepeatTimes = 2;
        this.packTimeOut = 1000;
        this.repeatTimes = 2;
        this.timeOut = 1000;

        if (inputArray != null && typeof inputArray === "object") {
            this.unpack(inputArray);
        }
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
            let crcs = calcCrc16(this.buffer, endOfBuffer)
            this.buffer[endOfBuffer - 0] = (crcs & 255);
            this.buffer[endOfBuffer + 1] = ((65280 & crcs) >> 8);
        }
    }

    validate() {
        // check the last two bytes of the buffer are equal to the last 2 after reCrc
        if (this.buffer != null) {
            let endOfBuffer = this.buffer.length - 2;
            let crcs = calcCrc16(this.buffer, endOfBuffer)
            return (this.buffer[endOfBuffer - 0] == (crcs & 255) && this.buffer[endOfBuffer + 1] == ((65280 & crcs) >> 8))
        } else return false;
    }

    // isNeedCcode() {
    //     //  NOT IMPLEMENTED
    //     // try {
    //     //     this.cmdSetObj = CmdSet.find(this.cmdSet);
    //     //     if (this.cmdSetObj == null || this.cmdSetObj.cmdIdClass() == null) {

    //     //     } else {
    //     //         this.isNeedCcode = this.cmdSetObj.cmdIdClass().isNeedCcode(this.cmdId);
    //     //     }
    //     // } catch (e) {

    //     // }
    // }

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
        box_head[3] = calcCrc8(box_head, 3);
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
        let crcs = calcCrc16(box_head, endOfBuffer)
        this.crc16 = crcs;
        box_head[this.length - 2] = (crcs & 255);
        box_head[this.length - 1] = ((65280 & crcs) >> 8);

        this.buffer = box_head;
    }

    unpack(buffer) {
        if (buffer != null && buffer.length >= 13) {
            this.buffer = buffer;
            this.sof = buffer[0];

            let VL = this.decodeBytes(1, 2);
            this.version = VL >> 10;
            this.length = VL & 1023;

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

            if (this.cmdType == 1) {
                this.ccode = parseInt(this.buffer[11]);
            }

            let dataLen = (this.buffer.length - 11) - 2;
            if (dataLen > 0) {
                this.data = new Uint8Array(dataLen);

                this.data.forEach((e, i) => {
                    this.data[i] = this.buffer[i + 11]
                });

            }
            this.crc16 = this.decodeBytes(this.buffer.length - 2, 2); //BytesUtil.getInt(buffer, buffer.length - 2, 2);
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

    toUint8Array() {
        return new Uint8Array(this.buffer);
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

    static calcCrc16 = calcCrc16;
    static calcCrc8 = calcCrc8;
}


module.exports = pack;