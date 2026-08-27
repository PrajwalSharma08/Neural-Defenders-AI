import { parseURL, isValidURL, findTrackingParams, isShortURL, calculateEntropy, cleanURL } from './utils/urlUtils.js';
import { Storage } from './utils/storage.js';
import { HistoryModule } from './modules/history.js';
import { URLParserModule } from './modules/urlParser.js';
import { URLCleanerModule } from './modules/urlCleaner.js';
import { URLUnshortenerModule } from './modules/urlUnshortener.js';
import { StatusCheckerModule } from './modules/statusChecker.js';
import { PatternCheckerModule } from './modules/patternChecker.js';

class CyberLinkShieldApp {
  constructor() {
    this.currentUrl = '';
    this.cleanedUrl = '';
    this.modules = {
      parser: new URLParserModule(),
      cleaner: new URLCleanerModule(),
      unshortener: new URLUnshortenerModule(),
      status: new StatusCheckerModule(),
      pattern: new PatternCheckerModule(),
    };
    this.history = new HistoryModule();
    this.activeTab = 'breakdown';
    this.init();
  }

  init() {
    this.initUI();
    this.initEventListeners();
    this.renderHistory();
    this.showToast('SentinelShield Link Guard Engine Ready', 'info');
  }

  initUI() {
    // Tab switching
    document.querySelectorAll('.cyber-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.cyber-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.cyber-tab-pane').forEach(p => {
      p.classList.toggle('active', p.getAttribute('id') === `pane-${tabId}`);
    });
  }

