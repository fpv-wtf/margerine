#margerine
export $(grep -v '^#' /blackbox/margerine/device/$(getprop ro.product.device).env | xargs)
busybox devmem ${MARGERINE_SELINUX_DISABLE} 32 0
echo "margerine: disabled selinux" | tee /dev/kmsg


#doesn't work (nor matter) on gl170
mount -o bind,ro /blackbox/margerine/cmdline /proc/cmdline || true

if getevent -i -l | grep -q "KEY_PROG3\\*"; 
then
  echo "margerine: Bind button down, skipping margerine startup" | tee /dev/kmsg
  #make a noise to confirm
  for i in `seq 1 3`; do
    test_pwm 0 2349 60 1 1
    sleep 0.1
    test_pwm 0 2300 50 1 0
    sleep 0.1
  done
else
  echo "margerine: starting margerine" | tee /dev/kmsg
  busybox mount -t ext4 -o loop,rw /blackbox/margerine/system.img /system
  echo "margerine: system remounted" | tee /dev/kmsg

  busybox run-parts /blackbox/margerine/startup.d/
  echo "margerine: ran all startup.d parts" | tee /dev/kmsg

  /system/bin/${MARGERINE_TARGET_SCRIPT} || true
  exit 0
fi

#/margerine
#MUST have empty row at the end

