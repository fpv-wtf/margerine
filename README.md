# margerine
### Episode 2: Revenge of the ¯\\\_(ツ)_/¯

**margerine** is a root exploit and adb enabler for the **DJI Air Unit** (wm150), **Caddx Vista** (lt150), **FPV Goggles V1** (gl150), and **FPV Googles V2** (gl170/gp150) from the same people that brought you [USB Video Out](https://github.com/fpv-wtf/voc-poc).

Currently only works reliably on **Windows** and **Mac OS X**, Linux has strange issues in the USB stack - YMMW.

# tl;dr;
Install **nodejs** and the Javascript dependencies:

    npm install

Remove your SD card for the duration of the exploit, power up the victim device, connect it via USB and run:

    node margerine.js unlock

Have fun! [consider donating](https://github.com/fpv-wtf/margerine#support-the-effort) and join us on our [Discord]([Discord](https://discord.gg/3rpnBBJKtU)).

## Troubleshooting
 - **waving wand, result e0** - make sure you've followed all the instructions below, reboot your Goggles and try again. It should eventually work.
 - The device might change it's COM port number on Windows (eg. COM4 -> COM5) in the middle of the exploit and error out. That's a good sign! Look up the new COM port in Device Manager (if auto detect didn't work for you) and re-run the exploit to finish everything up.
 - The device being exploited should not be connected to anything else; i.e. Googles to AU or AU to Goggles.
 - Make sure there's no SD card in your device.
 - V2 Goggles must be flashed from DIY mode to 01.00.0606.
  - Checking the menus in DIY mode is insufficient. Make sure Assistant says "Refresh" next to 0606, rather than "Downgrade". If you see "Downgrade", go ahead and downgrade.
  - If you've flashed to 01.02.0015 in drone mode the exploit won't work and you can't downgrade at the moment, sorry.
  - Despite the bigger version number 01.02.0020 in drone mode, goggles can be downgraded to 0606 in DIY mode.


## Other notes
 - Requires an internet connection. Certain signing procedure happens on [Drone-Hacks](https://drone-hacks.com/) server kindly provided by @bin4ry
 - Takes few minutes. Make sure your battery is not too low when powering AU/Vista from a quad.
 - You have to run `node margerine.js lock` before the Assistant will allow you to flash firmwares again.
 - Disables SELinux for you
 - On *150 remounts /proc/cmdline so that mp_state=engineering, which enables adb
 - With great power comes great responsibility - **you CAN bootloop/brick your device** if you modify or delete important files. There are currently no low level recovery methods available. 

## What can I do with this?

 - Play [Doom](https://github.com/fpv-wtf/dfbdoom)
 - Customize the UI theme in /system/gui/xml/themes/defult/theme.xml
 - Pair an Air Unit (or Vista) to another Air Unit using `/system/bin/modem_info.sh reverse` on one of them.
 - Talk to connected devices via TCP or UDP. Goggles are 192.168.41.1 and air side is 192.168.41.2.
 - Debug USB devices such as input on V2 Goggles (no OTG on V1) by `adb shell`-ing into a connected Vista/AU and then using `adb connect 192.168.41.1 && adb shell` to debug wirelessily.
 - Build stuff with the latest Android NDK armv7 architecture, target platform 23. 
    - A modified Directfb framebuffer library is available for drawing to an ARGB target to be overlaid on top of the video feed.
    - Direct access to the framebuffer is not available, except via special undocumented DMI bullsh*t. 
    - Check out the [dfbdoom](https://github.com/fpv-wtf/dfbdoom/tree/main/jni) project. 
 - Reverse engineer stuff with IDA, Ghidra and/or [Frida](https://github.com/fpv-wtf/frida-core).

## Advanced usage

    node margerine --help
    margerine <command>
    
    Commands:
      margerine unlock [serialport]    unlock device and enable adb
      margerine lock [serialport]      disable adb and relock device
    
    Options:
      --help     Show help                                                 [boolean]
      --version  Show version number                                       [boolean]

## How does this work

Magic unicorn dust and sprinkles. For the time being, we're keeping the details private.

## To-do

- Chroot for any/all modifications
	-  to enable using one of the GPIO keys to skip loading modifications during startup
- Some kind of package manager
	- ipkg seems like an embeddable option
	- Device doesn't have internet access by default
		- Just adb push packages?
		- Route RNDIS
- A launcher
	- Needs hooking or injecting directly into the existing GUI
- More documentation
- Eventually create a nice web GUI

## It's spelled margarine

No, [it's not](https://www.youtube.com/watch?v=2z_gi6AniEo).

## Credits
While this is an original exploit by [Joonas Trussmann](https://fpv.wtf/#/about), it would not have been even remotely possible without work by [@tmbinc](https://twitter.com/tmbinc) and [@bin4ry](https://drone-hacks.com/). Also a shout out to the rest of the OG's for all their work on [dji-firmware-tools](https://github.com/o-gs/dji-firmware-tools).

Special thanks go to: @jaanuke, @funnel and @fichek over on our [Discord](https://discord.gg/3rpnBBJKtU).

## Support the effort

This took **A LOT** of my free time over the past year. If you'd like, you can send some ETH to `0xbAB1fec80922328F27De6E2F1CDBC2F322397637` or BTC to `3L7dE5EHtyd2b1tXBwdnWC2MADkV2VTbrq` or [buy me a coffe](https://www.buymeacoffee.com/fpv.wtf). I would really appreciate it.
