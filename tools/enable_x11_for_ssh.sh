#!/bin/bash

echo "=== Allow access to X11 display :0 ==="

# 强制暴力方式解除权限
sudo mv /var/run/lightdm/root/:0 /var/run/lightdm/root/:0.bak 2>/dev/null

# 创建一个空认证，禁止 Xorg 校验 Cookie
sudo touch /var/run/lightdm/root/:0
sudo chmod 777 /var/run/lightdm/root/:0

export DISPLAY=:0
unset XAUTHORITY

echo "Running xhost + ..."
xhost + 2>/dev/null

echo
echo "=== Done! Try running Electron now ==="
echo "npm run dev"
