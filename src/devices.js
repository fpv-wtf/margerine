const devices = {
    "LT150": {
        ota: {
            receiverType: 8,
            receiverId: 6,
            cmdSet: 0, 
            cmdId: 50,
            request: Buffer.from("3939000000", "hex"),
            response: Buffer.from("3B3B0000000E", "hex"),
            restart: true
        },
        restart: {
            receiverType: 8,
            receiverId: 1,
            cmdSet: 0, 
            cmdId: 11,
            data: Buffer.from('0001000000000000000000000000', 'hex')
        },
        patch: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 244,
            address: "0x5f701cd8",
            value: "0xE10E"
        },
        debug: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 226
        },
        install: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 244,
            selinuxdisable: "0xFBCE78",
            engineering: true    
        }
    },
    "WM150": {
        ota: {
            receiverType: 8,
            receiverId: 4,
            cmdSet: 0, 
            cmdId: 50,
            request: Buffer.from("3939000000", "hex"),
            response: Buffer.from("3B3B0000000E", "hex"),
            restart: true
        },
        restart: {
            receiverType: 8,
            receiverId: 1,
            cmdSet: 0, 
            cmdId: 11,
            data: Buffer.from('0001000000000000000000000000', 'hex')
        },
        patch: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 244,
            address: "0x3f701cd8",
            value: "0xE10E"
        },
        debug: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 226
        },
        install: {
            receiverType: 8,
            receiverId: 3,
            cmdSet: 0, 
            cmdId: 244,
            selinuxdisable: "0xFBCE78",
            engineering: true    
        }
    },
    "GL150": {
        ota: {
            receiverType: 28,
            receiverId: 4,
            cmdSet: 0, 
            cmdId: 50,
            request: Buffer.from("3939000000", "hex"),
            response: Buffer.from("3B3B0000000E", "hex"),
            restart: true
        },
        restart: {
            receiverType: 28,
            receiverId: 1,
            cmdSet: 0, 
            cmdId: 11,
            data: Buffer.from('0001000000000000000000000000', 'hex')
        },
        patch: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            address: "0x7f701cd8",
            value: "0xE10E"
        },
        debug: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 226
        },
        install: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            selinuxdisable: "0xFBCE78",
            engineering: true    
        }
    },
    "GP150": {
        ota: {
            receiverType: 28,
            receiverId: 4,
            cmdSet: 0, 
            cmdId: 50,
            request: Buffer.from("3939000000", "hex"),
            response: Buffer.from("3B3B0000000E", "hex"),
            restart: false
        },
        restart: {
            receiverType: 28,
            receiverId: 1,
            cmdSet: 0, 
            cmdId: 11,
            data: Buffer.from('0001000000000000000000000000', 'hex')
        },
        patch: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            address: "0x7f7039ec",
            value: "0xE0D9"
        },
        debug: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 226
        },
        install: {
            skip: true,
            /* adb is enough to install wtfos
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            selinuxdisable: "0xFD32C0",
            engineering: false    */
        }
    },
    "gl170": {
        ota: {
            receiverType: 28,
            receiverId: 4,
            cmdSet: 0, 
            cmdId: 50,
            request: Buffer.from("3939000000", "hex"),
            response: Buffer.from("3B3B0000000E", "hex"),
            restart: false
        },
        restart: {
            receiverType: 28,
            receiverId: 1,
            cmdSet: 0, 
            cmdId: 11,
            data: Buffer.from('0001000000000000000000000000', 'hex')
        },
        patch: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            address: "0x7f7039ec",
            value: "0xE0D9"
        },
        debug: {
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 226
        },
        install: {
            skip: true,
            /* adb is enough to install wtfos
            receiverType: 28,
            receiverId: 2,
            cmdSet: 0, 
            cmdId: 244,
            selinuxdisable: "0xFD32C0",
            engineering: false    */
        }
    }
}

module.exports = devices