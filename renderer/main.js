(function () {
  if (window.__PPHC_BOOTED__) return;
  window.__PPHC_BOOTED__ = true;

  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));
  const api = window.api;

  // Basic error logging so UI issues are visible in DevTools console
  window.addEventListener('error', (e) => {
    console.error('[PPHC] window error:', e.error || e.message, e);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[PPHC] unhandled rejection:', e.reason);
  });

  const TRANSLATIONS = {
    zh: {
      appTitle: '眼部热脉冲控制',
      exit: '退出程序',
      homeTitle: '眼部热脉冲治疗系统',
      homeSubtitle: 'Thermal Pulsation System',
      homeDesc: '以加热与压力脉冲的双重协作实现治疗，支持快速、精准、稳定的疗程控制。',
      btnDeviceLabel: '设置',
      btnDeviceSub: 'Device Settings',
      btnQuickLabel: '开始治疗',
      btnQuickSub: 'Start Session',
      quickTitle: '快速治疗',
      summaryOverline: '实时数据',
      summaryTitle: '压力 / 温度',
      curveOverline: '实时曲线',
      curveTitle: '数据曲线',
      legendPressureLeft: '左眼压力',
      legendPressureRight: '右眼压力',
      legendTempLeft: '左眼温度',
      legendTempRight: '右眼温度',
      leftEye: '左眼',
      rightEye: '右眼',
      temperature: '温度',
      shieldPanelTitle: '眼盾状态',
      shieldPresentLabel: '是否在线',
      shieldFuseLabel: '是否熔断',
      shieldOnline: '在线',
      shieldOffline: '未连接',
      shieldPresentYes: '在线',
      shieldPresentNo: '离线',
      fuseOk: '正常',
      fuseBlown: '熔断',
      controlOverline: '控制参数',
      controlTitle: '快速治疗',
      pressureEyebrow: '目标压力',
      pressureStrong: '目标值 (mmHg)',
      durationEyebrow: '治疗时间',
      durationStrong: '以分钟为单位',
      start: '开始',
      stop: '停止',
      running: '运行中',
      standby: '待机',
      runStateLabel: '挤压状态',
      alarmLabel: '报警',
      systemStateLabel: '系统状态',
      connectionStateLabel: '连接状态',
      heartbeatLabel: '心跳延迟',
      settingsTitle: '系统设置',
      navDisplay: '显示',
      navDisplayHint: '亮度 / 屏保',
      navSound: '声音',
      navSoundHint: '音量 / 提示',
      navLanguage: '语言',
      navLanguageHint: '中文 / English',
      navAbout: '关于',
      navAboutHint: '版本 / 日志',
      displayCardTitle: '显示',
      displayCardDesc: '模仿 macOS 样式的柔和背光与模糊效果。',
      brightnessLabel: '屏幕亮度',
      brightnessHint: '调整 UI 辉度',
      brightnessApplyFailed: '设置亮度失败，请检查权限或背光设备',
      screensaverLabel: '屏保等待',
      screensaverHint: '自动进入屏保的倒计时',
      soundTitle: '声音',
      volumeLabel: '系统音量',
      volumeHint: '播放提示与反馈',
      chimeLabel: '提示音',
      chimeHint: '重要操作播放提示',
      languageTitle: '语言',
      languageDesc: '中英文切换，实时调整界面文案。',
      languageLabel: '界面语言',
      languageHint: '偏好选择',
      langZh: '中文',
      langEn: 'English',
      aboutTitle: '关于 / 日志',
      aboutVersion: '程序版本',
      aboutFirmware: '固件版本',
      aboutCheck: '检查更新',
      aboutLogs: '打开日志',
      currentStage: '当前阶段',
      stageIdle: '待机',
      stageRising: '升压',
      stageHold: '恒压',
      stagePulse: '脉冲',
      modeLabelRise: '升压段',
      modeLabelHold: '恒压段',
      modeLabelPulse: '脉冲段',
      shieldModalTitle: '眼盾未就绪',
      shieldModalText: '请确认左右眼盾均已佩戴并与接口接触可靠。',
      shieldLostTitle: '眼盾断开',
      shieldLostText: '检测到眼盾离线，治疗已停止，请检查佩戴情况并重试。',
      shieldLostBack: '返回',
      shieldConfirmTitleLeft: '左侧眼盾异常',
      shieldConfirmTitleRight: '右侧眼盾异常',
      shieldConfirmTextLeft: '检测到左侧通路异常，是否只治疗右侧？',
      shieldConfirmTextRight: '检测到右侧通路异常，是否只治疗左侧？',
      confirmCancel: '取消',
      confirmContinue: '继续',
      connected: '已连接',
      disconnected: '未连接',
      heartbeatTimeout: '心跳超时，请检查设备连接',
      countdownDone: '治疗完成，已自动停止',
      stoppedByDevice: '设备停止了本次治疗',
      shieldMissing: '未检测到眼盾，无法启动，请佩戴后再试',
      checkingUpdates: '检查更新中...',
      logsHint: '日志目录打开功能待接入',
    },
    en: {
      appTitle: 'Thermal Pulsation Control',
      exit: 'Exit',
      homeTitle: 'Thermal Pulsation System',
      homeSubtitle: 'Thermal Pulsation System',
      homeDesc: 'Heat and pressure pulses working together for a fast, precise, and safe treatment experience.',
      btnDeviceLabel: 'Device Settings',
      btnDeviceSub: 'Hardware & Preferences',
      btnQuickLabel: 'Start Treatment',
      btnQuickSub: 'Quick Session',
      quickTitle: 'Quick Session',
      summaryOverline: 'Live Data',
      summaryTitle: 'Pressure / Temp',
      curveOverline: 'Live Curves',
      curveTitle: 'Signal Traces',
      legendPressureLeft: 'Left Pressure',
      legendPressureRight: 'Right Pressure',
      legendTempLeft: 'Left Temp',
      legendTempRight: 'Right Temp',
      leftEye: 'Left Eye',
      rightEye: 'Right Eye',
      temperature: 'Temp',
      shieldPanelTitle: 'Shield Status',
      shieldPresentLabel: 'Wear',
      shieldFuseLabel: 'Fuse',
      shieldOnline: 'Online',
      shieldOffline: 'Offline',
      shieldPresentYes: 'Worn',
      shieldPresentNo: 'Not Worn',
      fuseOk: 'OK',
      fuseBlown: 'Blown',
      controlOverline: 'Controls',
      controlTitle: 'Quick Treatment',
      pressureEyebrow: 'Target Pressure',
      pressureStrong: 'Setpoint (mmHg)',
      durationEyebrow: 'Duration',
      durationStrong: 'Minutes',
      start: 'Start',
      stop: 'Stop',
      running: 'Running',
      standby: 'Standby',
      runStateLabel: 'Run State',
      alarmLabel: 'Alarm',
      systemStateLabel: 'System State',
      connectionStateLabel: 'Connection',
      heartbeatLabel: 'Heartbeat Age',
      settingsTitle: 'Settings',
      navDisplay: 'Display',
      navDisplayHint: 'Brightness / Saver',
      navSound: 'Sound',
      navSoundHint: 'Volume / Chime',
      navLanguage: 'Language',
      navLanguageHint: 'Chinese / English',
      navAbout: 'About',
      navAboutHint: 'Version / Logs',
      displayCardTitle: 'Display',
      displayCardDesc: 'macOS-inspired soft lighting and glassy blur.',
      brightnessLabel: 'Brightness',
      brightnessHint: 'Adjust UI luminance',
      brightnessApplyFailed: 'Failed to set brightness. Check permission or backlight device.',
      screensaverLabel: 'Screen Saver',
      screensaverHint: 'Idle timeout before saver',
      soundTitle: 'Sound',
      volumeLabel: 'System Volume',
      volumeHint: 'Prompts and feedback',
      chimeLabel: 'Chime',
      chimeHint: 'Play prompts on key actions',
      languageTitle: 'Language',
      languageDesc: 'Switch between Chinese and English instantly.',
      languageLabel: 'Interface Language',
      languageHint: 'Preference',
      langZh: '中文',
      langEn: 'English',
      aboutTitle: 'About / Logs',
      aboutVersion: 'App Version',
      aboutFirmware: 'Firmware Version',
      aboutCheck: 'Check Updates',
      aboutLogs: 'Open Logs',
      currentStage: 'Stage',
      stageIdle: 'Idle',
      stageRising: 'Rising',
      stageHold: 'Hold',
      stagePulse: 'Pulse',
      modeLabelRise: 'Rising',
      modeLabelHold: 'Hold',
      modeLabelPulse: 'Pulse',
      shieldModalTitle: 'Shields Not Ready',
      shieldModalText: 'Please confirm both shields are worn and firmly connected.',
      shieldLostTitle: 'Shield Offline',
      shieldLostText: 'Shield disconnected, treatment stopped. Check fit and retry.',
      shieldLostBack: 'Back',
      shieldConfirmTitleLeft: 'Left Shield Issue',
      shieldConfirmTitleRight: 'Right Shield Issue',
      shieldConfirmTextLeft: 'Left channel fault detected. Continue treating right only?',
      shieldConfirmTextRight: 'Right channel fault detected. Continue treating left only?',
      confirmCancel: 'Cancel',
      confirmContinue: 'Continue',
      connected: 'Connected',
      disconnected: 'Disconnected',
      heartbeatTimeout: 'Heartbeat timeout, check device link',
      countdownDone: 'Session complete, stopped automatically',
      stoppedByDevice: 'Device stopped the session',
      shieldMissing: 'No shields detected. Please wear shields before starting.',
      checkingUpdates: 'Checking updates...',
      logsHint: 'Log opening is not wired yet',
    },
  };

