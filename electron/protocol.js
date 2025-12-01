// JS port of protocol in app/comm/protocol.py
// Header: AA 55, Tail: 0D 0A, little-endian, CRC16 (Modbus) over [fid|type|len|payload]

const FRAME_HEADER_1 = 0xAA;
const FRAME_HEADER_2 = 0x55;
const FRAME_TAIL_1 = 0x0D;
const FRAME_TAIL_2 = 0x0A;

const DATA_TYPE_NONE = 0x00;
const DATA_UINT8_T = 0x01;
const DATA_FLOAT = 0x02;
const DATA_TYPE_TEXT = 0x03;
const DATA_UINT16_T = 0x04;
const DATA_UINT32_T = 0x05;
const DATA_MAX_LEN = 32; // protocol constraint

// Frame IDs: kept in sync with Python version
const U8_HEARTBEAT_REQ = 0x1000;
const F32_PRESSURE_SET_KPA = 0x1001;
const F32_LEFT_TEMP_SET_C = 0x1002;
const U8_LEFT_EYE_ENABLE = 0x1004;
const U8_RIGHT_EYE_ENABLE = 0x1005;
const U16_TREAT_TIME_MIN = 0x1006;
const U8_MODE_SELECT = 0x10C0;
const U8_START_TREATMENT = 0x10C1;
const U8_STOP_TREATMENT = 0x10C2;
const U8_SAVE_SETTINGS = 0x10C3;
const FRAME_ID_TEXT = 0x10F0;

const U8_HEARTBEAT_ACK = 0x1100;
const F32_LEFT_PRESSURE_VALUE = 0x1101;
const F32_RIGHT_PRESSURE_VALUE = 0x1102;
const F32_LEFT_TEMP_VALUE = 0x1103;
const F32_RIGHT_TEMP_VALUE = 0x1104;
const U8_SYSTEM_STATE = 0x1105; // reserved
const U8_ALARM_STATE = 0x1106; // reserved
const U8_LEFT_HEATER_PRESENT = 0x1107;
const U8_RIGHT_HEATER_PRESENT = 0x1108;
const U8_LEFT_HEATER_FUSE = 0x1109;
const U8_RIGHT_HEATER_FUSE = 0x110A;

function crc16_modbus(buf) {
  let crc = 0xFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x0001) crc = (crc >>> 1) ^ 0xA001;
      else crc = crc >>> 1;
    }
  }
  return crc & 0xFFFF;
}

function buildFrame(frameId, dataType, payload) {
  const fid = Buffer.alloc(2);
  fid.writeUInt16LE(frameId, 0);
  const len = Buffer.alloc(2);
  len.writeUInt16LE(payload.length, 0);
  const core = Buffer.concat([fid, Buffer.from([dataType]), len, payload]);
  const crc = Buffer.alloc(2);
  crc.writeUInt16LE(crc16_modbus(core), 0);
  return Buffer.concat([
    Buffer.from([FRAME_HEADER_1, FRAME_HEADER_2]),
    core,
    crc,
    Buffer.from([FRAME_TAIL_1, FRAME_TAIL_2])
  ]);
}

function frameU8(frameId, value) {
  const payload = Buffer.from([value & 0xFF]);
  return buildFrame(frameId, DATA_UINT8_T, payload);
}

function frameF32(frameId, value) {
  const payload = Buffer.alloc(4);
  payload.writeFloatLE(value, 0);
  return buildFrame(frameId, DATA_FLOAT, payload);
}

function frameU16(frameId, value) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16LE(value & 0xFFFF, 0);
  return buildFrame(frameId, DATA_UINT16_T, payload);
}

function frameText(text) {
  const buf = Buffer.from(text, 'utf8');
  return buildFrame(FRAME_ID_TEXT, DATA_TYPE_TEXT, buf);
}

function frameU32(frameId, value) {
  const payload = Buffer.alloc(4);
  payload.writeUInt32LE((value >>> 0), 0);
  return buildFrame(frameId, DATA_UINT32_T, payload);
}

module.exports = {
  // constants
  DATA_TYPE_NONE,
  DATA_UINT8_T,
  DATA_FLOAT,
  DATA_TYPE_TEXT,
  DATA_UINT16_T,
  DATA_UINT32_T,
  DATA_MAX_LEN,
  U8_HEARTBEAT_REQ,
  F32_PRESSURE_SET_KPA,
  F32_LEFT_TEMP_SET_C,
  U8_LEFT_EYE_ENABLE,
  U8_RIGHT_EYE_ENABLE,
  U16_TREAT_TIME_MIN,
  U8_MODE_SELECT,
  U8_START_TREATMENT,
  U8_STOP_TREATMENT,
  U8_SAVE_SETTINGS,
  FRAME_ID_TEXT,
  U8_HEARTBEAT_ACK,
  F32_LEFT_PRESSURE_VALUE,
  F32_RIGHT_PRESSURE_VALUE,
  F32_LEFT_TEMP_VALUE,
  F32_RIGHT_TEMP_VALUE,
  U8_SYSTEM_STATE,
  U8_ALARM_STATE,
  U8_LEFT_HEATER_PRESENT,
  U8_RIGHT_HEATER_PRESENT,
  U8_LEFT_HEATER_FUSE,
  U8_RIGHT_HEATER_FUSE,
  // functions
  crc16_modbus,
  buildFrame,
  frameU8,
  frameF32,
  frameU16,
  frameU32,
  frameText,
};
