// ============ Electron 主进程 ============
// 强制 Electron 使用 Wayland（Ozone）模式
process.env.XDG_SESSION_TYPE = "wayland";
process.env.WAYLAND_DISPLAY = "wayland-0";
// ① 必须先拿到 app 对象，再设置 GPU 开关
const { app, BrowserWindow, ipcMain } = require('electron');

// ===== Wayland GPU 配置 =====
app.commandLine.appendSwitch('ozone-platform', 'wayland');
app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
app.commandLine.appendSwitch('use-gl', 'egl');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// =======================================================
const path = require('path');
const { SerialManager } = require('./serial');

let mainWindow;
const serial = new SerialManager();


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
    fullscreenable: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

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
