const Sentry = require("@sentry/node");

const { SerialPort } = require('serialport')

const fs = require("fs")
const path = require("path")
const readline = require("readline")

const https = require("https");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const packer = require('./packer')

let seq = 1

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

async function getDevice(path, noexit) {

    return SerialPort.list()
    .then(portInfos => {
        //console.log(portInfos)
        var dji = path ? portInfos.filter(pinfo => { return pinfo.path===path }) : portInfos.filter(pinfo => `${pinfo.vendorId}`.match(/2CA3/i))
        if(!dji.length) {
            if(noexit) {
                return false
            }
            else {
                if(path) {
                    console.log(path + " not found")
                }
                else {
                    console.log("no dji devices detected\nyou may wish to specify a COM port, see node margerine.js --help")
                }
                process.exit(1)
            }

        }
        return dji[0].path
    })

}

async function waitDevice(extra, path) {
  //in case the serial port hasn't gone away yet
  await sleep(1000)
  while(!await getDevice(path, true)) {
    await sleep(1000)    
  }
  if(extra) {
    //so all services have time to start in case of a fresh boot
    await sleep(extra) 
    
    //make sure the device hasn't gone away
    if(!await getDevice(path, true)) {
      //start again
      return waitDevice(extra, path)
    }
  }
}



async function sendAndReceive(messageToSend, port, wait, timeout) {
    if(!timeout)
        timeout = 5
    port.write(messageToSend);
    if(!wait) {
        //let the write flush, otherwise "someone" can close the port before it actually happens
        //500ms is probably way too much, but we try to be conservative
        await sleep(500)
        return
    }
    let response = ''
    var i = 0;
    while(i < timeout) {
        i++
        response = port.read() // BLOCKING, PERHAPS WITH TIMEOUT EXCEPTION;
        if(response != null) {
            //in case the other end is spammy and our actual response hasn't arrived yet
            await sleep(1000)
            const additional = port.read()
            if(additional) {
                response = Buffer.concat([response, additional])
            }
            break
        }
        await sleep(1000)
    }
    return response
}



const talk = function(port, cmd, wait, timeout) {
    return new Promise((resolve, reject) => {
        const pack = new packer()
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
        pack.seq = seq
        seq++
        try {
            pack.pack();
            logInfo("request", Buffer.from(pack.toBuffer()).toString("hex"))

            //console.info("request", pack.toObject())
            //console.info("raw request", pack.toString())
            sendAndReceive(pack.toBuffer(), port, wait, timeout).then((res) => {
                if(!wait) {
                    resolve()
                    return
                }
                if(res) {
                    //console.info("raw response", res.toString("hex"))
                    const unpacker = new packer();
                    unpacker.unpack(res, pack)
                    //console.info("response", unpacker.toObject())
                    logInfo("response", unpacker.buffer.slice(0, unpacker.length).toString("hex"))
                    resolve(unpacker.toObject())
                }
                else {
                    reject("no response")
                }
            })
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
module.exports.getDevice = getDevice
module.exports.waitDevice = waitDevice