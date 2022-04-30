const SerialPort = require('serialport')
const yargs = require('yargs')
const chalk = require('chalk')


const Adb = require('@devicefarmer/adbkit')
const fs = require("fs")
const tar = require("tar")
const crypto = require("crypto")
const proxyListen = require("./src/proxy").listen


/* we use Sentry to help debug in case of errors in the obfuscated build and basic analytics */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock } = require("./src/exploit")
const { wrapSentry, downloadFile } = require("./src/utils")
const { Server } = require('http')

const proxyPort = 8874

console.log(chalk.hex("#0057b7")("margerine - brought to you with love by the fpv.wtf team"))
console.log(chalk.hex("#ffd700")("special thanks to @tmbinc, @bin4ry, @jaanuke and @funnel\n"))

async function getDevice(argv) {
    if(argv.serialport) {
        return argv.serialport 
    }
    else {
        return SerialPort.list()
        .then(portInfos => {
            var dji = portInfos.filter(pinfo => pinfo.vendorId === '2CA3')
            if(!dji.length) {
                console.log("no dji devices detected\nyou may wish to specify a COM port, see node margerine.js --help")
                process.exit(1)
            }
            return dji[0].path
        })
    }
}


const argv = yargs
.command('unlock [serialport]', 'unlock device and enable adb', (yargs) => {
    return yargs
      .positional('serialport', {
        describe: '(optional) serial port to connect to'
      })
  }, (argv) => {
    wrapSentry("unlock", async () => {
        return await getDevice(argv)
        .then(unlock)
        .then(() => {
            console.log("\ndevice should be unlocked, try 'adb devices'")
            console.log("please consider donating: https://github.com/fpv-wtf/margerine#support-the-effort")
        })
        .catch((error)=>{
            console.error("couldn't do the magic. please read the notes in README.md, restart your device and try again")
            throw error
        })
    })
    
})
.command('lock [serialport]', 'disable startup patches', (yargs) => {
    return yargs
      .positional('serialport', {
        describe: '(optional) serial port to connect to'
      })
  }, (argv) => {
    wrapSentry("lock", () => {
        return getDevice(argv)
        .then(lock)
        .then(() => {
            console.log("\nstartup patches should be disabled now, assistant should be happy now")
        })
    })
    
})
.command('proxy [port]', 'start the built in http -> https proxy', (yargs) => {
    return yargs
      .positional('port', {
        describe: 'port to start ong'
      })
  }, (argv) => {
    const port = argv.port ? argv.port : proxyPort
    return proxyListen(port)
    
})
.command('payload [payload] [exec]', 'installs wtfos (by default) or another payload', (yargs) => {
    return yargs
      .positional('payload', {
        describe: '(optional) payload tgz url, path or directory to use'
      })
      .positional('exec', {
        describe: '(optional) what to execute after unpack'
      })
  }, (argv) => {
    //wrapSentry("payload", () => {
        const payload = argv.payload ? argv.payload : "https://github.com/fpv-wtf/wtfos/releases/latest/download/setup-payload.tgz"
        var setupExec = argv.exec ? argv.exec : (!argv.payload ? "cd /tmp/setup/ && sh bootsrap-wtfos.sh" : false)
        const client = Adb.createClient() 
        const uuid = crypto.randomUUID()
        var payloadtgz = "tmp/payload-"+uuid+".tgz"
        var keepPayload = true
        client.listDevices()
        .then(devices => {
            if(devices.length == 0) {
                throw "no adb devices found"
            }
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
                return proxyListen(proxyPort)
            })
            .then(() => {
                var exitCode = 255
                return client.shell(device.id, setupExec+"; echo \"exitCode:$?\"")
                .then(function(conn) {
                    return new Promise((resolve, reject) => {
                        conn.on('data', function(data) {
                        console.log(data.toString())
                        const match = data.toString().match(/exitCode:(\d*)/)
                        if(match) {
                            console.log(match)
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
                if(!argv.payload) {
                    console.log("installing margerine flavor and rebooting")
                    return client.shell(device.id, 'PATH="/opt/bin:$PATH" http_proxy="http://127.0.0.1:8089/" /opt/bin/opkg install default-margerine-proxy && reboot')
                    .then(Adb.util.readAll)
                    .then(output => {
                        console.log(output.toString())
                    })
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
    //})
    
})

.demandCommand()
.argv