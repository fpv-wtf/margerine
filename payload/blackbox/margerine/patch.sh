#!/system/bin/sh
set -e
set -x

#DON'T RUN ME I'LL MESS YOU UP FO REAL
#reboot

SYS_ORIG_MOUNT_PATH=/system
SYS_NEW_MOUNT_PATH=/tmp/system.new

export $(grep -v '^#' /blackbox/margerine/device/$(getprop ro.product.device).env | xargs)
#disable selinux
busybox devmem ${MARGERINE_SELINUX_DISABLE} 32 0

cd /blackbox/margerine/

# useful for faster testing
if [[ -z "${SKIP_SYSTEM_IMAGE}" ]]; then
    #copy the current active slots system image to our overlay image
    dd if=/dev/block/mirror/system of=./system.img
fi

#remount system so we can patch it
mount -o rw,remount /system

#prepare new cmdline for *150
cat /proc/cmdline | busybox sed -e 's/state=production/state=engineering/g' -e 's/verity=1/verity=0/g' -e 's/debug=0/debug=1/g' > ./cmdline

#because when you build in wsl from your windows home dir permissions are bad
find . -name \*.sh -type f -exec chmod u+x {} \;
find ./startup.d -type f -exec chmod u+x {} \;
#/system might already be our image if re-running payload
mount -o rw,remount /system #busybox mount -t ext4 -o rw /dev/block/mirror/system ${SYS_ORIG_MOUNT_PATH}/
if [[ ! -f ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}.orig ]]
then
    cp ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT} ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}.orig
fi

cp ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT} ./
#clean any previous margerine installation
sed -i '/#margerine/,/#\/margerine/d' ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
#sed -i '/#margerine/,/#\/margerine/d' ${MARGERINE_TARGET_SCRIPT}

#insert out startup patches right after #!/system/bin/sh
sed -i '/^#!\/system\/bin\/sh$/r startup-tpl.sh' ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
#sed -i '/^#!\/system\/bin\/sh$/r startup-tpl.sh' ${MARGERINE_TARGET_SCRIPT}

#restore selinux context for the target script as it's the one disabling selinux...
chgrp shell ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
chcon u:object_r:dji_service_exec:s0 ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
restorecon ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}

#remove old margerine startup patch
#if grep -q "#margerine" ${SYS_ORIG_MOUNT_PATH}/bin/setup_usb_serial.sh; then
#    sed -i '/#margerine/,/#\/margerine/d' ${SYS_ORIG_MOUNT_PATH}/bin/setup_usb_serial.sh
#    chgrp shell ${SYS_ORIG_MOUNT_PATH}/bin/setup_usb_serial.sh
#    chcon u:object_r:dji_service_exec:s0 ${SYS_ORIG_MOUNT_PATH}/bin/setup_usb_serial.sh
#    restorecon ${SYS_ORIG_MOUNT_PATH}/bin/setup_usb_serial.sh
#fi

sync

#make our mkshrc.d work
umount ${SYS_NEW_MOUNT_PATH}/ || true
mkdir -p  ${SYS_NEW_MOUNT_PATH}
busybox mount -t ext4 -o loop,rw system.img ${SYS_NEW_MOUNT_PATH}/
if [[ ! -f ${SYS_NEW_MOUNT_PATH}/etc/mkshrc.orig ]]
then
    cp ${SYS_NEW_MOUNT_PATH}/etc/mkshrc ${SYS_NEW_MOUNT_PATH}/etc/mkshrc.orig
fi
sed -i '/#margerine/,/#\/margerine/d'  ${SYS_NEW_MOUNT_PATH}/etc/mkshrc
sed -i -e "/: place customisations above this line/ {r mkshrc-tpl.sh" -e 'N}'  ${SYS_NEW_MOUNT_PATH}/etc/mkshrc
sync
busybox umount ${SYS_NEW_MOUNT_PATH}/
rm -r  ${SYS_NEW_MOUNT_PATH}

#prep fs for entware
mount -o rw,remount /
mkdir -p /bin
ln -sf /system/bin/sh /bin/sh
if [[ ! -L /opt ]] ; then
    ln -sf /blackbox/margerine/opt /opt
fi
mount -o ro,remount /
#use proxy provided by margerine
#don't worry, it upgrade http to https
export http_proxy="http://127.0.0.1:8089/"

chmod u+x /opt/bin/busybox
ln -sf /opt/bin/busybox /opt/bin/wget 
export PATH="/opt/bin:/opt/sbin:$PATH"
#install entware
wget -O - http://bin.entware.net/armv7sf-k3.2/installer/alternative.sh | sh -e
#add our repo
sed -i '/#margerine/,/#\/margerine/d' /opt/etc/opkg.conf
echo "#margerine\nsrc/gz fpv-wtf http://repo.fpv.wtf/pigeon\n#/margerine" >> /opt/etc/opkg.conf
opkg update
#install margerine-system meta package (dinit, busybox)
opkg install dinit

sync

##all done
#reboot