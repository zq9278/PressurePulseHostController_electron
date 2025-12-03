const { SerialPort } = require('serialport');
const { list } = require('@serialport/list');
const { execFile } = require('child_process');
const { EventEmitter } = require('events');
const proto = require('./protocol');

const DEBUG_SERIAL = String(process.env.SERIAL_DEBUG || '').toLowerCase();
// 默认开启打印，设置 SERIAL_DEBUG=0/false 可关闭
const debugOn = (DEBUG_SERIAL === '1' || DEBUG_SERIAL === 'true');
const dbg = (...args) => { if (debugOn) console.log('[serial]', ...args); };
const HEADER = Buffer.from([0xAA, 0x55]);
const TAIL = Buffer.from([0x0D, 0x0A]);
const TX_GAP_MS = Math.max(0, Number(process.env.SERIAL_TX_GAP_MS || 8)); // ���������͵���ʱ

function describeFrame(buf) {
  try {
    if (!Buffer.isBuffer(buf)) return '';
    if (buf.length < 11) return '';
    if (buf[0] !== HEADER[0] || buf[1] !== HEADER[1]) return '';
    const fid = buf.readUInt16LE(2);
    const type = buf[4];
    const len = buf.readUInt16LE(5);
    const payloadHex = buf.slice(7, 7 + len).toString('hex');
    return `fid=0x${fid.toString(16)} type=0x${type.toString(16)} len=${len} payload=${payloadHex}`;
  } catch {
    return '';
  }
}

class SerialManager extends EventEmitter {
  constructor() {
    super();
    this._port = null;
    this._readerRunning = false;
    this._buffer = Buffer.alloc(0);
    this._shield = { leftPresent: false, rightPresent: false, leftFuse: false, rightFuse: false };
    this._txQueue = [];
    this._txBusy = false;
  }

