#!/bin/bash

BACKLIGHT_DIR=${BACKLIGHT_DIR:-/sys/class/backlight/backlight2}
BRIGHTNESS="$BACKLIGHT_DIR/brightness"
MAX_BRIGHTNESS="$BACKLIGHT_DIR/max_brightness"
DEFAULT_MAX_BRIGHTNESS=${DEFAULT_MAX_BRIGHTNESS:-255}
AMIXER_BIN=${AMIXER_BIN:-/usr/bin/amixer}

clamp_pct() {
  local raw="$1"
  local num
  num=$(printf '%s' "$raw" | awk '{print int($1)}' 2>/dev/null)
  if [ -z "$num" ]; then num=0; fi
  if [ "$num" -lt 0 ]; then num=0; fi
  if [ "$num" -gt 100 ]; then num=100; fi
  echo "$num"
}

read_max_brightness() {
  if [ -r "$MAX_BRIGHTNESS" ]; then
    local val
    val=$(cat "$MAX_BRIGHTNESS" 2>/dev/null | head -n1 | tr -d '[:space:]')
    if printf '%s' "$val" | grep -Eq '^[0-9]+$'; then
      echo "$val"
      return 0
    fi
  fi
  echo "$DEFAULT_MAX_BRIGHTNESS"
}

read_brightness() {
  if [ -r "$BRIGHTNESS" ]; then
    cat "$BRIGHTNESS" 2>/dev/null | head -n1 | tr -d '[:space:]'
    return 0
  fi
  return 1
}

get_brightness_info() {
  local raw max pct
  raw=$(read_brightness) || return 1
  max=$(read_max_brightness)
  if [ -z "$max" ] || [ "$max" -le 0 ]; then
    max=$DEFAULT_MAX_BRIGHTNESS
  fi
  pct=$(( (raw * 100 + (max / 2)) / max ))
  echo "$raw" "$max" "$pct"
}

set_brightness_pct() {
  local pct
  pct=$(clamp_pct "$1")
  local max raw
  max=$(read_max_brightness)
  raw=$(( (pct * max + 50) / 100 ))
  echo "$raw" > "$BRIGHTNESS" 2>/dev/null || return 1
  echo "$raw" "$max" "$pct"
}

set_brightness_raw() {
  local raw="$1"
  if ! printf '%s' "$raw" | grep -Eq '^[0-9]+$'; then
    return 1
  fi
  echo "$raw" > "$BRIGHTNESS" 2>/dev/null || return 1
  local max pct
  max=$(read_max_brightness)
  pct=$(( (raw * 100 + (max / 2)) / max ))
  echo "$raw" "$max" "$pct"
}

set_volume_pct() {
  local pct
  pct=$(clamp_pct "$1")
  if [ -x "$AMIXER_BIN" ]; then
    "$AMIXER_BIN" -q set Master "${pct}%" >/dev/null 2>&1 || return 1
    echo "$pct"
    return 0
  fi
  return 1
}

handle_line() {
  local line="$1"
  # shellcheck disable=SC2086
  set -- $line
  local cmd="$1"
  shift || true

  if [ -z "$cmd" ]; then
    echo "UNKNOWN"
    return
  fi

  case "$cmd" in
    ping)
      echo "PONG"
      ;;
    brightness)
      if info=$(set_brightness_pct "${1:-0}"); then
        echo "OK $info"
      else
        echo "ERR"
      fi
      ;;
    brightness-raw)
      if info=$(set_brightness_raw "${1:-0}"); then
        echo "OK $info"
      else
        echo "ERR"
      fi
      ;;
    brightness-get)
      if info=$(get_brightness_info); then
        echo "OK $info"
      else
        echo "ERR"
      fi
      ;;
    volume)
      if vol=$(set_volume_pct "${1:-0}"); then
        echo "OK $vol"
      else
        echo "ERR"
      fi
      ;;
    quit|exit)
      echo "BYE"
      exit 0
      ;;
    *)
      echo "UNKNOWN"
      ;;
  esac
}

while IFS= read -r line; do
  handle_line "$line"
done
