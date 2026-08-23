/**
 * SentinelShield AI — Master App Coordinator & State Management (Vanilla JS)
 */

window.SentinelApp = {
  activeTab: 'voice',
  currentTheme: localStorage.getItem('sentinel_theme') || 'dark',
  wsLatency: null,
  sharedForensicData: {
    voice_data: null,
    url_data: null,
    sms_data: null,
    session_id: null,
  },

  init() {
    this.applyTheme(this.currentTheme);
    this.initTabs();
    this.initHUDClock();
    this.initAttestationTicker();
    
    // Initialize feature modules
    if (window.VoiceShield) window.VoiceShield.init();
    if (window.LinkShield) window.LinkShield.init();
    if (window.SmsShield) window.SmsShield.init();
    if (window.ForensicPdf) window.ForensicPdf.init();

    console.log("[SentinelShield AI] Pure Vanilla JS Core Initialized.");
  },

  // --------------------------------------------------------------------------
  // Theme Switching (Dark, Light, Neon Glass)
  // --------------------------------------------------------------------------
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sentinel_theme', theme);

    // Update active state on theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      if (btn.dataset.theme === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  // --------------------------------------------------------------------------
  // Tab Switching (Voice, Link, SMS)
  // --------------------------------------------------------------------------
  initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      if (b.dataset.tab === tabId) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Update content panels
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) panel.classList.add('active');
      else panel.classList.remove('active');
    });
  },

  // --------------------------------------------------------------------------
  // Top HUD Clock & Telemetry
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
