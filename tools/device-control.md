# Device Control Systemd Service

Root daemon that exposes hardware controls over a Unix socket for the Electron app. It currently supports:
- Backlight brightness (`/sys/class/backlight/*`)
- System volume via `amixer`

The daemon listens on `/run/device-control/device-control.sock` and accepts commands like `brightness 80` or `volume 50`. Electron talks to it automatically; no sudo is needed by the UI.

## Files (kept under `tools/`)
- `device-control.sh` – launches the socket server (uses `socat`).
- `device-control-handler.sh` – handles commands (runs as root).
- `device-control.service` – systemd unit template.

## Install steps (run as root once)
```bash
# Install runtime deps
apt-get update && apt-get install -y socat alsa-utils

# Create a dedicated group and add your desktop user
groupadd -r device-control 2>/dev/null || true
usermod -aG device-control $SUDO_USER

# Install scripts
install -m 755 tools/device-control.sh /usr/local/bin/device-control.sh
install -m 755 tools/device-control-handler.sh /usr/local/bin/device-control-handler.sh

# Install systemd unit
install -m 644 tools/device-control.service /etc/systemd/system/device-control.service
systemctl daemon-reload
systemctl enable --now device-control.service


sudo apt-get update && sudo apt-get install -y socat alsa-utils
sudo groupadd -r device-control 2>/dev/null || true
sudo usermod -aG device-control $USER   # log out/in afterward
sudo install -m 755 tools/device-control.sh /usr/local/bin/device-control.sh
sudo install -m 755 tools/device-control-handler.sh /usr/local/bin/device-control-handler.sh
sudo install -m 644 tools/device-control.service /etc/systemd/system/device-control.service
sudo systemctl daemon-reload
sudo systemctl enable --now device-control.service

```

Socket will be created at `/run/device-control/device-control.sock` with mode `660` and owned by `root:device-control`. Add your desktop user to the `device-control` group (see above). Adjust `DEVICE_CONTROL_GROUP` or `DEVICE_CONTROL_MODE` if you prefer different ownership/permissions.

## Customization
- Backlight path: set `BACKLIGHT_DIR=/sys/class/backlight/<name>` in the service environment or edit the handler script.
- Socket path: set `DEVICE_CONTROL_SOCK=/run/device-control/device-control.sock` (both service and Electron respect this env var).
- Socket group/permissions: set `DEVICE_CONTROL_GROUP` and `DEVICE_CONTROL_MODE` (default `device-control` and `660`).
- Audio binary: override `AMIXER_BIN` if `amixer` lives elsewhere.

## Protocol (plain text, newline terminated)
- `brightness <pct>` → `OK <raw> <max> <pct>` or `ERR`
- `brightness-raw <value>` → `OK <raw> <max> <pct>` or `ERR`
- `brightness-get` → `OK <raw> <max> <pct>` or `ERR`
- `volume <pct>` → `OK <pct>` or `ERR`
- `ping` → `PONG`

Percent values are clamped to 0–100 by the handler.

## Quick manual test
```bash
echo "brightness 50" | socat - UNIX-CONNECT:/run/device-control/device-control.sock
echo "brightness-get" | socat - UNIX-CONNECT:/run/device-control/device-control.sock
echo "volume 20" | socat - UNIX-CONNECT:/run/device-control/device-control.sock
```

If you get `ERR`, check that the service is active, the socket permissions allow your user, and the backlight path matches your hardware (`ls /sys/class/backlight`).

## Troubleshooting
- Permission denied on socket: confirm your user is in `device-control` (`id` shows the group). If not, `sudo usermod -aG device-control <user>` then log out/in (or `newgrp device-control`) and `sudo systemctl restart device-control`. Socket/dir should be `drwxrwx--- root:device-control /run/device-control` and `srw-rw---- root:device-control /run/device-control/device-control.sock`.
- Socket missing in app: ensure service is active (`systemctl status device-control`), and the socket path matches `DEVICE_CONTROL_SOCK` (default `/run/device-control/device-control.sock`).
- Backlight path wrong: set `BACKLIGHT_DIR=/sys/class/backlight/<name>` in the unit env and restart service. Use `ls /sys/class/backlight` to pick the correct entry.
- Temporary permissive test (not recommended long-term): `sudo chmod 666 /run/device-control/device-control.sock` then retry `socat`; revert to 660 once group access works.

## 调试阶段护盾熔断处理
- 当前调试版本只判断护盾是否存在，不因保险丝熔断拦截治疗流程。
- 量产前如需恢复保险丝校验，可在 Electron 进程启动时设置 `SHIELD_REQUIRE_FUSE=1`；同时将 `renderer/main.js` 中的 `SHIELD_REQUIRE_FUSE` 常量改为 `true`。