  async listPorts() {
    // Collect candidates from multiple sources and merge/deduplicate
    const candidates = new Set();
    try {
      const ports = await list();
      (ports || []).forEach(p => { if (p && p.path) candidates.add(String(p.path).toUpperCase()); });
    } catch {}

    if (process.platform === 'win32') {
      // PowerShell Win32_SerialPort
      try {
        let output = await new Promise((resolve) => {
          execFile('powershell.exe', [
            '-NoProfile',
            '-Command',
            "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $a=Get-CimInstance Win32_SerialPort | Select-Object -ExpandProperty DeviceID; if($a){$a -join '`n'}"
          ], { windowsHide: true }, (_err, stdout, _stderr) => resolve(stdout || ''));
        });
        output = (output || '').replace(/\r/g, '').replace(/`n/g, '\n');
        output.split(/\n/).map(s => s.trim()).filter(Boolean).forEach(s => {
          if (/^COM\d+$/i.test(s)) candidates.add(s.toUpperCase());
        });
      } catch {}
      // 'mode' command
      try {
        const output = await new Promise((resolve) => {
          execFile('cmd.exe', ['/d','/s','/c','mode'], { windowsHide: true }, (_err, stdout, _stderr) => resolve(stdout || ''));
        });
        (output.match(/COM\d+/gi) || []).forEach(s => candidates.add(s.toUpperCase()));
      } catch {}
    }

    // Sort COMx numerically
    const arr = Array.from(candidates);
    arr.sort((a, b) => {
      const na = parseInt(a.replace(/^[^\d]*/,''), 10) || 0;
      const nb = parseInt(b.replace(/^[^\d]*/,''), 10) || 0;
      return na - nb || a.localeCompare(b);
    });
    return arr;
  }

  async connect(portPath, baudRate) {
    await this.disconnect();
    return new Promise((resolve) => {
      this._port = new SerialPort({
        path: portPath,
        baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        autoOpen: false,
      });
      dbg('opening port', portPath, '@', baudRate);
      this._port.open((err) => {
        if (err) {
          dbg('open failed', err?.message || err);
          this._port = null;
          resolve(false);
          return;
        }
        dbg('open ok');
        this.emit('connection-changed', true);
        this._startReader();
        resolve(true);
      });
    });
  }

  async disconnect() {
    if (this._port) {
      try {
        await new Promise((res) => this._port.close(() => res()));
      } catch {}
      this._port = null;
    }
    this._readerRunning = false;
    this._buffer = Buffer.alloc(0);
    this.emit('connection-changed', false);
    return true;
  }

  send(buf) {
    if (!this._port || !this._port.isOpen) return false;
    if (!Buffer.isBuffer(buf)) return false;
    this._txQueue.push(buf);
    if (!this._txBusy) this._drainTx();
    return true;
  }

  sendU8(frameId, value) {
    return this.send(proto.frameU8(frameId, value));
  }

  sendF32(frameId, value) {
    return this.send(proto.frameF32(frameId, value));
  }

  sendU16(frameId, value) {
    return this.send(proto.frameU16(frameId, value));
  }

  sendU32(frameId, value) {
    return this.send(proto.frameU32(frameId, value));
  }

  sendText(frameId /* unused, for API symmetry */, text) {
    return this.send(proto.frameText(text));
  }

  _startReader() {
    if (!this._port) return;
    this._readerRunning = true;
    this._port.on('data', (chunk) => {
      if (!chunk || !chunk.length) return;
      dbg('rx', chunk.toString('hex'));
      this._buffer = Buffer.concat([this._buffer, chunk]);
      this._drainFrames();
    });
    this._port.on('close', () => {
      this._readerRunning = false;
      this.emit('connection-changed', false);
    });
    this._port.on('error', (err) => {
      dbg('error', err?.message || err);
      // swallow, consumer can reconnect
    });
  }

  _drainTx() {
    if (!this._port || !this._port.isOpen) {
      this._txQueue = [];
      this._txBusy = false;
      return;
    }
    const next = this._txQueue.shift();
    if (!next) {
      this._txBusy = false;
      return;
    }
    this._txBusy = true;
    const summary = describeFrame(next);
    dbg('TX', next.toString('hex'), summary);
    this._port.write(next, (err) => {
      if (err) {
        dbg('write error', err?.message || err);
        this._txBusy = false;
        return;
      }
      this._port.drain(() => {
        setTimeout(() => this._drainTx(), TX_GAP_MS);
      });
    });
  }

  _drainFrames() {
    const MIN = 11; // AA55 + fid(2) + type(1) + len(2) + crc(2) + 0D0A
    let buf = this._buffer;
    // parse loop
    while (buf.length >= MIN) {
      const idx = buf.indexOf(HEADER);
      if (idx === -1) {
        dbg('drop bytes (no header)', buf.toString('hex'));
        buf = Buffer.alloc(0);
        break;
      }
      if (idx > 0) {
        dbg('skip noise', buf.slice(0, idx).toString('hex'));
        buf = buf.slice(idx);
        continue;
      }
      if (buf.length < MIN) break;
      const frameId = buf.readUInt16LE(2);
      const dataType = buf[4];
      const dataLen = buf.readUInt16LE(5);
      if (dataLen > proto.DATA_MAX_LEN) {
        dbg('invalid len', dataLen, 'frameId', frameId);
        buf = buf.slice(2); // drop header only
        continue;
      }
      const totalLen = 11 + dataLen;
      if (buf.length < totalLen) break; // incomplete frame, wait more

      const core = buf.slice(2, 7 + dataLen);
      const payload = buf.slice(7, 7 + dataLen);
      const crcRecv = buf.readUInt16LE(7 + dataLen);
      const tail1 = buf[9 + dataLen];
      const tail2 = buf[10 + dataLen];

      if (tail1 !== TAIL[0] || tail2 !== TAIL[1]) {
        dbg('tail mismatch, dropping 1', tail1, tail2);
        buf = buf.slice(1);
        continue;
      }
      if (proto.crc16_modbus(core) !== crcRecv) {
        dbg('crc fail fid', frameId.toString(16), 'len', dataLen);
        buf = buf.slice(1);
        continue;
      }
      dbg('RX frame', describeFrame(buf.slice(0, totalLen)));

      // Dispatch known feedback frames
      let handled = false;
      try {
        if (frameId === proto.F32_LEFT_PRESSURE_VALUE && dataType === proto.DATA_FLOAT && dataLen >= 4) {
          const valMmHg = payload.readFloatLE(0);
          this.emit('serial-data', 0, Number(valMmHg));
          handled = true;
        } else if (frameId === proto.F32_RIGHT_PRESSURE_VALUE && dataType === proto.DATA_FLOAT && dataLen >= 4) {
          const valMmHg = payload.readFloatLE(0);
          this.emit('serial-data', 2, Number(valMmHg));
          handled = true;
        } else if (frameId === proto.F32_LEFT_TEMP_VALUE && dataType === proto.DATA_FLOAT && dataLen >= 4) {
          const valC = payload.readFloatLE(0);
          this.emit('serial-data', 1, Number(valC));
          handled = true;
        } else if (frameId === proto.F32_RIGHT_TEMP_VALUE && dataType === proto.DATA_FLOAT && dataLen >= 4) {
          const valC = payload.readFloatLE(0);
          this.emit('serial-data', 3, Number(valC));
          handled = true;
        } else if (frameId === proto.U8_HEARTBEAT_ACK && dataType === proto.DATA_UINT8_T && dataLen >= 1) {
          this.emit('heartbeat-ack', payload[0]);
          handled = true;
        } else if (frameId === proto.U8_SYSTEM_STATE && dataType === proto.DATA_UINT8_T && dataLen >= 1) {
          this.emit('system-state', payload[0]);
          handled = true;
        } else if (frameId === proto.U8_ALARM_STATE && dataType === proto.DATA_UINT8_T && dataLen >= 1) {
          this.emit('alarm-state', payload[0]);
          handled = true;
        } else if (frameId === proto.U8_STOP_TREATMENT && dataType === proto.DATA_UINT8_T && dataLen >= 1) {
          this.emit('stop-treatment', payload[0]);
          handled = true;
        } else if (frameId === proto.U8_LEFT_HEATER_PRESENT && dataType === proto.DATA_UINT8_T && dataLen >= 0) {
          const val = payload.length ? payload[0] : 0;
          //console.log('[shield] left present frame payload=', val);
          this._shield.leftPresent = !!val;
          this._emitShieldState();
          handled = true;
        } else if (frameId === proto.U8_RIGHT_HEATER_PRESENT && dataType === proto.DATA_UINT8_T && dataLen >= 0) {
          const val = payload.length ? payload[0] : 0;
          //console.log('[shield] right present frame payload=', val);
          this._shield.rightPresent = !!val;
          this._emitShieldState();
          handled = true;
        } else if (frameId === proto.U8_LEFT_HEATER_FUSE && dataType === proto.DATA_UINT8_T && dataLen >= 0) {
          // Hardware: low level (0) means fuse blown
          const val = payload.length ? payload[0] : 0;
          //console.log('[shield] left fuse frame payload=', val);
          this._shield.leftFuse = val;
          this._emitShieldState();
          handled = true;
        } else if (frameId === proto.U8_RIGHT_HEATER_FUSE && dataType === proto.DATA_UINT8_T && dataLen >= 0) {
          // Hardware: low level (0) means fuse blown
          const val = payload.length ? payload[0] : 0;
          //console.log('[shield] right fuse frame payload=', val);
          this._shield.rightFuse = val;
          this._emitShieldState();
          handled = true;
        } else if (frameId === proto.U8_MODE_CURVES && dataType === proto.DATA_UINT8_T && dataLen >= 1) {
          const stage = String.fromCharCode(payload[0] || 0);
          this.emit('mode-curves', stage);
          handled = true;
        }
      } catch {}
      if (!handled) {
        //console.log('[serial] unhandled frame', describeFrame(buf.slice(0, totalLen)));
      }

      // consume this frame
      buf = buf.slice(totalLen);
    }
    this._buffer = buf;
  }
  _emitShieldState() {
    const leftFuseBlown = this._shield.leftFuse === 0;
    const rightFuseBlown = this._shield.rightFuse === 0;
    const left = this._shield.leftPresent && !leftFuseBlown;
    const right = this._shield.rightPresent && !rightFuseBlown;
    this.emit('shield-state', {
      left,
      right,
      leftPresent: !!this._shield.leftPresent,
      rightPresent: !!this._shield.rightPresent,
      leftFuse: this._shield.leftFuse,
      rightFuse: this._shield.rightFuse,
    });
  }

}

module.exports = { SerialManager };
