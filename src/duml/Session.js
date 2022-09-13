const Packer = require('./Packer')

const hexToUint8Array = (hex) => {
    if (!hex || hex.length === 0) return null;
    return new Uint8Array(hex.match(/.{1,2}/g).map((i) => parseInt(i, 16)));
}

const decodeBytes = (buffer, offset, length) => {
    let value = 0;
    for (let i = (offset + length) - 1; i >= offset; i--) {
        value = (value << 8) | (buffer[i] & 255);
    }
    return value;
}

class Session {
    constructor() {
        this.sentPackets = [];
        this.receiveBuffer = new Uint8Array(0);
        this.lastSeenSeq = 0;
        this.unmatchedListener = () => { };
        this.filterListeners = [];
    }

    setUnmatchedListener(callback) {
        if (typeof callback === 'function') this.unmatchedListener = callback;
        else throw new Error("Callback must be a function");
    }

    addFilterListener(filters, callback) {
        if (typeof callback === 'function') this.filterListeners.push({ filters, callback });
        else throw new Error("Callback must be a function");
    }

    receive(data) {
        // if the data is not a Uint8Array, convert it
        if (!(data instanceof Uint8Array)) {
            data = hexToUint8Array(data);
        }

        // append data to the receive buffer
        const removeCount = (this.receiveBuffer.length > 300) ? 50 : 0;
        const bytesToCopy = this.receiveBuffer.length - removeCount;

        const newBuffer = new Uint8Array(bytesToCopy + data.length);

        newBuffer.set(this.receiveBuffer.subarray(removeCount, bytesToCopy));
        newBuffer.set(data, bytesToCopy);

        this.receiveBuffer = newBuffer;

        // process the buffer
        while (this.receiveBuffer.length > 3) {
            if (this.receiveBuffer[0] != 85) {
                
                this.receiveBuffer = this.receiveBuffer.subarray(1);
                continue;
            }

            const length = decodeBytes(this.receiveBuffer, 1, 2) & 0x3FF;

            if (length > 300) { // sanity limit
                this.receiveBuffer = this.receiveBuffer.subarray(3);
                continue;
            }

            if (this.receiveBuffer.length < length) break;

            const packet = new Packer();
            packet.unpack(this.receiveBuffer.subarray(0, length));

            // check if packet is valid 
            if (!packet.validate()) {
                this.receiveBuffer = this.receiveBuffer.subarray(length - 1);
                continue;
            }


            if (packet.buffer != null) {
                // first send to global listeners
                this._emitToFilterListeners(packet);

                // we can assume that the packet is valid
                this.receiveBuffer = this.receiveBuffer.subarray(length);

                this.lastSeenSeq = packet.seq;

                // send packet to be matched up
                const matched = this.sentPackets.find(lookup => (lookup.seq == packet.seq));
                if (matched != null) {
                    // we have a match
                    this.sentPackets.splice(this.sentPackets.indexOf(matched), 1);

                    matched.timeout && clearTimeout(matched.timeout);

                    // send the callback
                    matched.Promise.resolve(packet);
                } else {
                    // we don't have a match, send to unmatched callback
                    this.unmatchedListener(packet);
                }
            }
        }
    }

    transmit(PackedPacket, ttl = 1000) {
        return new Promise(function (resolve, reject) {
            // check if PackedPacket requires a response
            if (ttl === -1) {
                return resolve(null);
            }

            PackedPacket.Promise = { resolve, reject };

            // set a timeout to reject the promise
            PackedPacket.timeout = setTimeout(function () {

                // timeout the promise
                PackedPacket.Promise.reject(new Error("Timeout"));
                // remove the packet from the sent list
                this.sentPackets.splice(this.sentPackets.indexOf(PackedPacket), 1);
            }.bind(this), ttl);

            this.sentPackets.push(PackedPacket);

        }.bind(this));
    }

    _emitToFilterListeners(packet) {
        const packetObj = packet.toObject();
        const matched = this.filterListeners.filter(listener => {
            return Object.keys(listener.filter).some(key => {
                // loose equality check so '0xFF' == 255 etc returns true
                return filter[key] == packetObj[key];
            });
        })

        for (const listener of matched) {
            listener.callback(packet);
        }
    }
}

module.exports = Session

