const Sentry = require("@sentry/node");

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const https = require("https");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const Session = require('./duml/Session')
const Packer = require('./duml/Packer')

const dumlSession = new Session();

// dumlSession.setUnmatchedListener((pack) => {
//     console.log("unmatched", pack.toString())
// })

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function confirm() {
    return new Promise((resolve, reject) => {
        rl.on('line', (input) => {
            if(input=="yes") {
                resolve(true)
            }
            if(input=="no") {
                reject("don't do it")
            }
        });
    })
}

function initSerialReceiver(port) {
    try {
        port.on('data', (data) => {
            // console.log(data)
            dumlSession.receive(data)
        })
    } catch (error) {
        console.log(error)
    }
}


const talk = function(port, cmd, wait, timeout) {
    return new Promise((resolve, reject) => {
        const pack = new Packer()
        pack.senderType = 10
        pack.senderId = 1
        pack.cmdType = 0
        pack.isNeedAck = (typeof cmd.isNeedAck === "undefined" ? 2 : cmd.isNeedAck)
        pack.encryptType = 0
        pack.receiverType = cmd.receiverType
        pack.receiverId = cmd.receiverId
        pack.cmdSet = cmd.cmdSet
        pack.cmdId = cmd.cmdId
        if(Buffer.isBuffer(cmd.data)) {
            pack.data = Uint8Array.from(cmd.data)
        }
        else {
            pack.data = cmd.data
        }


        pack.timeOut = 3000
        pack.seq = dumlSession.lastSeenSeq + 1;

        try {
            pack.pack();
            logInfo("request", Buffer.from(pack.toUint8Array()).toString("hex"))

            //console.info("request", pack.toObject())
            //console.info("raw request", pack.toString())

            // let the session know what we're sending
            dumlSession.transmit(pack, (wait ? 1000 : -1)).then((response) => {
                if(!response && wait) {
                    return reject("no response")
                } 

                if(!response && !wait) {
                    return resolve()
                }

                if(response) {
                    logInfo("response", response.toString())
                    return resolve(response.toObject())
                }
            }).catch(reject)

            // send the message 
            port.write(pack.toUint8Array());

        }
        catch (error) {
            reject(error)
        }
       
    });
}

const logInfo = function(category, message, level) {
    if(!level) {
        level = Sentry.Severity.Info
    }
    Sentry.addBreadcrumb({
        category: category,
        message: message,
        level: level,
      });
}

const downloadFile = (url, path) => {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
            if(res.statusCode === 301 || res.statusCode === 302) {
                resolve(downloadFile(res.headers.location, path))
                return
            }
            if(res.statusCode !== 200) {
                reject(res.statusCode)
                return
            }
            res.on('error', error => {
                reject(error)
            })
            const writeStream = fs.createWriteStream(path);
            res.pipe(writeStream);
            writeStream.on("finish", () => {
              writeStream.close();
              resolve(path)
            });
        });
        request.on('error', error => {
            reject(error)
        })
    })
}

const wrapSentry = async function(op, action) {
    const transaction = Sentry.startTransaction({
        op: op
    });
    Sentry.configureScope(scope => {
        scope.setSpan(transaction);
    });
    await action()
    .catch((error) => {
        console.log(error)
        Sentry.captureException(error)
        //let sentry finish it's error reporting
        return sleep(1000).then(() => {
            process.exit(1)
        })
    })
    .then(()=> {
        transaction.finish()
        //let sentry do it's thing before we terminate
        return sleep(1000).then(()=> {
            process.exit(0)
        })
    })
}

module.exports.sleep = sleep
module.exports.confirm = confirm
module.exports.talk = talk
module.exports.logInfo = logInfo
module.exports.wrapSentry = wrapSentry
module.exports.downloadFile = downloadFile
module.exports.initSerialReceiver = initSerialReceiver
