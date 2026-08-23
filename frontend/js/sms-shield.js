/**
 * SentinelShield AI — Digital Arrest & SMS Extortion Shield Module (Vanilla JS)
 */

window.SmsShield = {
  init() {
    const scanBtn = document.getElementById('btnScanMessage');
    const inputEl = document.getElementById('messageScanInput');
    const channelSelect = document.getElementById('messageChannelSelect');

    if (scanBtn && inputEl) {
      scanBtn.addEventListener('click', () => {
        const text = inputEl.value;
        const channel = channelSelect ? channelSelect.value : 'sms';
        this.scanMessage(text, channel);
      });
    }

    // Quick fill sample triggers for demo
    const sampleBtns = document.querySelectorAll('.sample-threat-btn');
    sampleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (inputEl) {
          inputEl.value = btn.dataset.sampleText;
          const channel = channelSelect ? channelSelect.value : 'sms';
          this.scanMessage(inputEl.value, channel);
        }
      });
    });
  },

  async scanMessage(text, channel) {
    if (!text || !text.trim()) {
      alert("Please enter or paste message text to scan.");
      return;
    }

    const container = document.getElementById('messageResultsContainer');
    const scanBtn = document.getElementById('btnScanMessage');
    if (scanBtn) scanBtn.textContent = 'SCANNING AHO-CORASICK...';

    try {
      const res = await fetch('/api/v1/scan-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), source_channel: channel }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      window.SentinelApp.sharedForensicData.sms_data = data;
      this.renderResults(data);
    } catch (err) {
      console.error("SMS Scan failed:", err);
      alert("Scan failed: " + err.message);
    } finally {
      if (scanBtn) scanBtn.textContent = '⚡ SCAN EXTORTION & ARREST PATTERNS';
    }
  },

  renderResults(data) {
    const container = document.getElementById('messageResultsContainer');
    if (!container) return;

    container.style.display = 'block';

    const threatPct = Math.round((data.threat_score || 0) * 100);
    const badgeClass = data.verdict === 'DIGITAL_ARREST_DETECTED' || data.verdict === 'SCAM_DETECTED'
      ? 'badge-danger' 
      : data.verdict === 'SUSPICIOUS' 
      ? 'badge-warning' 
      : 'badge-safe';

    let patternsHtml = '';
    if (data.matched_patterns && data.matched_patterns.length > 0) {
      patternsHtml = data.matched_patterns.map(pat => `
        <div class="hud-stat-pill" style="margin-bottom: 0.5rem; justify-content: space-between; flex-wrap: wrap;">
          <div>
            <span style="font-weight: 700; color: var(--accent-crimson);">🚨 ${pat.pattern_name}</span>
            <span class="badge badge-warning" style="margin-left: 0.5rem; font-size: 0.65rem;">${pat.category}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-main);">
            Matched Fragment: "<em style="color: var(--accent-cyan);">${pat.matched_fragment}</em>"
          </div>
          <div style="font-weight: 800; color: var(--accent-crimson);">
            Weight: +${Math.round(pat.weight * 100)}%
          </div>
        </div>
      `).join('');
    } else {
      patternsHtml = `<p style="color: var(--accent-emerald); font-family: var(--font-mono); font-size: 0.8rem;">No coercive extortion or digital arrest patterns matched.</p>`;
    }

    container.innerHTML = `
      <div class="glass-card" style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span class="badge ${badgeClass}">${data.verdict}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; margin-left: 0.5rem; color: var(--text-muted);">
              Aho-Corasick Match Time: ${data.scan_ms} ms
            </span>
          </div>
          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 1.25rem;">
            Extortion Probability: <span style="color: ${threatPct > 60 ? 'var(--accent-crimson)' : threatPct > 30 ? 'var(--accent-amber)' : 'var(--accent-emerald)'};">${threatPct}%</span>
          </div>
        </div>

        <div style="margin-bottom: 1rem; background: var(--input-bg); padding: 0.85rem; border-radius: 0.75rem; border: 1px solid var(--glass-border);">
          <p style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Zero-Plaintext Privacy SHA-256 Hash:
          </p>
          <p style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-cyan); word-break: break-all;">
            ${data.text_hash}
          </p>
        </div>

        <div style="margin-bottom: 1.25rem; padding: 0.75rem; border-radius: 0.5rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);">
          <strong style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-crimson);">Recommended Victim Advisory:</strong>
          <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-main); margin-top: 0.25rem;">
            ${data.recommended_action}
          </p>
        </div>

        <h4 style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--text-main);">
          Matched Extortion & Authority Impersonation Vectors (${data.total_patterns_matched}):
        </h4>
        ${patternsHtml}
      </div>
    `;
  }
};
