
const fs = require("fs")
const tar = require("tar")
const crypto = require("crypto")

const Adb = require('@devicefarmer/adbkit')

const { downloadFile, sleep } = require("./utils")
const proxyListen = require("./proxy").listen
const constants = require("./constants")


module.exports.install = (payload, setupExec, flavor) => {
    const client = Adb.createClient({host:"127.0.0.1"}) 
    const uuid = crypto.randomUUID()
    var payloadtgz = "tmp/payload-"+uuid+".tgz"
    var keepPayload = true
    return client.listDevices()
    .then(devices => {
        if(devices.length == 0) {
            throw "no adb devices found"
        }
        //todo: loop through and find a dji device
        //also maybe allow the user to specify one?
        const device = devices[0]
        return client.shell(device.id, 'getprop ro.product.device')
        .then(Adb.util.readAll)
        .then(output => {
          const response = output.toString()
          if(!response.includes("wm150") && !response.includes("wm170")) {
              throw "device not supported"
          }
          
          if(fs.existsSync(payload) && fs.lstatSync(payload).isDirectory()) {
            if(!fs.existsSync("tmp")) {
                fs.mkdirSync("tmp")
            }
            keepPayload = false
            console.log("tarring")
            return tar.c({ file: payloadtgz, cwd: payload, gzip: true, portable: true }, fs.readdirSync(payload))
          }
          else if(payload.startsWith("https://")) {
            if(!fs.existsSync("tmp")) {
                fs.mkdirSync("tmp")
            }
            keepPayload = false
            return downloadFile(payload, payloadtgz)
          }
          else if(payload.endsWith(".tgz") || payload.endsWith(".tar.gz")) {
              payloadtgz = payload
          }
          
        })
        .then(()=> {
            console.log("uploading")
            return client.push(device.id, payloadtgz, '/tmp/payload.tgz')
        })
        .then(transfer=> {
            return new Promise((resolve, reject) => {
                transfer.on('end', resolve)
                transfer.on('error', reject)
              });
        })
        .then(() => {
            if(!keepPayload) {
                fs.unlinkSync(payloadtgz)
            }
            console.log("extracting")
            return client.shell(device.id, 'busybox gunzip -c /tmp/payload.tgz | tar xvf - -C /tmp')
            .then(Adb.util.readAll)
            .then(output => {
                console.log("unpacked", output.toString().trim())
            })
        })
        .then(() => {
            return proxyListen(constants.defaultProxyPort)
        })
        .then(() => {
            var exitCode = 255
            return client.shell(device.id, setupExec+"; echo \"exitCode:$?\"")
            .then(function(conn) {
                return new Promise((resolve, reject) => {
                    conn.on('data', function(data) {
                    const execOut = data.toString().trim()
                    console.log(execOut)
                    const match = execOut.match(/exitCode:(\d*)/)
                    if(match) {
                        exitCode = parseInt(match[1])
                    }
                    });
                    conn.on('close', function() {
                        if(exitCode === 0) {
                            console.log('payload delivery done')
                            resolve()
                        }
                        else {
                            reject("payload execution failed with exit code: "+exitCode)
                        }
    
                    })
                });
            })   
        }).then(() => {
            if(flavor) {
                console.log("installing margerine flavor and rebooting")
                return client.shell(device.id, 'PATH="/opt/bin:$PATH" http_proxy="http://127.0.0.1:8089/" /opt/bin/opkg install default-margerine-proxy && reboot')
                .then(Adb.util.readAll)
                .then(output => {
                    console.log(output.toString())
                })
                .then(sleep(15000))
            }
        })
    })
    .then(() => {
        console.log("\npayload installed")
        process.exit()
    })
    .catch(error => {
        console.log(error)
        process.exit(1)
    })
}
