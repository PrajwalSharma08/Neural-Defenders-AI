/**
 * SentinelShield AI — Master App Coordinator & State Management (Vanilla JS)
 */

window.SentinelApp = {
  currentTheme: localStorage.getItem('sentinel_theme') || 'dark',
  wsLatency: null,
  backendBaseUrl: localStorage.getItem('sentinel_backend_url') || '',
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
    
    // Auto-detect backend endpoint
    if (!this.backendBaseUrl && (window.location.hostname.includes('github.io') || window.location.protocol === 'file:')) {
      // Default to localhost:8888 if on GitHub Pages or local file
      this.backendBaseUrl = 'http://localhost:8888';
    }

    // Initialize available feature modules
    if (window.VoiceShield) window.VoiceShield.init();
    if (window.LinkShield) window.LinkShield.init();
    if (window.SmsShield) window.SmsShield.init();
    if (window.ForensicPdf) window.ForensicPdf.init();

    console.log("[SentinelShield AI] Multi-Page Resilient Architecture Initialized.");
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