  initEventListeners() {
    const urlInput = document.getElementById('urlInput');
    const btnScan = document.getElementById('btnScanSubmit');
    const btnPaste = document.getElementById('btnPasteInput');
    const btnClear = document.getElementById('btnClearInput');
    const btnAutoFix = document.getElementById('btnAutoFix');
    const btnCopyClean = document.getElementById('btnCopyCleanUrl');

    if (btnScan) {
      btnScan.addEventListener('click', () => this.handleScan());
    }

    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleScan();
      });
    }

    if (btnPaste) {
      btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            urlInput.value = text.trim();
            this.handleScan();
          }
        } catch (e) {
          this.showToast('Unable to read clipboard', 'warn');
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        urlInput.value = '';
        urlInput.focus();
        this.resetDashboard();
      });
    }

    // Demo quick pills
    document.querySelectorAll('.demo-pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        const url = pill.getAttribute('data-url');
        if (url && urlInput) {
          urlInput.value = url;
          this.handleScan();
        }
      });
    });

    if (btnAutoFix) {
      btnAutoFix.addEventListener('click', () => this.handleAutoFix());
    }

    if (btnCopyClean) {
      btnCopyClean.addEventListener('click', () => {
        if (this.cleanedUrl) {
          navigator.clipboard.writeText(this.cleanedUrl);
          this.showToast('Cleaned URL copied to clipboard!', 'success');
        }
      });
    }
  }

  async handleScan() {
    const input = document.getElementById('urlInput');
    let raw = input ? input.value.trim() : '';

    if (!raw) {
      this.showToast('Please enter a valid URL to scan', 'warn');
      return;
    }

    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      raw = 'https://' + raw;
      if (input) input.value = raw;
    }

    if (!isValidURL(raw)) {
      this.showToast('Invalid URL syntax. Please check domain formatting.', 'error');
      return;
    }

    this.currentUrl = raw;
    const t0 = performance.now();

    // 1. Analyze with LinkGuard algorithms
    const parsed = parseURL(raw);
    const tracking = findTrackingParams(raw);
    const isShort = isShortURL(raw);
    const entropy = calculateEntropy(raw);
    const cleaned = cleanURL(raw);
    this.cleanedUrl = cleaned;

    // Calculate score
    let score = 100;
    const issues = [];

    if (!parsed.protocol.startsWith('https')) {
      score -= 25;
      issues.push({ type: 'danger', text: 'Insecure HTTP protocol (no SSL/TLS encryption)' });
    }

    if (tracking.length > 0) {
      score -= Math.min(30, tracking.length * 10);
      issues.push({ type: 'warning', text: `${tracking.length} privacy tracking parameters detected (${tracking.slice(0, 3).join(', ')}${tracking.length > 3 ? '...' : ''})` });
    }

    if (isShort) {
      score -= 20;
      issues.push({ type: 'warning', text: 'Shortened URL masking real destination host' });
    }

    if (entropy > 3.8) {
      score -= 30;
      issues.push({ type: 'danger', text: `Abnormal Shannon Entropy (${entropy.toFixed(2)} bits/char) — potential DGA / bot generated link` });
    } else if (entropy > 3.4) {
      score -= 10;
      issues.push({ type: 'warning', text: `Elevated Entropy (${entropy.toFixed(2)} bits/char)` });
    }

    // IP as host
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
      score -= 40;
      issues.push({ type: 'danger', text: 'Direct IP address used instead of reputable domain' });
    }

    score = Math.max(5, Math.min(100, score));
    const elapsed = Math.round(performance.now() - t0);

    // Update UI components
    this.updateRadialGauge(score, issues);
    this.updateTelemetryCards(parsed, tracking, isShort, entropy, elapsed);
    this.renderURLBreakdown(parsed);
    this.renderCleanerView(raw, cleaned, tracking);
    this.renderUnshortenerView(raw, isShort);
    this.renderSecurityRules(issues, parsed, entropy);
    
    // Save to history
    this.history.add(raw, score, issues.length);
    this.renderHistory();

    this.showToast(`URL Scan Completed in ${elapsed}ms`, 'success');
  }

  updateRadialGauge(score, issues) {
    const pctEl = document.getElementById('gaugePctText');
    const labelEl = document.getElementById('gaugeLabelText');
    const circle = document.getElementById('gaugeProgressCircle');
    const issuesContainer = document.getElementById('issuesList');
    const autoFixBtn = document.getElementById('btnAutoFix');

    if (pctEl) pctEl.textContent = `${score}%`;

    const circumference = 2 * Math.PI * 90;
    const offset = circumference - (score / 100) * circumference;
    if (circle) {
      circle.style.strokeDashoffset = offset;
      if (score >= 80) {
        circle.style.stroke = 'var(--accent-emerald)';
      } else if (score >= 50) {
        circle.style.stroke = 'var(--accent-amber)';
      } else {
        circle.style.stroke = 'var(--accent-rose)';
      }
    }

    if (labelEl) {
      labelEl.className = 'verdict-pill';
      if (score >= 80) {
        labelEl.classList.add('verdict-human');
        labelEl.textContent = 'SECURE & CLEAN';
      } else if (score >= 50) {
        labelEl.classList.add('verdict-suspect');
        labelEl.textContent = 'SUSPICIOUS LINK';
      } else {
        labelEl.classList.add('verdict-ai');
        labelEl.textContent = 'HIGH RISK / MALICIOUS';
      }
    }

    if (issuesContainer) {
      if (issues.length === 0) {
        issuesContainer.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; font-size: 0.82rem; color: #10b981;">
            <span>🛡️</span> <span>No security threats or tracking parameters detected.</span>
          </div>
        `;
        if (autoFixBtn) autoFixBtn.style.display = 'none';
      } else {
        issuesContainer.innerHTML = issues.map(iss => `
          <div style="display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.65rem 0.85rem; background: ${iss.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; border: 1px solid ${iss.type === 'danger' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}; border-radius: 8px; font-size: 0.8rem; color: ${iss.type === 'danger' ? '#fca5a5' : '#fcd34d'}; margin-bottom: 0.4rem;">
            <span>${iss.type === 'danger' ? '🚨' : '⚠️'}</span>
            <span>${iss.text}</span>
          </div>
        `).join('');
        if (autoFixBtn) autoFixBtn.style.display = 'flex';
      }
    }
  }

  updateTelemetryCards(parsed, tracking, isShort, entropy, elapsed) {
    const elEntropy = document.getElementById('cardEntropyVal');
    const elEntropySub = document.getElementById('cardEntropySub');
    const elTrackVal = document.getElementById('cardTrackVal');
    const elTrackSub = document.getElementById('cardTrackSub');
    const elSslVal = document.getElementById('cardSslVal');
    const elSslSub = document.getElementById('cardSslSub');
    const elShortVal = document.getElementById('cardShortVal');
    const elShortSub = document.getElementById('cardShortSub');
    const elLatency = document.getElementById('cardLatencyVal');

    if (elEntropy) elEntropy.textContent = `${entropy.toFixed(2)} bits/char`;
    if (elEntropySub) {
      elEntropySub.textContent = entropy > 3.5 ? 'High (DGA / Bot Risk)' : 'Normal (< 3.5)';
      elEntropySub.style.color = entropy > 3.5 ? 'var(--accent-rose)' : 'var(--accent-emerald)';
    }

    if (elTrackVal) elTrackVal.textContent = `${tracking.length} Found`;
    if (elTrackSub) {
      elTrackSub.textContent = tracking.length > 0 ? 'Privacy Leakage' : 'Clean & Private';
      elTrackSub.style.color = tracking.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    }

    if (elSslVal) {
      const isHttps = parsed.protocol.startsWith('https');
      elSslVal.textContent = isHttps ? 'HTTPS (SSL/TLS)' : 'INSECURE HTTP';
      elSslVal.style.color = isHttps ? 'var(--accent-emerald)' : 'var(--accent-rose)';
    }
    if (elSslSub) elSslSub.textContent = `Port: ${parsed.port || (parsed.protocol.startsWith('https') ? '443' : '80')}`;

    if (elShortVal) {
      elShortVal.textContent = isShort ? 'SHORTENED' : 'DIRECT URL';
      elShortVal.style.color = isShort ? 'var(--accent-amber)' : 'var(--accent-emerald)';
    }
    if (elShortSub) elShortSub.textContent = isShort ? 'Masked Destination' : 'Fully Qualified Domain';

    if (elLatency) elLatency.textContent = `${elapsed} ms`;
  }

  renderURLBreakdown(parsed) {
    const container = document.getElementById('urlBreakdownTable');
    if (!container) return;

    const rows = [
      { key: 'Protocol / Scheme', val: parsed.protocol, tag: parsed.protocol.startsWith('https') ? 'Secure' : 'Insecure' },
      { key: 'Hostname / Domain', val: parsed.hostname, tag: 'Domain' },
      { key: 'Pathname', val: parsed.pathname || '/', tag: 'Path' },
      { key: 'Port', val: parsed.port || (parsed.protocol.startsWith('https') ? '443 (Default HTTPS)' : '80 (Default HTTP)'), tag: 'Port' },
      { key: 'Query Parameters Count', val: Object.keys(parsed.searchParams || {}).length, tag: 'Parameters' },
      { key: 'Hash Fragment', val: parsed.hash || 'None', tag: 'Fragment' }
    ];

    container.innerHTML = `
      <table class="telemetry-table" style="width: 100%; font-size: 0.82rem; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid var(--glass-border); color: var(--text-muted); text-align: left;">
            <th style="padding: 0.6rem 0.75rem;">Component</th>
            <th style="padding: 0.6rem 0.75rem;">Value</th>
            <th style="padding: 0.6rem 0.75rem;">Type</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
              <td style="padding: 0.6rem 0.75rem; font-weight: 700; color: var(--accent-cyan);">${r.key}</td>
              <td style="padding: 0.6rem 0.75rem; font-family: var(--font-mono); color: var(--text-main); word-break: break-all;">${r.val}</td>
              <td style="padding: 0.6rem 0.75rem;"><span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">${r.tag}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderCleanerView(raw, cleaned, tracking) {
    const rawBox = document.getElementById('cleanerRawUrl');
    const cleanBox = document.getElementById('cleanerCleanUrl');
    const badgeCount = document.getElementById('cleanerRemovedBadge');

    if (rawBox) rawBox.textContent = raw;
    if (cleanBox) cleanBox.textContent = cleaned;
    if (badgeCount) {
      badgeCount.textContent = tracking.length > 0 ? `${tracking.length} Trackers Stripped` : '0 Trackers (Clean)';
      badgeCount.style.background = tracking.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)';
      badgeCount.style.color = tracking.length > 0 ? '#10b981' : 'var(--text-muted)';
    }
  }

  renderUnshortenerView(raw, isShort) {
    const box = document.getElementById('unshortenerStatusBox');
    if (!box) return;

    if (isShort) {
      box.innerHTML = `
        <div style="padding: 1rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px;">
          <div style="font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">🔗 Shortened URL Detected (${new URL(raw).hostname})</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            This link uses a URL shortener service which hides the true destination. Always inspect the expanded target before clicking.
          </p>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; padding: 0.6rem; background: rgba(0,0,0,0.3); border-radius: 6px; word-break: break-all; color: var(--text-main);">
            Source: ${raw}
          </div>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="padding: 1rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px;">
          <div style="font-weight: 700; color: #10b981; margin-bottom: 0.35rem;">✅ Direct Host Link</div>
          <p style="font-size: 0.82rem; color: var(--text-muted);">This URL directly addresses the target host without redirect shortener wrappers.</p>
        </div>
      `;
    }
  }

  renderSecurityRules(issues, parsed, entropy) {
    const container = document.getElementById('securityRulesList');
    if (!container) return;

    const rules = [
      { name: 'HTTPS / TLS Encryption', pass: parsed.protocol.startsWith('https'), desc: 'Ensures traffic is encrypted in transit.' },
      { name: 'Shannon Entropy Threshold (< 3.5)', pass: entropy <= 3.5, desc: 'Detects algorithmic randomness in DGA bot URLs.' },
      { name: 'Zero Tracking Parameters', pass: !issues.some(i => i.text.includes('tracking parameters')), desc: 'Protects user identity and analytics fingerprinting.' },
      { name: 'Domain Name Resolution (Not Raw IP)', pass: !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname), desc: 'Prevents direct server bypass of DNS blocklists.' },
      { name: 'Direct Unmasked Host (No Shortener)', pass: !isShortURL(this.currentUrl), desc: 'Guarantees the displayed link is the true landing destination.' }
    ];

    container.innerHTML = rules.map(r => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; margin-bottom: 0.5rem;">
        <div>
          <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-main);">${r.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${r.desc}</div>
        </div>
        <span class="badge" style="background: ${r.pass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${r.pass ? '#10b981' : '#ef4444'}; font-weight: 800;">
          ${r.pass ? 'PASS' : 'FLAGGED'}
        </span>
      </div>
    `).join('');
  }

  renderHistory() {
    const listEl = document.getElementById('historyListContainer');
    if (!listEl) return;

    const historyItems = this.history.getAll ? this.history.getAll() : [];
    if (historyItems.length === 0) {
      listEl.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">No recent URL scans recorded.</div>`;
      return;
    }

    listEl.innerHTML = historyItems.slice(0, 10).map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--glass-border); font-size: 0.8rem;">
        <div style="max-width: 75%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-mono); color: var(--text-main);">
          ${item.url}
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="badge" style="background: ${item.score >= 80 ? 'rgba(16,185,129,0.2)' : item.score >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${item.score >= 80 ? '#10b981' : item.score >= 50 ? '#f59e0b' : '#ef4444'}; font-weight: 800;">
            ${item.score}%
          </span>
          <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="window.CyberLinkShield.loadHistoryUrl('${item.url}')">Scan</button>
        </div>
      </div>
    `).join('');
  }

  loadHistoryUrl(url) {
    const input = document.getElementById('urlInput');
    if (input) {
      input.value = url;
      this.handleScan();
    }
  }

  handleAutoFix() {
    if (!this.cleanedUrl) return;
    const input = document.getElementById('urlInput');
    if (input) input.value = this.cleanedUrl;
    this.handleScan();
    this.showToast('Auto-Fixed! Insecure/tracking parameters removed.', 'success');
  }

  resetDashboard() {
    this.updateRadialGauge(100, []);
    const elEntropy = document.getElementById('cardEntropyVal');
    const elTrackVal = document.getElementById('cardTrackVal');
    const elSslVal = document.getElementById('cardSslVal');
    const elShortVal = document.getElementById('cardShortVal');
    const elLatency = document.getElementById('cardLatencyVal');
    if (elEntropy) elEntropy.textContent = '—';
    if (elTrackVal) elTrackVal.textContent = '—';
    if (elSslVal) elSslVal.textContent = '—';
    if (elShortVal) elShortVal.textContent = '—';
    if (elLatency) elLatency.textContent = '— ms';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid ${type === 'success' ? '#10b981' : type === 'warn' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#0ea5e9'};
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      backdrop-filter: blur(10px);
      animation: fadeIn 0.3s ease;
    `;
    const icon = type === 'success' ? '✅' : type === 'warn' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.CyberLinkShield = new CyberLinkShieldApp();
});
