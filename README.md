# margerine
### Episode 2: Revenge of the ¯\\_(ツ)_/¯

**margerine** is a root exploit and adb enabler for the **DJI Air Unit** (wm150), **Caddx Vista** (lt150), **FPV Goggles V1** (gl150) and **FPV Googles V2** (gl170 - or gp150 when flashed from DIY mode).

# tl;dr;
Install **nodejs** and the Javascript dependencies:

    npm install
Plug in the victim device via USB and run:

    node margerine.js unlock

## Notes
 - Requires an internet connection, as a certain signing procedure happens on [Drone-Hacks](https://drone-hacks.com/) server kindly provided by @bin4ry
 - The device being exploited should not be connected to anything else, i.e. Googles to AU or AU to Goggles.
 - On the Air Unit the SD card must be removed.
 - You have to run `node margerine.js lock` before the Assistant will allow you to flash firmwares again.
 - V2 Goggles must be flashed from DIY mode to 0606.
 - `result 224` - try again
 - Disables SELinux for you
 - On *150 remounts /proc/cmdline so that mp_state=engineering, which enables adb
 - With great power comes great responsibility - **you CAN bootloop/brick your device** if you break the right files and there's currently no low level recovery methods available. 

## What can I do with this?

 - Play [Doom](https://github.com/fpv-wtf/dfbdoom)
 - Pair an Air Unit (or Vista) to another Air Unit using `/system/bin/modem_info.sh reverse` on one of them.
 - Talk to connected devices via PING/TCP or UDP. Goggles are 192.168.41.1 and ground side is 192.168.41.2.
 - Build stuff with the latest Android NDK with the armv7 architecture and target platform of 23. 
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
	-  to enable using one of the GPIO keys to skip modification loading during startup
- Some kind of package manager
	- ipkg seems like an embeddable option
	- Device doesn't have internet access by default
		- Just adb push debs?
		- Route RNDIS
- A launcher
	- Needs hooking or injecting directly into the existing GUI
- More documentation

## It's spelled margarine

No, [it's not](https://www.youtube.com/watch?v=2z_gi6AniEo).

## Credits
While an original exploit, this would not have been even remotely possible without work by [@tmbinc](https://twitter.com/tmbinc) and [@bin4ry](https://drone-hacks.com/). Also a shout out to the rest of the OG's for all their work on [dji-firmware-tools](https://github.com/o-gs/dji-firmware-tools).

Special thanks go to: @jaanuke, @funnel and @fichek over on our [Discord](https://discord.gg/3rpnBBJKtU).

