const SerialPort = require('serialport')
const yargs = require('yargs')
const chalk = require('chalk')
const Adb = require('@devicefarmer/adbkit')
const fs = require("fs")
const tar = require("tar")
const crypto = require('crypto')

/* we use Sentry to help debug in case of errors in the obfuscated build and basic analytics */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock } = require("./src/exploit")
const { wrapSentry, getAllFiles } = require("./src/utils")
const { resolve } = require('@sentry/utils')

console.log(chalk.hex("#0057b7")("margerine - brought to you with love by the fpv.wtf team"))
console.log(chalk.hex("#ffd700")("special thanks to @tmbinc, @bin4ry, @jaanuke and @funnel\n"))

async function getDevice(argv) {
    if(argv.serialport) {
        return argv.serialport 
    }
    else {
        return SerialPort.list()
        .then(portInfos => {
            var dji = portInfos.filter(pinfo => `${pinfo.vendorId}`.match(/2CA3/i))
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
.command('payload [payloaddir] [setupexec]', 'copies the payload folder to / and executes setupexec', (yargs) => {
    return yargs
      .positional('payloaddir', {
        describe: '(optional) directory to use for root payload defaults to ./payload'
      })
      .positional('setupexec', {
        describe: '(optional) what to execute after copy'
      })
  }, (argv) => {
    //wrapSentry("payload", () => {
        const payloadDir = argv.payloaddir ? argv.payloaddir : "payload"
        const setupExec = argv.setupexec ? argv.setupexec : (payloadDir === "payload" ? "/blackbox/margerine/patch.sh" : false)
        const client = Adb.createClient()   


        client.listDevices()
        .then(devices => {
            if(devices.length == 0) {
                throw "no adb devices found"
            }
            const device = devices[0]
            const uuid = crypto.randomUUID()
            return client.shell(device.id, 'getprop ro.product.device')
            .then(Adb.util.readAll)
            .then(output => {
              const response = output.toString()
              if(!response.includes("wm150") && !response.includes("wm170")) {
                  throw "device not supported"
              }
              console.log("tarring")
              return tar.c({ file: "payload-"+uuid+".tar", cwd: payloadDir, gzip: false }, fs.readdirSync(payloadDir))
             
              
            })
            .then(transfer=> {
                console.log("uploading")
                return client.push(device.id, "payload-"+uuid+".tar", '/tmp/payload.tar')
            })
            .then(transfer=> {
                return new Promise((resolve, reject) => {
                    transfer.on('end', resolve)
                    transfer.on('error', reject)
                  });
            })
            .then(() => {
                fs.unlinkSync("payload-"+uuid+".tar")
                console.log("extracting")
                return client.shell(device.id, 'tar xvf /tmp/payload.tar -C / && rm /tmp/payload.tar --no-same-owner')
                .then(Adb.util.readAll)
                .then(output => {
                    console.log("unpacked", output.toString().trim())
                })
            })
            .then(() => {
                return client.shell(device.id, setupExec)
                .then(function(conn) {
                    return new Promise((resolve, reject) => {
                        conn.on('data', function(data) {
                        console.log(data.toString())
                        });
                        conn.on('close', function() {
                            console.log('payload delivery done')
                            resolve()
                        })
                    });
                })
                  
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
