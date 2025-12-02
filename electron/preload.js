const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listPorts: () => ipcRenderer.invoke('list-ports'),
  connect: (port, baud) => ipcRenderer.invoke('connect', { port, baud }),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  sendU8: (frameId, value) => ipcRenderer.invoke('send-u8', { frameId, value }),
  sendF32: (frameId, value) => ipcRenderer.invoke('send-f32', { frameId, value }),
  sendU16: (frameId, value) => ipcRenderer.invoke('send-u16', { frameId, value }),
  sendU32: (frameId, value) => ipcRenderer.invoke('send-u32', { frameId, value }),
  sendText: (frameId, text) => ipcRenderer.invoke('send-text', { frameId, text }),
  exitApp: () => ipcRenderer.invoke('exit-app'),
  getBrightness: () => ipcRenderer.invoke('get-brightness'),
  setBrightness: (percent) => ipcRenderer.invoke('set-brightness', { percent }),
  onSerialData: (cb) => ipcRenderer.on('serial-data', (_, payload) => cb(payload)),
  onConnectionChanged: (cb) => ipcRenderer.on('connection-changed', (_, connected) => cb(connected)),
  onPorts: (cb) => ipcRenderer.on('ports', (_, ports) => cb(ports)),
  onHeartbeatAck: (cb) => ipcRenderer.on('heartbeat-ack', (_, value) => cb(value)),
  onSystemState: (cb) => ipcRenderer.on('system-state', (_, value) => cb(value)),
  onAlarmState: (cb) => ipcRenderer.on('alarm-state', (_, value) => cb(value)),
  onStopTreatment: (cb) => ipcRenderer.on('stop-treatment', (_, value) => cb(value)),
  onShieldState: (cb) => ipcRenderer.on('shield-state', (_, value) => cb(value)),
  onModeCurves: (cb) => ipcRenderer.on('mode-curves', (_, value) => cb(value)),
});