let currentLang = 'zh';
const t = (key) => (TRANSLATIONS?.[currentLang] || TRANSLATIONS.zh)[key] || key;

  const MODE = { target: 20, t1: 25, t2: 35, t3: 50 };
  const TEMP_FIXED_C = 42.0;
  const AUTO_PORT = '/dev/ttyS1';
  const AUTO_BAUD = 115200;

  // 阶段文案：r 上升阶段，h 保持阶段，p 脉冲阶段
  const STAGE_LABELS = {
    r: 'modeLabelRise',
    h: 'modeLabelHold',
    p: 'modeLabelPulse',
  };
  const STAGE_CLASS = {
    r: 'stage-rising',
    h: 'stage-hold',
    p: 'stage-pulse',
  };

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
    activeSides: [],
    shieldDropShown: false,
    modeStage: '--',
    settings: {
      brightness: 80,
      screensaver: 10,
      volume: 60,
      language: 'zh',
      autoConnect: true,
      appVersion: '0.1.0',
      firmwareVersion: '1.2.3',
      playChime: true,
    },
    targets: {
      pressure: null,
      temp: TEMP_FIXED_C,
    },
  };

  let brightnessApplyTimer = null;
  const clampBrightness = (val) => Math.max(0, Math.min(100, Math.round(Number(val) || 0)));

  function showView(view) {
    const next = ['home', 'quick', 'settings'].includes(view) ? view : 'home';
    state.currentView = next;
    const shell = document.querySelector('.app-shell');
    if (shell) shell.setAttribute('data-view', next);
    document.body.classList.remove('view-home', 'view-quick', 'view-settings');
    document.body.classList.add(`view-${next}`);
    console.info('[PPHC] view ->', next);
  }

  const getPressureTarget = () => {
    const sliderVal = Number(document.getElementById('pressMmHg')?.value || 0);
    if (state.running && Number.isFinite(state.targets.pressure)) return state.targets.pressure;
    return sliderVal;
  };

  const getTempTarget = () => {
    if (Number.isFinite(state.targets.temp)) return state.targets.temp;
    return TEMP_FIXED_C;
  };

  const sparkTargets = [
    {
      key: 0,
      canvas: () => $('#sparkPressureLeft'),
      color: 'rgba(53,209,192,0.9)',
      yMin: 0,
      yMax: 700,
      target: () => getPressureTarget(),
    },
    {
      key: 2,
      canvas: () => $('#sparkPressureRight'),
      color: 'rgba(245,165,36,0.9)',
      yMin: 0,
      yMax: 700,
      target: () => getPressureTarget(),
    },
    {
      key: 1,
      canvas: () => $('#sparkTempLeft'),
      color: 'rgba(59,130,246,0.9)',
      visibleMax: 60,
      target: () => getTempTarget(),
    },
    {
      key: 3,
      canvas: () => $('#sparkTempRight'),
      color: 'rgba(239,68,68,0.9)',
      visibleMax: 60,
      target: () => getTempTarget(),
    },
  ];

  function isShieldHealthy(side) {
    const presentRaw = state.shields[side];
    const presentNum = typeof presentRaw === 'string' ? Number(presentRaw) : Number(presentRaw);
    return presentRaw === true || presentNum === 1; // 高电平 = 在线
  }

  function setConnected(on) {
    state.connected = on;
    const connectionNode = $('#connectionState');
    if (connectionNode) connectionNode.textContent = on ? t('connected') : t('disconnected');
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
      setModeStage('--');
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
        showAlert(`${t('connected')} ${AUTO_PORT} @ ${AUTO_BAUD}`);
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
      showAlert(t('heartbeatTimeout'));
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

  function applyLanguage(lang) {
    const next = lang === 'en' ? 'en' : 'zh';
    currentLang = next;
    state.settings.language = next;
    document.documentElement.lang = next === 'en' ? 'en' : 'zh';
    const set = (selector, key) => {
      const el = document.querySelector(selector);
      if (el && TRANSLATIONS?.[next]?.[key]) el.textContent = TRANSLATIONS[next][key];
    };

    set('title', 'appTitle');
    set('#btnExit', 'exit');
    set('#homeScreen h1', 'homeTitle');
    set('#homeScreen .hero-subtitle', 'homeSubtitle');
    set('#homeScreen .hero-desc', 'homeDesc');
    set('#btnHomeDevice .label', 'btnDeviceLabel');
    set('#btnHomeDevice small', 'btnDeviceSub');
    set('#btnHomeQuick .label', 'btnQuickLabel');
    set('#btnHomeQuick small', 'btnQuickSub');
    set('#quickScreen .section-title', 'quickTitle');
    set('#settingsScreen .section-title', 'settingsTitle');
    set('.summary-panel .panel-overline', 'summaryOverline');
    set('.summary-panel .panel-title', 'summaryTitle');
    set('.curve-panel .panel-overline', 'curveOverline');
    set('.curve-panel .panel-title', 'curveTitle');

    const legendMap = {
      '.legend.pressure-left': 'legendPressureLeft',
      '.legend.pressure-right': 'legendPressureRight',
      '.legend.temp-left': 'legendTempLeft',
      '.legend.temp-right': 'legendTempRight',
    };
    Object.entries(legendMap).forEach(([sel, key]) => set(sel, key));

    const pressureHeads = $$('.curve-card.pressure .curve-head > div:first-child');
    if (pressureHeads[0]) pressureHeads[0].textContent = t('legendPressureLeft');
    if (pressureHeads[1]) pressureHeads[1].textContent = t('legendPressureRight');
    const tempHeads = $$('.curve-card.temp .curve-head > div:first-child');
    if (tempHeads[0]) tempHeads[0].textContent = t('legendTempLeft');
    if (tempHeads[1]) tempHeads[1].textContent = t('legendTempRight');

    const circleLabels = $$('.circle-label');
    if (circleLabels[0]) circleLabels[0].textContent = t('leftEye');
    if (circleLabels[1]) circleLabels[1].textContent = t('rightEye');
    const tempSpans = $$('.circle-temp span:first-child');
    tempSpans.forEach((el) => { el.textContent = t('temperature'); });

    set('.shield-panel .panel-title', 'shieldPanelTitle');
    const eyeLabels = $$('.shield-tile .eye-label');
    if (eyeLabels[0]) eyeLabels[0].textContent = t('leftEye');
    if (eyeLabels[1]) eyeLabels[1].textContent = t('rightEye');
    const metaLabels = $$('.shield-tile .meta-row span:first-child');
    metaLabels.forEach((el, idx) => {
      el.textContent = idx % 2 === 0 ? t('shieldPresentLabel') : t('shieldFuseLabel');
    });

    set('.treatment-panel .panel-overline', 'controlOverline');
    set('.treatment-panel .panel-title', 'controlTitle');
    set('.slider-card[data-kind=\"pressure\"] .eyebrow', 'pressureEyebrow');
    set('.slider-card[data-kind=\"pressure\"] strong', 'pressureStrong');
    set('.slider-card[data-kind=\"duration\"] .eyebrow', 'durationEyebrow');
    set('.slider-card[data-kind=\"duration\"] strong', 'durationStrong');

    const infoLabels = $$('.info-panel .label');
        if (infoLabels[0]) infoLabels[0].textContent = t('runStateLabel');
    if (infoLabels[1]) infoLabels[1].textContent = t('alarmLabel');
    if (infoLabels[2]) infoLabels[2].textContent = t('systemStateLabel');
    if (infoLabels[3]) infoLabels[3].textContent = t('connectionStateLabel');
    if (infoLabels[4]) infoLabels[4].textContent = t('heartbeatLabel');
    const connectionNode = $('#connectionState');
    if (connectionNode) connectionNode.textContent = state.connected ? t('connected') : t('disconnected');

    const navBtns = $$('.settings-nav button');
    if (navBtns[0]) navBtns[0].innerHTML = `${t('navDisplay')} <span class=\"hint\">${t('navDisplayHint')}</span>`;
    if (navBtns[1]) navBtns[1].innerHTML = `${t('navSound')} <span class=\"hint\">${t('navSoundHint')}</span>`;
    if (navBtns[2]) navBtns[2].innerHTML = `${t('navLanguage')} <span class=\"hint\">${t('navLanguageHint')}</span>`;
    if (navBtns[3]) navBtns[3].innerHTML = `${t('navAbout')} <span class=\"hint\">${t('navAboutHint')}</span>`;

    const displayCard = document.querySelector('.settings-card.headered');
    if (displayCard) {
      const h3 = displayCard.querySelector('h3');
      if (h3) h3.textContent = t('displayCardTitle');
      const p = displayCard.querySelector('p');
      if (p) p.textContent = t('displayCardDesc');
      const metaRows = displayCard.querySelectorAll('.setting-row .meta strong');
      if (metaRows[0]) metaRows[0].textContent = t('brightnessLabel');
      if (metaRows[1]) metaRows[1].textContent = t('screensaverLabel');
      const metaHints = displayCard.querySelectorAll('.setting-row .meta span');
      if (metaHints[0]) metaHints[0].textContent = t('brightnessHint');
      if (metaHints[1]) metaHints[1].textContent = t('screensaverHint');
    }

    const settingCards = $$('.settings-stack .settings-card');
    const soundCard = settingCards[0];
    if (soundCard) {
      const h3 = soundCard.querySelector('h3');
      if (h3) h3.textContent = t('soundTitle');
      const meta = soundCard.querySelectorAll('.setting-row .meta strong');
      if (meta[0]) meta[0].textContent = t('volumeLabel');
      const hints = soundCard.querySelectorAll('.setting-row .meta span');
      if (hints[0]) hints[0].textContent = t('volumeHint');
      if (meta[1]) meta[1].textContent = t('chimeLabel');
      if (hints[1]) hints[1].textContent = t('chimeHint');
    }
    const languageCard = settingCards[1];
    if (languageCard) {
      const h3 = languageCard.querySelector('h3');
      if (h3) h3.textContent = t('languageTitle');
      const p = languageCard.querySelector('p');
      if (p) p.textContent = t('languageDesc');
      const meta = languageCard.querySelectorAll('.setting-row .meta strong');
      if (meta[0]) meta[0].textContent = t('languageLabel');
      const hints = languageCard.querySelectorAll('.setting-row .meta span');
      if (hints[0]) hints[0].textContent = t('languageHint');
      const labels = languageCard.querySelectorAll('.radio-pill span');
      if (labels[0]) labels[0].textContent = t('langZh');
      if (labels[1]) labels[1].textContent = t('langEn');
    }
    const aboutCard = settingCards[2];
    if (aboutCard) {
      const h3 = aboutCard.querySelector('h3');
      if (h3) h3.textContent = t('aboutTitle');
      const metaLabels = aboutCard.querySelectorAll('.settings-meta .label');
      if (metaLabels[0]) metaLabels[0].textContent = t('aboutVersion');
      if (metaLabels[1]) metaLabels[1].textContent = t('aboutFirmware');
      const buttons = aboutCard.querySelectorAll('.settings-actions button');
      if (buttons[0]) buttons[0].textContent = t('aboutCheck');
      if (buttons[1]) buttons[1].textContent = t('aboutLogs');
    }

    set('#shieldModal .modal-title', 'shieldModalTitle');
    set('#shieldModalText', 'shieldModalText');
    set('#shieldLostModal .modal-title', 'shieldLostTitle');
    const lostText = document.querySelector('#shieldLostModal p');
    if (lostText) lostText.textContent = t('shieldLostText');
    set('#shieldLostBack', 'shieldLostBack');

    set('#confirmCancel', 'confirmCancel');
    set('#confirmContinue', 'confirmContinue');

    updateRunState();
    setModeStage(state.modeStage);
    renderShieldIndicators();
  }

  function updateSettingsUI() {
    const brightness = document.getElementById('settingsBrightness');
    const brightnessValue = document.getElementById('settingsBrightnessValue');
    const brightnessPct = clampBrightness(state.settings.brightness);
    if (brightness) brightness.value = brightnessPct;
    if (brightnessValue) brightnessValue.textContent = `${brightnessPct}%`;

    const screensaver = document.getElementById('screensaverSelect');
    if (screensaver) screensaver.value = String(state.settings.screensaver);
    const saverChip = document.getElementById('screensaverValue');
    if (saverChip) saverChip.textContent = `${state.settings.screensaver} min`;
    updateCustomSelectDisplay(screensaver);

    const volume = document.getElementById('settingsVolume');
    const volumeValue = document.getElementById('settingsVolumeValue');
    if (volume) volume.value = state.settings.volume;
    if (volumeValue) volumeValue.textContent = `${state.settings.volume}%`;

    const langZh = document.getElementById('languageZh');
    const langEn = document.getElementById('languageEn');
    if (langZh) langZh.checked = state.settings.language === 'zh';
    if (langEn) langEn.checked = state.settings.language === 'en';
    const langChip = document.getElementById('languageValue');
    if (langChip) langChip.textContent = state.settings.language === 'zh' ? TRANSLATIONS.zh.langZh : TRANSLATIONS.en.langEn;

    const chimeToggle = document.getElementById('chimeToggle');
    if (chimeToggle) chimeToggle.checked = !!state.settings.playChime;

    const appVersion = document.getElementById('settingsAppVersion');
    if (appVersion) appVersion.textContent = state.settings.appVersion;
    const firmware = document.getElementById('settingsFirmwareVersion');
    if (firmware) firmware.textContent = state.settings.firmwareVersion;
  }

  async function syncSystemBrightness() {
    if (!api?.getBrightness) return;
    try {
      const info = await api.getBrightness();
      if (info && typeof info.percent === 'number') {
        state.settings.brightness = clampBrightness(info.percent);
        updateSettingsUI();
      }
    } catch (err) {
      console.warn('[PPHC] getBrightness failed', err);
    }
  }

  function updateCustomSelectDisplay(selectEl) {
    if (!selectEl || !selectEl._custom) return;
    const { wrapper, labelNode, items } = selectEl._custom;
    if (labelNode) {
      const selected = selectEl.options[selectEl.selectedIndex];
      labelNode.textContent = selected ? selected.textContent : '';
    }
    if (Array.isArray(items)) {
      items.forEach((item) => {
        item.classList.toggle('active', item.dataset.value === selectEl.value);
      });
    }
    if (wrapper) wrapper.classList.remove('open');
  }

  function attachCustomSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select._custom) return;
    select.classList.add('native-select-hidden');
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    wrapper.dataset.for = selectId;

    const display = document.createElement('button');
    display.type = 'button';
    display.className = 'custom-select-display';
    display.innerHTML = `<span class="label"></span><span class="chevron">⌄</span>`;

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    const items = [];
    Array.from(select.options).forEach((opt) => {
      const item = document.createElement('div');
      item.className = 'custom-select-item';
      item.dataset.value = opt.value;
      item.innerHTML = `<span>${opt.textContent}</span>`;
      item.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        updateCustomSelectDisplay(select);
      });
      menu.appendChild(item);
      items.push(item);
    });

    wrapper.appendChild(display);
    wrapper.appendChild(menu);
    select.insertAdjacentElement('afterend', wrapper);

    const toggle = () => {
      wrapper.classList.toggle('open');
    };
    display.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('open');
    });

    select._custom = { wrapper, labelNode: display.querySelector('.label'), items };
    updateCustomSelectDisplay(select);
  }

  async function applyBrightness(percent) {
    if (!api?.setBrightness) return;
    try {
      const result = await api.setBrightness(percent);
      if (result && typeof result.percent === 'number') {
        state.settings.brightness = clampBrightness(result.percent);
        updateSettingsUI();
      }
    } catch (err) {
      console.error('[PPHC] setBrightness failed', err);
      showAlert(t('brightnessApplyFailed'));
      syncSystemBrightness();
    }
  }

  function requestBrightnessApply(percent) {
    const target = clampBrightness(percent);
    state.settings.brightness = target;
    updateSettingsUI();
    if (brightnessApplyTimer) clearTimeout(brightnessApplyTimer);
    brightnessApplyTimer = setTimeout(() => {
      brightnessApplyTimer = null;
      applyBrightness(target);
    }, 120);
  }

  function formatMmHg(val) {
    if (val == null) return '--.-';
    return Number(val).toFixed(1);
  }

  function formatTemp(t) {
    if (t == null) return '--.-';
    return Number(t).toFixed(1);
  }

  function setModeStage(stage) {
    const raw = (stage ?? '').toString().trim();
    const letter = raw ? raw[0].toLowerCase() : '';
    state.modeStage = letter || '--';
    const chip = document.getElementById('modeStageChip');
    if (chip) {
      const labelText = STAGE_LABELS[letter] ? t(STAGE_LABELS[letter]) : t('stageIdle');
      const stageClass = STAGE_CLASS[letter] || 'stage-idle';
      chip.className = `live-chip stage-chip ${stageClass}`;
      if (!chip.querySelector('.stage-label')) {
        chip.innerHTML =
          `<span class="stage-eyebrow">${t('currentStage')}</span>` +
          `<div class="stage-main">` +
          `<span class="stage-orb"></span>` +
          `<span class="stage-label">${labelText}</span>` +
          `</div>`;
      } else {
        const labelNode = chip.querySelector('.stage-label');
        if (labelNode) labelNode.textContent = labelText;
        const eyebrow = chip.querySelector('.stage-eyebrow');
        if (eyebrow) eyebrow.textContent = t('currentStage');
      }
    }
  }

  function updateHeroClock() {
    const node = document.getElementById('heroClock');
    if (!node) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const text = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;
    node.textContent = text;
  }

  function pushData(ch, value) {
    const buf = state.buf[ch] || (state.buf[ch] = []);
    buf.push(value);
    if (buf.length > state.max) buf.shift();
    state.latest[ch] = value;
  }

  function drawSparkline(canvas, data, color, cfg = {}) {
    const { visibleMax, yMin, yMax, target } = cfg || {};
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const targetRaw = typeof target === 'function' ? target() : target;
    const targetVal = Number.isFinite(targetRaw) ? Number(targetRaw) : null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const samples = Array.isArray(data) ? data.slice(-canvas.width) : [];
    if (!samples.length && targetVal == null) return;
    const vals = samples.slice();
    if (targetVal != null) vals.push(targetVal);
    let minVal = typeof yMin === 'number' ? yMin : vals.length ? Math.min(...vals) : 0;
    let maxVal = typeof yMax === 'number' ? yMax : vals.length ? Math.max(...vals) : 1;
    if (typeof visibleMax === 'number') {
      const span = Math.max(visibleMax, maxVal - minVal);
      const center = (maxVal + minVal) / 2;
      minVal = center - span / 2;
      maxVal = center + span / 2;
    }
    if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }
    const padding = (maxVal - minVal) * 0.1 || 1;
    minVal -= padding;
    maxVal += padding;
    const range = maxVal - minVal || 1;
    const yFor = (v) => canvas.height * (1 - (v - minVal) / range);
    if (samples.length) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      samples.forEach((val, idx) => {
        const x = (idx / (samples.length - 1 || 1)) * canvas.width;
        const y = yFor(val);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    if (targetVal != null) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      const ty = yFor(targetVal);
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(canvas.width, ty);
      ctx.stroke();
      ctx.restore();
    }
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
    if (pll) pll.textContent = `${formatMmHg(state.latest[0])} mmHg`;
    if (prl) prl.textContent = `${formatMmHg(state.latest[2])} mmHg`;
    if (tl) tl.textContent = `${formatTemp(state.latest[1])}℃`;
    if (tr) tr.textContent = `${formatTemp(state.latest[3])}℃`;
    if (tll) tll.textContent = `${formatTemp(state.latest[1])}℃`;
    if (trl) trl.textContent = `${formatTemp(state.latest[3])}℃`;
    sparkTargets.forEach((target) =>
      drawSparkline(target.canvas(), state.buf[target.key], target.color, target)
    );
    updateHeartbeatUI();
  }

  function updateRunState() {
    const runNode = $('#runState');
    if (runNode) runNode.textContent = state.running ? t('running') : t('standby');
    const toggleBtn = $('#btnStartStop');
    if (toggleBtn) {
      toggleBtn.textContent = state.running ? t('stop') : t('start');
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
      // 自动停止
      api.sendU8(0x10c2, 1);
      state.running = false;
      if (state.countdownTimer) {
        clearInterval(state.countdownTimer);
        state.countdownTimer = null;
      }
      updateRunState();
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
      const presentVal = state.shieldDetail[`${side}Present`];
      const online = !!state.shields[side];
      const fuseVal = state.shieldDetail[`${side}Fuse`];
      const fuseNum = typeof fuseVal === 'string' ? Number(fuseVal) : Number(fuseVal);
      const healthy = online; // 熔断不影响在线判断
      refs.wrap.classList.toggle('active', healthy);
      if (refs.state) refs.state.textContent = online ? t('shieldOnline') : t('shieldOffline');
      if (refs.present)
        refs.present.textContent =
          presentVal == null ? '--' : presentVal ? t('shieldPresentYes') : t('shieldPresentNo');
      if (refs.fuse)
        refs.fuse.textContent =
          fuseVal == null ? '--' : fuseNum === 0 ? t('fuseBlown') : t('fuseOk');
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
      // Show the side that is offline/abnormal, not the one still available to treat
      const missingLeft = !sides.includes('left');
      title.textContent = missingLeft ? t('shieldConfirmTitleLeft') : t('shieldConfirmTitleRight');
      text.textContent = missingLeft ? t('shieldConfirmTextLeft') : t('shieldConfirmTextRight');
    }

    if (modal) modal.hidden = false;
  }

  function startTreatmentForSides(sides) {
    const enableLeft = sides.includes('left');
    const enableRight = sides.includes('right');
    clearTelemetryBuffers();
    setModeStage('--');
    state.pendingSides = null;
    state.activeSides = sides.slice();
    state.shieldDropShown = false;
    api.sendU8(0x1004, enableLeft ? 1 : 0);
    api.sendU8(0x1005, enableRight ? 1 : 0);
    api.sendF32(0x1002, TEMP_FIXED_C);
    const mmHg = Number(document.getElementById('pressMmHg')?.value ?? 0);
    state.targets.pressure = mmHg;
    state.targets.temp = TEMP_FIXED_C;
    api.sendF32(0x1001, mmHg); // 发送原始 mmHg
    api.sendU8(0x10c0, state.mode || 1);
    const min = Math.max(
      1,
      Math.min(15, Number(document.getElementById('treatDuration')?.value || 10))
    );
    api.sendU16(0x1006, min);
    api.sendU8(0x10c1, 1);
    state.running = true;
    state.countdownEnd = Date.now() + min * 60 * 1000;
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(updateCountdown, 250);
    updateRunState();
  }

  function handleShieldDropOffline() {
    if (!state.running || state.shieldDropShown) return;
    state.shieldDropShown = true;
    api.sendU8(0x10c2, 1);
    state.running = false;
    state.activeSides = [];
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
    updateRunState();
    const modal = document.getElementById('shieldLostModal');
    if (modal) modal.hidden = false;
  }

  function clearShieldLostModal() {
    const modal = document.getElementById('shieldLostModal');
    if (modal && !modal.hidden) modal.hidden = true;
    state.shieldDropShown = false;
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
      openShieldAlert('未检测到治疗眼罩，请正确佩戴后再开始治疗。');
      return;
    }
    const active = left ? ['left'] : ['right'];
    openShieldConfirm(active);
  }

  function bindSettingsControls() {
    const brightness = document.getElementById('settingsBrightness');
    if (brightness) {
      brightness.value = clampBrightness(state.settings.brightness);
      brightness.addEventListener('input', () => {
        requestBrightnessApply(brightness.value);
      });
    }

    const screensaver = document.getElementById('screensaverSelect');
    attachCustomSelect('screensaverSelect');
    if (screensaver) {
      screensaver.value = String(state.settings.screensaver);
      screensaver.addEventListener('change', () => {
        state.settings.screensaver = Number(screensaver.value || 5);
        updateSettingsUI();
      });
    }

    const volume = document.getElementById('settingsVolume');
    if (volume) {
      volume.value = state.settings.volume;
      volume.addEventListener('input', () => {
        state.settings.volume = Number(volume.value || 0);
        updateSettingsUI();
      });
    }

    document.getElementById('languageZh')?.addEventListener('change', () => {
      state.settings.language = 'zh';
      applyLanguage('zh');
      updateSettingsUI();
    });
    document.getElementById('languageEn')?.addEventListener('change', () => {
      state.settings.language = 'en';
      applyLanguage('en');
      updateSettingsUI();
    });

    const chimeToggle = document.getElementById('chimeToggle');
    if (chimeToggle) {
      chimeToggle.checked = !!state.settings.playChime;
      chimeToggle.addEventListener('change', () => {
        state.settings.playChime = !!chimeToggle.checked;
        updateSettingsUI();
      });
    }

    document.getElementById('btnCheckUpdates')?.addEventListener('click', () => {
      showAlert('检查更新中...');
    });
    document.getElementById('btnOpenLogs')?.addEventListener('click', () => {
      showAlert('日志目录打开功能待接入');
    });
  }

  function bindEvents() {
    console.info('[PPHC] binding UI events');
    [
      'btnHomeQuick',
      'btnBackHome',
      'btnExit',
      'btnHomeDevice',
      'btnStartStop',
      'pressMmHg',
      'treatDuration',
      'modalClose',
      'shieldModal',
      'shieldConfirm',
      'confirmCancel',
      'confirmContinue',
      'shieldLostBack',
      'btnBackSettings',
    ].forEach((id) => {
      if (!document.getElementById(id)) console.warn('[PPHC] missing element', id);
    });
    document.getElementById('btnHomeQuick')?.addEventListener('click', () => showView('quick'));
    document.getElementById('btnBackHome')?.addEventListener('click', () => showView('home'));
    document.getElementById('btnExit')?.addEventListener('click', () => {
      if (api && api.exitApp) api.exitApp();
      else window.close();
    });
    document.getElementById('btnHomeDevice')?.addEventListener('click', () => showView('settings'));

    document.getElementById('btnStartStop')?.addEventListener('click', () => {
      console.info('[PPHC] start/stop clicked, connected=', state.connected, 'running=', state.running);
      if (!state.connected) return;
      if (state.running) {
        api.sendU8(0x10c2, 1);
        state.running = false;
        state.activeSides = [];
        state.shieldDropShown = false;
        setModeStage('--');
        if (state.countdownTimer) {
          clearInterval(state.countdownTimer);
          state.countdownTimer = null;
        }
        updateRunState();
      } else {
        handleStartClick();
      }
    });

    const pressureSlider = document.getElementById('pressMmHg');
    if (pressureSlider)
      pressureSlider.addEventListener('input', () => {
        const val = Number(pressureSlider.value).toFixed(0);
        const chip = document.getElementById('pressMmHgValue');
        if (chip) chip.textContent = `${val} mmHg`;
        if (!state.running) state.targets.pressure = Number(val);
      });

    const durationSlider = document.getElementById('treatDuration');
    if (durationSlider)
      durationSlider.addEventListener('input', () => {
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
        const lost = document.getElementById('shieldLostModal');
        if (lost && !lost.hidden) lost.hidden = true;
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
    document.getElementById('shieldLostBack')?.addEventListener('click', () => {
      clearShieldLostModal();
    });

    document.getElementById('btnBackSettings')?.addEventListener('click', () =>
      showView('home')
    );
    console.info('[PPHC] events bound done');
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
        if (sysNode) sysNode.textContent = value ?? '--';
        if (!state.shieldExplicit && typeof value === 'number') {
          state.shields.left = !!(value & 0x01);
          state.shields.right = !!(value & 0x02);
          renderShieldIndicators();
          if (
            state.running &&
            ((state.activeSides.includes('left') && !isShieldHealthy('left')) ||
              (state.activeSides.includes('right') && !isShieldHealthy('right')))
          ) {
            handleShieldDropOffline();
          }
        }
      });
    }
    if (api.onAlarmState) {
      api.onAlarmState((value) => {
        state.alarmState = value;
        const alarmNode = $('#alarmState');
        if (alarmNode) alarmNode.textContent = value ?? '--';
      });
    }
    if (api.onModeCurves) {
      api.onModeCurves((value) => {
        setModeStage(value);
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
        showAlert(t('stoppedByDevice'));
      });
    }
    if (api.onShieldState) {
      api.onShieldState(
        ({ left, right, leftPresent, rightPresent, leftFuse, rightFuse }) => {
          state.shieldExplicit = true;
          state.shields.left = !!left;
          state.shields.right = !!right;
          if (leftPresent !== undefined) state.shieldDetail.leftPresent = leftPresent;
          if (rightPresent !== undefined) state.shieldDetail.rightPresent = rightPresent;
          if (leftFuse !== undefined) state.shieldDetail.leftFuse = leftFuse;
          if (rightFuse !== undefined) state.shieldDetail.rightFuse = rightFuse;
          renderShieldIndicators();
          if (isShieldHealthy('left') && isShieldHealthy('right')) {
            clearShieldLostModal();
          }
          if (
            state.running &&
            ((state.activeSides.includes('left') && !isShieldHealthy('left')) ||
              (state.activeSides.includes('right') && !isShieldHealthy('right')))
          ) {
            handleShieldDropOffline();
          }
        }
      );
    }
  }

  function init() {
    console.info('[PPHC] init start');
    bindEvents();
    bindSettingsControls();
    wireIpc();
    updateModeMeta();
    updateSettingsUI();
    syncSystemBrightness();
    applyLanguage(state.settings.language || 'zh');
    setInterval(updateTelemetry, 200);
    updateHeroClock();
    setInterval(updateHeroClock, 30000);
    // 默认进入 home
    showView(state.currentView || 'home');
    const tChip = document.getElementById('tempFixedValue');
    if (tChip) tChip.textContent = `${TEMP_FIXED_C.toFixed(1)}℃`;
    scheduleAutoConnect(0);
    console.info('[PPHC] init done');
  }

  window.addEventListener('DOMContentLoaded', init);
})();
