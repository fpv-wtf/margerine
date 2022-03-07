const SerialPort = require('serialport')
const yargs = require('yargs')
const chalk = require('chalk')


/* we use Sentry to help debug in case of errors in the obfuscated build */
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: "https://f3110f11c161495da96d9930b41ee20b@o660067.ingest.sentry.io/6247631",
  tracesSampleRate: 1.0,
});


const { lock, unlock } = require("./src/exploit")


console.log(chalk.hex("#0057b7")("margerine - brought to you with love by the fpv.wtf team"))
console.log(chalk.hex("#ffd700")("special thanks to @tmbinc, @bin4ry, @jaanuke and @funnel\n"))

async function getDevice(argv) {
    if(argv.serialport) {
        return argv.serialport 
    }
    else {
        return SerialPort.list()
        .then(async portInfos => {
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
    getDevice(argv)
    .then(unlock)
    .then(() => {
        console.log("\ndevice should be unlocked, try 'adb devices'")
        process.exit(0)
    })
    .catch((error)=>{
        console.error(error)
        console.error("couldn't do the magic. please read the notes in README.md, restart your device and try again")
        Sentry.captureException(error)
        
        //let sentry finish reporting the error
        setTimeout(() => { process.exit(1) }, 1000)
        

    })
})
.command('lock [serialport]', 'disable startup patches', (yargs) => {
    return yargs
      .positional('serialport', {
        describe: '(optional) serial port to connect to'
      })
  }, (argv) => {
    getDevice(argv)
    .then(lock)
    .then(() => {
        console.log("\nstartup patches should be disabled now, you should probably re-flash your device")
        process.exit(0)
    })
    .catch((error)=>{
        Sentry.captureException(error)
        console.error(error)
        //let sentry finish reporting the error
        setTimeout(() => { process.exit(1) }, 1000)
    })
})
.demandCommand()
.argv