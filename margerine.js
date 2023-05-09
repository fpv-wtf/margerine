#!/usr/bin/env node

const yargs = require('yargs')
const chalk = require('chalk')

/* we use Sentry to help debug in case of errors in the obfuscated build and basic analytics */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");


Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock, doShell, doReboot} = require("./src/exploit")
const { wrapSentry, getDevice, waitDevice } = require("./src/utils")
const constants = require("./src/constants")

const argv = yargs
.command('unlock [serialport]', 'unlock device and enable adb', (yargs) => {
    return yargs
      .positional('serialport', {
        describe: '(optional) serial port to connect to'
      })
  }, (argv) => {
    wrapSentry("unlock", async () => {
        console.log(chalk.hex("#0057b7")("margerine - brought to you with love by the fpv.wtf team"))
        console.log(chalk.hex("#ffd700")("special thanks to @tmbinc, @bin4ry, @jaanuke and @funnel\n"))
        return await getDevice(argv.serialport)
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
        return getDevice(argv.serialport)
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
  return getDevice(argv.serialport).then((path) => {
    doShell(path, argv.command)  
  })
})
.command('reboot [port]', 'reboot a connected device', (yargs) => {
  return yargs
    .positional('serialport', {
      describe: '(optional) serial port to connect to'
    })
}, (argv) => {
  return getDevice(argv.serialport).then((path) => {
    doReboot(path)  
  })
})
.command('wait', 'wait for a DJI serial device to appear (only works if the serial port can be auto detected)', (yargs) => {
  return yargs
}, (argv) => {
  console.log("waiting for DJI serial device")
  return waitDevice(10000).then(() => {
    console.log("DJI serial device detected")
    process.exit(0)
  })
})



.demandCommand()
.argv