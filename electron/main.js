const electronModule = require('electron');
const { app, BrowserWindow, ipcMain } = electronModule || {};
const path = require('path');
const { SerialManager } = require('./serial');

let mainWindow;
const serial = new SerialManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 2560,
    height: 1600,
    minWidth: 2560,
    maxWidth: 2560,
    minHeight: 1600,
    maxHeight: 1600,
    resizable: false,
    fullscreenable: false,
    frame: false, // no OS title bar / buttons
    autoHideMenuBar: true, // hide "File Edit View" bar
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Load local renderer
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  // When renderer has finished loading, push ports once
  mainWindow.webContents.once('did-finish-load', () => {
    broadcastPorts();
  });

  // Forward serial events to renderer
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function broadcastPorts() {
  try {
    const ports = await serial.listPorts();
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('ports', ports);
    }
  } catch {}
}

app.whenReady().then(() => {
  createWindow();
  // Remove default app menu completely
  try {
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);
  } catch {}
  // periodically broadcast port list to renderer
  broadcastPorts();
  setInterval(broadcastPorts, 3000);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers (protocol unchanged)
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
