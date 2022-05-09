#!/usr/bin/env node

const { SerialPort } = require('serialport')
const yargs = require('yargs')
const chalk = require('chalk')

const proxyListen = require("./src/proxy").listen


/* we use Sentry to help debug in case of errors in the obfuscated build and basic analytics */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");


Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock } = require("./src/exploit")
const { wrapSentry } = require("./src/utils")
const constants = require("./src/constants")
const installPayload = require("./src/payload").install

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
          return installPayload("https://github.com/fpv-wtf/wtfos/releases/latest/download/setup-payload.tgz", "cd /tmp/setup/ && sh bootsrap-wtfos.sh", true)
        })
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
            console.log("\nstartup patches should be disabled, assistant should be happy now")
        })
    })
    
})
.command('proxy [port]', 'start the built in http -> https proxy', (yargs) => {
    return yargs
      .positional('port', {
        describe: 'port to start ong'
      })
  }, (argv) => {
    const port = argv.port ? argv.port : constants.defaultProxyPort
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
    wrapSentry("payload", () => {
        const payload = argv.payload ? argv.payload : "https://github.com/fpv-wtf/wtfos/releases/latest/download/setup-payload.tgz"
        var setupExec = argv.exec ? argv.exec : (!argv.payload ? "cd /tmp/setup/ && sh bootsrap-wtfos.sh" : false)
        return installPayload(payload, setupExec, true)
    }) 
})

.demandCommand()
.argv