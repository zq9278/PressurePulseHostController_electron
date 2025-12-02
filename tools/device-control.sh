#!/bin/bash

SOCK=${DEVICE_CONTROL_SOCK:-/run/device-control/device-control.sock}
HANDLER=${DEVICE_CONTROL_HANDLER:-/usr/local/bin/device-control-handler.sh}
SOCAT_BIN=${SOCAT_BIN:-/usr/bin/socat}
SOCK_GROUP=${DEVICE_CONTROL_GROUP:-device-control}
SOCK_MODE=${DEVICE_CONTROL_MODE:-660}

RUNDIR=$(dirname "$SOCK")
mkdir -p "$RUNDIR"
chmod 770 "$RUNDIR"
chown root:"$SOCK_GROUP" "$RUNDIR" 2>/dev/null || true

[ -e "$SOCK" ] && rm -f "$SOCK"

if [ ! -x "$SOCAT_BIN" ]; then
  echo "socat not found at $SOCAT_BIN"
  exit 1
fi

exec "$SOCAT_BIN" UNIX-LISTEN:"$SOCK",fork,reuseaddr,mode="$SOCK_MODE",user=root,group="$SOCK_GROUP" SYSTEM:"$HANDLER"
