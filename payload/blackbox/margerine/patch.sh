#!/system/bin/sh
set -e
set -x

SYS_ORIG_MOUNT_PATH=/tmp/system.orig
SYS_NEW_MOUNT_PATH=/tmp/system.new

export $(grep -v '^#' /blackbox/margerine/device/$(getprop ro.product.device).env | xargs)
#disable selinux
busybox devmem ${MARGERINE_SELINUX_DISABLE} 32 0

## useful for faster testing
if [[ -z "${SKIP_SYSTEM_IMAGE}" ]]; then
    #copy the current active slots system image to our overlay image
    dd if=/dev/block/mirror/system of=/blackbox/margerine/system.img
fi


#remount system so we can patch it
mount -o rw,remount /system

#prepare new cmdline for *150
cat /proc/cmdline | busybox sed -e 's/state=production/state=engineering/g' -e 's/verity=1/verity=0/g' -e 's/debug=0/debug=1/g' > /blackbox/margerine/cmdline

cd /blackbox/margerine/
mkdir -p ${SYS_ORIG_MOUNT_PATH}
#/system might already be our image if re-running payload
busybox mount -t ext4 -o rw /dev/block/mirror/system ${SYS_ORIG_MOUNT_PATH}/
#clean any previous margerine installation
sed -i '/#margerine/,/#\/margerine/d' ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}

#insert out startup patches right after #!/system/bin/sh
sed '/^#!\/system\/bin\/sh$/r startup-tpl.sh' ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}

#restore selinux context for the target script as it's the one disabling selinux...
chgrp shell ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
chcon u:object_r:dji_service_exec:s0 ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
restorecon ${SYS_ORIG_MOUNT_PATH}/bin/${MARGERINE_TARGET_SCRIPT}
sync
umount ${SYS_ORIG_MOUNT_PATH}/
rm -r ${SYS_ORIG_MOUNT_PATH}

#make our mkshrc.d work
mkdir -p  ${SYS_NEW_MOUNT_PATH}
busybox mount -t ext4 -o loop,rw system.img  ${SYS_NEW_MOUNT_PATH}/
sed -i '/#margerine/,/#\/margerine/d'  ${SYS_NEW_MOUNT_PATH}/etc/mkshrc
sed -i -e "/: place customisations above this line/ {r mkshrc-tpl.sh" -e 'N}'  ${SYS_NEW_MOUNT_PATH}/etc/mkshrc
sync
umount ${SYS_NEW_MOUNT_PATH}/
rm -r  ${SYS_NEW_MOUNT_PATH}

#prep fs for entware
mount -o rw,remount /
mkdir -p /bin
ln -s /system/bin/sh /bin/sh
ln -s /blackbox/margerine/opt /opt
mount -o ro,remount /
#use proxy provided by margerine
export http_proxy="http://127.0.0.1:8080/"
#install entware
wget -O - http://bin.entware.net/armv7sf-k3.2/installer/alternative.sh | sh
export PATH="/opt/bin:/opt/sbin:$PATH"
#add our repo
echo "src/gz fpv-wtf http://repo.fpv.wtf" >> /opt/etc/opkg.conf
opkg update
#install margerine-system meta package (dinit, busybox)
opkg install margerine-system

sync
##all done
#reboot