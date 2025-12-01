(function () {
  if (window.__PPHC_BOOTED__) return;
  window.__PPHC_BOOTED__ = true;

  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));
  const api = window.api;

  const MODE = { target: 20, t1: 25, t2: 35, t3: 50 };
  const TEMP_FIXED_C = 41.0;
  const AUTO_PORT = 'COM20';
  const AUTO_BAUD = 115200;

  const state = {
    connected: false,
    connecting: false,
    autoConnectTimer: null,
    mode: 1,
    running: false,
    countdownTimer: null,
    countdownEnd: 0,
    heartbeatTimer: null,
    heartbeatSeed: 0x55,
    lastHeartbeatAck: 0,
    buf: { 0: [], 1: [], 2: [], 3: [] },
    latest: { 0: null, 1: null, 2: null, 3: null },
    max: 360,
    currentView: 'home',
    systemState: null,
    alarmState: null,
    shields: { left: false, right: false },
    shieldDetail: { leftPresent: null, rightPresent: null, leftFuse: null, rightFuse: null },
    shieldExplicit: false,
    pendingSides: null,
  };

function showView(view) {
  state.currentView = view;
  const shell = document.querySelector('.app-shell');
  if (shell) shell.setAttribute('data-view', view);
  document.body.classList.remove('view-home', 'view-quick');
  document.body.classList.add(view === 'quick' ? 'view-quick' : 'view-home');
}

  const sparkTargets = [
    { key: 0, canvas: () => $('#sparkPressureLeft'), color: 'rgba(53,209,192,0.9)', maxVisible: 60000 },
    { key: 2, canvas: () => $('#sparkPressureRight'), color: 'rgba(245,165,36,0.9)', maxVisible: 60000 },
    { key: 1, canvas: () => $('#sparkTempLeft'), color: 'rgba(59,130,246,0.9)', maxVisible: 60 },
    { key: 3, canvas: () => $('#sparkTempRight'), color: 'rgba(239,68,68,0.9)', maxVisible: 60 },
  ];

  function setConnected(on) {
    state.connected = on;
    const connectionNode = $('#connectionState');
    if (connectionNode) connectionNode.textContent = on ? '已连接' : '未连接';
    const toggleBtn = $('#btnStartStop');
    if (toggleBtn) toggleBtn.disabled = !on;
    if (on) {
      if (state.autoConnectTimer) {
        clearTimeout(state.autoConnectTimer);
        state.autoConnectTimer = null;
      }
      startHeartbeat();
    } else {
      stopHeartbeat();
      state.running = false;
      state.lastHeartbeatAck = 0;
      updateRunState();
      scheduleAutoConnect(2000);
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    state.heartbeatTimer = setInterval(() => {
      if (!state.connected) return;
      state.heartbeatSeed = (state.heartbeatSeed + 1) & 0xff;
      api.sendU8(0x1000, state.heartbeatSeed);
    }, 1000);
  }

  function stopHeartbeat() {
    if (state.heartbeatTimer) {
      clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }
  }

  function scheduleAutoConnect(delay = 0) {
    if (state.autoConnectTimer) {
      clearTimeout(state.autoConnectTimer);
      state.autoConnectTimer = null;
    }
    state.autoConnectTimer = setTimeout(() => {
      state.autoConnectTimer = null;
      attemptAutoConnect();
    }, Math.max(0, delay));
  }

  async function attemptAutoConnect() {
    if (state.connected || state.connecting || !api?.connect) return;
    state.connecting = true;
    try {
      const ok = await api.connect(AUTO_PORT, AUTO_BAUD);
      if (ok) {
        setConnected(true);
        showAlert(`已连接 ${AUTO_PORT} @ ${AUTO_BAUD}`);
      }
    } catch (err) {
      console.warn('auto connect failed', err);
    } finally {
      state.connecting = false;
      if (!state.connected) scheduleAutoConnect(3000);
    }
  }

  function updateHeartbeatUI() {
    const age = state.lastHeartbeatAck ? Date.now() - state.lastHeartbeatAck : null;
    const label = $('#heartbeatAge');
    if (label) label.textContent = age != null ? `${age} ms` : '-- ms';
    if (age != null && age > 3000 && state.connected) {
      showAlert('心跳超时，请检查串口或设备');
    }
  }

  function updateModeMeta() {
    const pressSlider = document.getElementById('pressMmHg');
    const pressChip = document.getElementById('pressMmHgValue');
    if (pressSlider && pressChip) pressChip.textContent = `${pressSlider.value} mmHg`;
    const durationSlider = document.getElementById('treatDuration');
    if (durationSlider) {
      const minutes = Math.max(1, Math.min(15, Number(durationSlider.value || 10)));
      const target = document.getElementById('durationValue');
      if (target) target.textContent = `${minutes} min`;
      if (!state.running) {
        const node = document.getElementById('countdown');
        if (node) node.textContent = `${String(minutes).padStart(2, '0')}:00`;
      }
    }
  }

  function formatKpa(pa) {
    if (pa == null) return '--.-';
    return (pa / 1000).toFixed(1);
  }

  function formatMmHg(pa) {
    if (pa == null) return '--.-';
    return (pa * 0.00750062).toFixed(1);
  }

  function formatTemp(t) {
    if (t == null) return '--.-';
    return Number(t).toFixed(1);
  }

  function updateHeroClock() {
    const node = document.getElementById('heroClock');
    if (!node) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const text = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    node.textContent = text;
  }

  function pushData(ch, value) {
    const buf = state.buf[ch] || (state.buf[ch] = []);
    buf.push(value);
    if (buf.length > state.max) buf.shift();
    state.latest[ch] = value;
  }

  function drawSparkline(canvas, data, color, visibleMax) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data || !data.length) return;
    const samples = data.slice(-canvas.width);
    const maxVal = visibleMax || Math.max(...samples.map((v) => Math.abs(v) || 1));
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    samples.forEach((val, idx) => {
      const x = (idx / (samples.length - 1 || 1)) * canvas.width;
      const norm = Math.max(-1, Math.min(1, (val || 0) / maxVal));
      const y = canvas.height - (norm + 1) * 0.5 * canvas.height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function updateTelemetry() {
    const pl = $('#pressureLeft');
    const pr = $('#pressureRight');
    const pll = $('#pressureLeftLabel');
    const prl = $('#pressureRightLabel');
    const tl = $('#tempLeft');
    const tr = $('#tempRight');
    const tll = $('#tempLeftLabel');
    const trl = $('#tempRightLabel');
    if (pl) pl.textContent = formatMmHg(state.latest[0]);
    if (pr) pr.textContent = formatMmHg(state.latest[2]);
    if (pll) pll.textContent = `${formatKpa(state.latest[0])} kPa`;
    if (prl) prl.textContent = `${formatKpa(state.latest[2])} kPa`;
    if (tl) tl.textContent = `${formatTemp(state.latest[1])}°C`;
    if (tr) tr.textContent = `${formatTemp(state.latest[3])}°C`;
    if (tll) tll.textContent = `${formatTemp(state.latest[1])}°C`;
    if (trl) trl.textContent = `${formatTemp(state.latest[3])}°C`;
    sparkTargets.forEach(({ key, canvas, color, maxVisible }) => drawSparkline(canvas(), state.buf[key], color, maxVisible));
    updateHeartbeatUI();
  }

  function updateRunState() {
    const runNode = $('#runState');
    if (runNode) runNode.textContent = state.running ? '运行中' : '待命';
    const toggleBtn = $('#btnStartStop');
    if (toggleBtn) {
      toggleBtn.textContent = state.running ? '停止' : '开始';
      toggleBtn.classList.toggle('active', state.running);
    }
  }

  function showAlert(msg, duration = 2500) {
    const banner = $('#alertBanner');
    if (!banner) return;
    banner.textContent = msg;
    banner.hidden = false;
    if (banner._timer) clearTimeout(banner._timer);
    banner._timer = setTimeout(() => {
      banner.hidden = true;
    }, duration);
  }

  function updateCountdown() {
    const node = document.getElementById('countdown');
    if (!node || !state.running) return;
    const remain = Math.max(0, state.countdownEnd - Date.now());
    const sec = Math.ceil(remain / 1000);
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    node.textContent = `${m}:${s}`;
    if (remain <= 0) {
      // auto stop
      api.sendU8(0x10c2, 1);
      state.running = false;
      if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
      updateRunState();
      showAlert('治疗完成，已自动停止');
    }
  }

  function clearTelemetryBuffers() {
    Object.keys(state.buf).forEach((k) => (state.buf[k] = []));
    state.latest = { 0: null, 1: null, 2: null, 3: null };
    updateTelemetry();
  }

  function renderShieldIndicators() {
    const map = {
      left: {
        wrap: document.getElementById('shieldLeft'),
        state: document.getElementById('shieldLeftState'),
        present: document.getElementById('shieldLeftPresent'),
        fuse: document.getElementById('shieldLeftFuse'),
      },
      right: {
        wrap: document.getElementById('shieldRight'),
        state: document.getElementById('shieldRightState'),
        present: document.getElementById('shieldRightPresent'),
        fuse: document.getElementById('shieldRightFuse'),
      },
    };
    Object.entries(map).forEach(([side, refs]) => {
      if (!refs.wrap) return;
      const online = !!state.shields[side];
      refs.wrap.classList.toggle('active', online);
      if (refs.state) refs.state.textContent = online ? '在线' : '未在线';
      const presentKey = `${side}Present`;
      const fuseKey = `${side}Fuse`;
      const presentVal = state.shieldDetail[presentKey];
      const fuseVal = state.shieldDetail[fuseKey];
      if (refs.present) refs.present.textContent = presentVal == null ? '--' : presentVal ? '存在' : '不存在';
      if (refs.fuse) refs.fuse.textContent = fuseVal == null ? '--' : fuseVal ? '已熔断' : '正常';
    });
  }

  function openShieldAlert(text) {
    state.pendingSides = null;
    const modal = document.getElementById('shieldModal');
    const label = document.getElementById('shieldModalText');
    if (label) label.textContent = text;
    if (modal) modal.hidden = false;
  }

  function openShieldConfirm(sides) {

    state.pendingSides = sides;

    const modal = document.getElementById('shieldConfirm');

    const title = document.getElementById('shieldConfirmTitle');

    const text = document.getElementById('shieldConfirmText');

    if (title && text) {

      const label = sides.includes('left') ? '左' : '右';

      title.textContent = `仅${label}眼盾在线`;

      text.textContent = `检测到仅${label}通道可用，是否继续治疗？`;

    }

    if (modal) modal.hidden = false;

  }

  function startTreatmentForSides(sides) {
    const enableLeft = sides.includes('left');
    const enableRight = sides.includes('right');
    state.pendingSides = null;
    api.sendU8(0x1004, enableLeft ? 1 : 0);
    api.sendU8(0x1005, enableRight ? 1 : 0);
    api.sendF32(0x1002, TEMP_FIXED_C);
    const mmHg = Number(document.getElementById('pressMmHg')?.value || 250);
    const targetKpa = Number((mmHg * 0.133322).toFixed(2));
    api.sendF32(0x1001, targetKpa);
    api.sendU8(0x10c0, state.mode || 1);
    const min = Math.max(1, Math.min(15, Number(document.getElementById('treatDuration')?.value || 10)));
    api.sendU16(0x1006, min);
    api.sendU8(0x10c1, 1);
    state.running = true;
    state.countdownEnd = Date.now() + min * 60 * 1000;
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(updateCountdown, 250);
    updateRunState();
  }

  function handleStartClick() {
    if (!state.connected) return;
    const left = !!state.shields.left;
    const right = !!state.shields.right;
    if (left && right) {
      startTreatmentForSides(['left', 'right']);
      return;
    }
    if (!left && !right) {
      openShieldAlert('左右眼盾均无效，请检查接触情况后重试');
      return;
    }
    const active = left ? ['left'] : ['right'];
    openShieldConfirm(active);
  }

  function bindEvents() {
    document.getElementById('btnHomeQuick')?.addEventListener('click', () => showView('quick'));
    document.getElementById('btnBackHome')?.addEventListener('click', () => showView('home'));
    document.getElementById('btnExit')?.addEventListener('click', () => {
      if (api && api.exitApp) api.exitApp();
      else window.close();
    });
    document.getElementById('btnHomeDevice')?.addEventListener('click', () => showAlert('设备设置功能开发中'));

    document.getElementById('btnStartStop')?.addEventListener('click', () => {
      if (!state.connected) return;
      if (state.running) {
        api.sendU8(0x10c2, 1);
        state.running = false;
        if (state.countdownTimer) { clearInterval(state.countdownTimer); state.countdownTimer = null; }
        updateRunState();
      } else {
        handleStartClick();
      }
    });

    const pressureSlider = document.getElementById('pressMmHg');
    if (pressureSlider) pressureSlider.addEventListener('input', () => {
      const val = Number(pressureSlider.value).toFixed(0);
      const chip = document.getElementById('pressMmHgValue');
      if (chip) chip.textContent = `${val} mmHg`;
    });

    const durationSlider = document.getElementById('treatDuration');
    if (durationSlider) durationSlider.addEventListener('input', () => {
      const min = Math.max(1, Math.min(15, Number(durationSlider.value || 10)));
      const durationNode = document.getElementById('durationValue');
      if (durationNode) durationNode.textContent = `${min} min`;
      if (!state.running) {
        const node = document.getElementById('countdown');
        if (node) node.textContent = `${String(min).padStart(2, '0')}:00`;
      }
    });

    document.getElementById('modalClose')?.addEventListener('click', () => {
      const modal = document.getElementById('shieldModal');
      if (modal) modal.hidden = true;
    });
    document.getElementById('shieldModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shieldModal') e.currentTarget.hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('shieldModal');
        if (modal && !modal.hidden) modal.hidden = true;
        const confirm = document.getElementById('shieldConfirm');
        if (confirm && !confirm.hidden) confirm.hidden = true;
        state.pendingSides = null;
      }
    });
    document.getElementById('shieldConfirm')?.addEventListener('click', (e) => {
      if (e.target.id === 'shieldConfirm') {
        e.currentTarget.hidden = true;
        state.pendingSides = null;
      }
    });
    document.getElementById('confirmCancel')?.addEventListener('click', () => {
      const modal = document.getElementById('shieldConfirm');
      if (modal) modal.hidden = true;
      state.pendingSides = null;
    });
    document.getElementById('confirmContinue')?.addEventListener('click', () => {
      const modal = document.getElementById('shieldConfirm');
      if (modal) modal.hidden = true;
      if (state.pendingSides) startTreatmentForSides(state.pendingSides);
      state.pendingSides = null;
    });
  }

  function wireIpc() {

    api.onSerialData(({ ch, value }) => {
      pushData(ch, value);
    });
    api.onConnectionChanged((on) => setConnected(on));
    if (api.onHeartbeatAck) {
      api.onHeartbeatAck(() => {
        state.lastHeartbeatAck = Date.now();
        updateHeartbeatUI();
      });
    }
    if (api.onSystemState) {
      api.onSystemState((value) => {
        state.systemState = value;
        const sysNode = $('#systemState');
        if (sysNode) sysNode.textContent = value ?? '—';
        if (!state.shieldExplicit && typeof value === 'number') {
          state.shields.left = !!(value & 0x01);
          state.shields.right = !!(value & 0x02);
          renderShieldIndicators();
        }
      });
    }
    if (api.onAlarmState) {
      api.onAlarmState((value) => {
        state.alarmState = value;
        const alarmNode = $('#alarmState');
        if (alarmNode) alarmNode.textContent = value ?? '—';
      });
    }
    if (api.onStopTreatment) {
      api.onStopTreatment(() => {
        if (state.countdownTimer) {
          clearInterval(state.countdownTimer);
          state.countdownTimer = null;
        }
        state.running = false;
        updateRunState();
        showAlert('�豸�Զ�ֹͣ����������');
      });
    }
    if (api.onShieldState) {
      api.onShieldState(({ left, right, leftPresent, rightPresent, leftFuse, rightFuse }) => {
        state.shieldExplicit = true;
        state.shields.left = !!left;
        state.shields.right = !!right;
        if (leftPresent !== undefined) state.shieldDetail.leftPresent = leftPresent;
        if (rightPresent !== undefined) state.shieldDetail.rightPresent = rightPresent;
        if (leftFuse !== undefined) state.shieldDetail.leftFuse = leftFuse;
        if (rightFuse !== undefined) state.shieldDetail.rightFuse = rightFuse;
        renderShieldIndicators();
      });
    }
  }

  function init() {
    bindEvents();
    wireIpc();
    updateModeMeta();
    setInterval(updateTelemetry, 200);
    updateHeroClock();
    setInterval(updateHeroClock, 30000);
    // Default to home screen on load
    showView(state.currentView || 'home');
    const tChip = document.getElementById('tempFixedValue');
    if (tChip) tChip.textContent = `${TEMP_FIXED_C.toFixed(1)}°C`;
    scheduleAutoConnect(0);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
