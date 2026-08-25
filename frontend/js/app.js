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
    sms_data: null,
    session_id: null,
  },

  init() {
    this.applyTheme(this.currentTheme);
    this.initHUDClock();
    this.initAttestationTicker();
    this.initPwaInstall();

    // Show Notification button if not granted
    if ('Notification' in window && Notification.permission !== 'granted') {
      const btnNotif = document.getElementById('btnEnableNotifications');
      if (btnNotif) btnNotif.style.display = 'inline-flex';
    }

    // Initialize available feature modules
    if (window.VoiceShield) window.VoiceShield.init();
    if (window.LinkShield) window.LinkShield.init();
    if (window.SmsShield) window.SmsShield.init();
    if (window.ForensicPdf) window.ForensicPdf.init();

    // Register Service Worker for PWA WebAPK
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    console.log("[SentinelShield AI] Platform Ready.");
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
  // Global Notification & Push Enable Handler
  // --------------------------------------------------------------------------
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert("Push notifications not supported on this browser.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      console.log("[SentinelShield] Manual Notification Request:", perm);
      if (perm === 'granted') {
        alert("✅ Security Alerts are now ENABLED!");
        const btn = document.getElementById('btnEnableNotifications');
        if (btn) btn.style.display = 'none';
      } else {
        alert("❌ Alerts Denied. You may need to enable them in your Android browser settings.");
      }
    } catch (e) {
      console.error(e);
    }
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
      alert("To install SentinelShield on your phone, tap your browser menu (⋮) and select 'Install app' or 'Add to Home Screen'!");
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
