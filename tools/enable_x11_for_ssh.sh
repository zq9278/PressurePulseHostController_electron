#!/bin/bash

# 设置用户名（你的本地桌面用户）
USER_NAME="orin-nano"
USER_HOME="/home/${USER_NAME}"
XAUTH_FILE="${USER_HOME}/.Xauthority"
ROOT_XAUTH="/var/run/lightdm/root/:0"

echo "=== Fixing X11 access for SSH session ==="

# 1) 检查 root 的 Xauthority 是否存在
if [ ! -f "$ROOT_XAUTH" ]; then
    echo "❌ Error: root Xauthority file not found: $ROOT_XAUTH"
    echo "确保 Xorg 正在运行，并使用 lightdm 方式登录桌面。"
    exit 1
fi

# 2) 复制 root 的 cookie 给普通用户
echo "Copy Xauthority from root..."
sudo cp "$ROOT_XAUTH" "$XAUTH_FILE"
sudo chown "${USER_NAME}:${USER_NAME}" "$XAUTH_FILE"

# 3) 设置环境变量
echo "Exporting DISPLAY and XAUTHORITY..."
export DISPLAY=:0
export XAUTHORITY="$XAUTH_FILE"

# 4) 开启 xhost
echo "Running xhost + ..."
xhost + 2>/dev/null

echo ""
echo "=== Done ==="
echo "你现在可以在 SSH 中运行 GUI，例如："
echo " npm run dev"
echo "或 electron ."
