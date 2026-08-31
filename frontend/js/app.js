/**
 * SentinelShield AI — Master App Coordinator & State Management (Vanilla JS)
 */

window.SentinelApp = {
  currentTheme: localStorage.getItem('sentinel_theme') || 'dark',
  wsLatency: null,
  backendBaseUrl: localStorage.getItem('sentinel_backend_url') || '',
  deferredPrompt: null,
  sharedForensicData: {
    voice_data: null,
    url_data: null,
    session_id: null,
  },

  init() {
    this.applyTheme(this.currentTheme);
    this.initHUDClock();
    this.initAttestationTicker();
    this.initPwaInstall();

    // Initialize permission state checks
    this.checkPermissionsStatus();

    // Show Notification button if not granted
    if ('Notification' in window && Notification.permission !== 'granted') {
      const btnNotif = document.getElementById('btnEnableNotifications');
      if (btnNotif) btnNotif.style.display = 'inline-flex';
    }

    // Initialize available feature modules
    if (window.VoiceShield && typeof window.VoiceShield.init === 'function') {
      window.VoiceShield.init();
    }
    if (window.LinkShield && typeof window.LinkShield.init === 'function') {
      window.LinkShield.init();
    }
    if (window.ForensicPdf && typeof window.ForensicPdf.init === 'function') {
      window.ForensicPdf.init();
    }

    // Register Service Worker for PWA WebAPK
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    console.log("[SentinelShield AI] Master Coordinator Initialized.");
  },

  getApiUrl(endpoint) {
    if (this.backendBaseUrl) {
      const base = this.backendBaseUrl.replace(/\/+$/, '');
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${base}${path}`;
    }
    return endpoint;
  },

  getWsUrl(endpoint) {
    if (this.backendBaseUrl) {
      const wsBase = this.backendBaseUrl.replace(/^http/, 'ws').replace(/\/+$/, '');
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${wsBase}${path}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${endpoint}`;
  },

  // --------------------------------------------------------------------------
  // Hardware & Security Permission Management (Mic, Camera, Notification, Storage)
  // --------------------------------------------------------------------------
  permissionsState: {
    mic: 'prompt',
    camera: 'prompt',
    notif: 'prompt',
    storage: 'granted',
  },

  async checkPermissionsStatus() {
    if (navigator.permissions) {
      try {
        const micStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
        if (micStatus) {
          this.permissionsState.mic = micStatus.state;
          micStatus.onchange = () => { this.permissionsState.mic = micStatus.state; this.renderPermissionPills(); };
        }
      } catch (e) {}

      try {
        const camStatus = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
        if (camStatus) {
          this.permissionsState.camera = camStatus.state;
          camStatus.onchange = () => { this.permissionsState.camera = camStatus.state; this.renderPermissionPills(); };
        }
      } catch (e) {}
    }

    if ('Notification' in window) {
      this.permissionsState.notif = Notification.permission;
    }

    this.renderPermissionPills();
  },

  renderPermissionPills() {
    const micBadge = document.getElementById('permBadgeMic');
    const camBadge = document.getElementById('permBadgeCam');
    const notifBadge = document.getElementById('permBadgeNotif');
    const storageBadge = document.getElementById('permBadgeStorage');

    if (micBadge) {
      const isGranted = this.permissionsState.mic === 'granted';
      micBadge.textContent = isGranted ? 'GRANTED 🟢' : 'ALLOW NOW ⚡';
      micBadge.className = isGranted ? 'perm-status-pill perm-granted' : 'perm-status-pill perm-prompt';
    }
    if (camBadge) {
      const isGranted = this.permissionsState.camera === 'granted';
      camBadge.textContent = isGranted ? 'GRANTED 🟢' : 'ALLOW NOW ⚡';
      camBadge.className = isGranted ? 'perm-status-pill perm-granted' : 'perm-status-pill perm-prompt';
    }
    if (notifBadge) {
      const isGranted = this.permissionsState.notif === 'granted';
      notifBadge.textContent = isGranted ? 'GRANTED 🟢' : 'ALLOW NOW ⚡';
      notifBadge.className = isGranted ? 'perm-status-pill perm-granted' : 'perm-status-pill perm-prompt';
    }
    if (storageBadge) {
      storageBadge.textContent = 'ACTIVE 🟢';
      storageBadge.className = 'perm-status-pill perm-granted';
    }
  },

  async requestMicrophonePermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        this.permissionsState.mic = 'granted';
        this.renderPermissionPills();
        this.showToast('✅ Microphone Access Granted for Voice DSP!', 'success');
      }
    } catch (err) {
      console.warn('Microphone permission rejected:', err);
      this.permissionsState.mic = 'denied';
      this.renderPermissionPills();
      this.showToast('Microphone access denied in browser settings.', 'warning');
    }
  },

  async requestCameraPermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        this.permissionsState.camera = 'granted';
        this.renderPermissionPills();
        this.showToast('✅ Camera Access Granted for QR Scanner!', 'success');
      }
    } catch (err) {
      console.warn('Camera permission rejected:', err);
      this.permissionsState.camera = 'denied';
      this.renderPermissionPills();
      this.showToast('Camera access denied in browser settings.', 'warning');
    }
  },

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      this.showToast("Push notifications not supported on this browser.", 'warning');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      this.permissionsState.notif = perm;
      this.renderPermissionPills();
      if (perm === 'granted') {
        this.showToast("✅ In-Call Security Alerts & Sticky Bar Active!", 'success');
      } else {
        this.showToast("Notifications blocked. Enable in Android settings.", 'warning');
      }
    } catch (e) {
      console.error(e);
    }
  },

  async requestAllPermissions() {
    this.showToast('Requesting security permissions...', 'info');
    await this.requestMicrophonePermission();
    await this.requestCameraPermission();
    await this.requestNotificationPermission();
    this.renderPermissionPills();
    this.showToast('🎯 Hardware & Security Setup Completed!', 'success');
  },

  openPermissionsModal() {
    const modal = document.getElementById('permissionsModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
      this.checkPermissionsStatus();
    }
  },

  closePermissionsModal() {
    const modal = document.getElementById('permissionsModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  },

  showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `cyber-toast cyber-toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // --------------------------------------------------------------------------
  // PWA WebAPK 1-Click Installation Handler
  // --------------------------------------------------------------------------
  initPwaInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('btnInstallApp');
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
        installBtn.addEventListener('click', () => this.triggerPwaInstall());
      }
    });
  },

  async triggerPwaInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      this.deferredPrompt = null;
      const installBtn = document.getElementById('btnInstallApp');
      if (installBtn) installBtn.style.display = 'none';
    } else {
      alert("To install SentinelShield on your phone, tap your browser menu and select 'Install app' or 'Add to Home Screen'!");
    }
  },

  // --------------------------------------------------------------------------
  // Theme Switching (Dark Luxe, Light Glass, Neon Glass)
  // --------------------------------------------------------------------------
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sentinel_theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // --------------------------------------------------------------------------
  // Top HUD Clock & Attestation Ticker
  // --------------------------------------------------------------------------
  initHUDClock() {
    const clockEl = document.getElementById('hudClockText');
    if (!clockEl) return;
    const update = () => {
      const now = new Date();
      clockEl.textContent = `STATUS: ACTIVE • CLOCK: ${now.toLocaleTimeString()}`;
    };
    update();
    setInterval(update, 1000);
  },

  initAttestationTicker() {
    const hashEl = document.getElementById('hudAttestationHash');
    if (!hashEl) return;
    const chars = '0123456789abcdef';
    const gen = () => Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * 16)]).join('');
    hashEl.textContent = `${gen()}…`;
    setInterval(() => {
      hashEl.textContent = `${gen()}…`;
    }, 3500);
  },

  updateLatency(ms) {
    this.wsLatency = ms;
    const latVal = document.getElementById('hudLatencyVal');
    if (!latVal) return;
    if (ms === null) {
      latVal.textContent = '— ms';
      latVal.style.color = 'var(--text-muted)';
    } else {
      latVal.textContent = `${ms} ms`;
      latVal.style.color = ms < 300 ? 'var(--accent-emerald)' : ms < 500 ? 'var(--accent-amber)' : 'var(--accent-crimson)';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.SentinelApp.init();
});
