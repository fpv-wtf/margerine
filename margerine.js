#!/usr/bin/env node

const { SerialPort } = require('serialport')
const yargs = require('yargs')
const chalk = require('chalk')

/* we use Sentry to help debug in case of errors in the obfuscated build and basic analytics */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");


Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock, doShell} = require("./src/exploit")
const { wrapSentry } = require("./src/utils")
const constants = require("./src/constants")

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
            console.log("\nstartup patches should be disabled, assistant should be happy now")
        })
    })
    
})
.command('shell <command> [port]', 'execute a command on rooted device, once per reboot', (yargs) => {
  return yargs
    .positional('command', {
      describe: 'command to execute'
    })
    .positional('serialport', {
      describe: '(optional) serial port to connect to'
    })
}, (argv) => {
  return getDevice(argv).then((path) => {
    doShell(path, argv.command)  
  })
})



.demandCommand()
.argv