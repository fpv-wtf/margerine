  #/system/bin/sh

  mount -o rw,remount /
  mkdir /bin
  ln -s /system/bin/sh /bin/sh
  ln -s /blackbox/margerine/opt /opt
  mount -o ro,remount /
  echo "entware: /opt and /bin/sh created" | tee /dev/kmsg