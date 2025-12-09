// ============ Electron 主进程 ============
// 强制 Electron 使用 Wayland（Ozone）模式
// ① 必须先拿到 app 对象，再设置 GPU 开关
const { app, BrowserWindow, ipcMain } = require('electron');

// Disable GPU to avoid crashes when GLES drivers cannot be loaded
app.disableHardwareAcceleration();

// ===== GPU / display ?? =====
const useWayland =
  process.env.ELECTRON_USE_WAYLAND === '1' || process.env.XDG_SESSION_TYPE === 'wayland';
if (useWayland) {
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
  app.commandLine.appendSwitch('use-gl', 'egl');
} else {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// =======================================================
const fs = require('fs');
const path = require('path');
const { SerialManager } = require('./serial');

let mainWindow;
const serial = new SerialManager();

const BRIGHTNESS_PATH = '/sys/class/backlight/backlight2/brightness';
const MAX_BRIGHTNESS_PATH = '/sys/class/backlight/backlight2/max_brightness';
const DEFAULT_MAX_BRIGHTNESS = 255;

async function readNumber(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf8');
  const num = Number.parseInt(String(raw).trim(), 10);
  if (Number.isNaN(num)) throw new Error(`Invalid numeric content from ${filePath}`);
  return num;
}

async function resolveMaxBrightness() {
  try {
    return await readNumber(MAX_BRIGHTNESS_PATH);
  } catch (err) {
    console.warn('[PPHC] max brightness fallback ->', DEFAULT_MAX_BRIGHTNESS, err.message);
    return DEFAULT_MAX_BRIGHTNESS;
  }
}

async function getBrightnessPercent() {
  const max = await resolveMaxBrightness();
  const raw = await readNumber(BRIGHTNESS_PATH);
  const percent = Math.round((raw / max) * 100);
  return {
    raw,
    max,
    percent: Math.max(0, Math.min(100, percent)),
  };
}

async function setBrightnessPercent(percent) {
  const max = await resolveMaxBrightness();
  const pctRaw = Number(percent);
  const pct = Number.isFinite(pctRaw) ? Math.max(0, Math.min(100, pctRaw)) : 0;
  const raw = Math.round((pct / 100) * max);
  await fs.promises.writeFile(BRIGHTNESS_PATH, String(raw));
  return { raw, max, percent: pct };
}


// =============================================
// 4) 创建窗口
// =============================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 2560,
    height: 1600,
    minWidth: 2560,
    minHeight: 1600,
    maxWidth: 2560,
    maxHeight: 1600,
    resizable: false,
    fullscreen: true,
    kiosk: true,
    fullscreenable: true,
    alwaysOnTop: true,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  const query = {};
  if (process.env.PPHC_DEBUG_WEB) query.debugWeb = '1';
  if (process.env.PPHC_DEBUG_MOUSE) query.debugMouse = '1';
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'), { query });

  mainWindow.webContents.once('did-finish-load', () => {
    broadcastPorts();
  });

  // forward serial events
  serial.on('serial-data', (ch, value) => {
    mainWindow.webContents.send('serial-data', { ch, value });
  });
  serial.on('connection-changed', (connected) => {
    mainWindow.webContents.send('connection-changed', connected);
  });
  serial.on('heartbeat-ack', (value) => {
    mainWindow.webContents.send('heartbeat-ack', value);
  });
  serial.on('system-state', (value) => {
    mainWindow.webContents.send('system-state', value);
  });
  serial.on('alarm-state', (value) => {
    mainWindow.webContents.send('alarm-state', value);
  });
  serial.on('stop-treatment', (value) => {
    mainWindow.webContents.send('stop-treatment', value);
  });
  serial.on('shield-state', (value) => {
    mainWindow.webContents.send('shield-state', value);
  });
  serial.on('mode-curves', (value) => {
    mainWindow.webContents.send('mode-curves', value);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// =============================================
// 5) 列出 serial ports
// =============================================
async function broadcastPorts() {
  try {
    const ports = await serial.listPorts();
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('ports', ports);
    }
  } catch {}
}

// =============================================
// 6) app.whenReady()
// =============================================
app.whenReady().then(() => {
  createWindow();

  try {
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);
  } catch {}

  broadcastPorts();
  setInterval(broadcastPorts, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// =============================================
// 7) 退出
// =============================================
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// =============================================
// 8) IPC handlers
// =============================================
ipcMain.handle('list-ports', async () => serial.listPorts());
ipcMain.handle('connect', async (e, { port, baud }) => serial.connect(port, baud));
ipcMain.handle('disconnect', async () => serial.disconnect());
ipcMain.handle('send-u8', async (e, { frameId, value }) => serial.sendU8(frameId, value));
ipcMain.handle('send-f32', async (e, { frameId, value }) => serial.sendF32(frameId, value));
ipcMain.handle('send-u16', async (e, { frameId, value }) => serial.sendU16(frameId, value));
ipcMain.handle('send-text', async (e, { frameId, text }) => serial.sendText(frameId, text));
ipcMain.handle('send-u32', async (e, { frameId, value }) => serial.sendU32(frameId, value));
ipcMain.handle('exit-app', async () => {
  if (mainWindow) mainWindow.close();
  else app.quit();
  return true;
});
ipcMain.handle('get-brightness', async () => getBrightnessPercent());
ipcMain.handle('set-brightness', async (e, { percent }) => setBrightnessPercent(percent));
