/**
 * SentinelShield AI — Link & Phishing Shield Module (Vanilla JS)
 */

window.LinkShield = {
  init() {
    const scanBtn = document.getElementById('btnScanUrl');
    const inputEl = document.getElementById('urlScanInput');

    if (scanBtn && inputEl) {
      scanBtn.addEventListener('click', () => this.scanUrl(inputEl.value));
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.scanUrl(inputEl.value);
      });
    }
  },

  async scanUrl(url) {
    if (!url || !url.trim()) {
      alert("Please enter a valid URL to inspect.");
      return;
    }

    const resultsContainer = document.getElementById('urlResultsContainer');
    const scanBtn = document.getElementById('btnScanUrl');
    if (scanBtn) scanBtn.textContent = 'SCANNING...';

    try {
      const res = await fetch('/api/v1/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      window.SentinelApp.sharedForensicData.url_data = data;
      this.renderResults(data);
    } catch (err) {
      console.error("URL Scan failed:", err);
      alert("Scan failed: " + err.message);
    } finally {
      if (scanBtn) scanBtn.textContent = '🔍 SCAN URL';
    }
  },

  renderResults(data) {
    const container = document.getElementById('urlResultsContainer');
    if (!container) return;

    container.style.display = 'block';

    const phishingPct = Math.round((data.phishing_score || 0) * 100);
    const entropyPct = Math.round((data.entropy_score || 0) * 100);

    const badgeClass = data.verdict === 'PHISHING' 
      ? 'badge-danger' 
      : data.verdict === 'SUSPICIOUS' 
      ? 'badge-warning' 
      : 'badge-safe';

    let indicatorsHtml = '';
    if (data.threat_indicators && data.threat_indicators.length > 0) {
      indicatorsHtml = data.threat_indicators.map(ind => `
        <div class="hud-stat-pill" style="margin-bottom: 0.5rem; justify-content: space-between;">
          <span style="font-weight: 700; color: var(--accent-crimson);">⚠️ ${ind.indicator_type}</span>
          <span style="color: var(--text-muted);">${ind.description}</span>
          <span style="font-weight: 700;">+${Math.round(ind.severity * 100)}%</span>
        </div>
      `).join('');
    } else {
      indicatorsHtml = `<p style="color: var(--accent-emerald); font-family: var(--font-mono); font-size: 0.8rem;">No overt phishing threat indicators detected.</p>`;
    }

    container.innerHTML = `
      <div class="glass-card" style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <span class="badge ${badgeClass}">${data.verdict}</span>
            <span style="font-family: var(--font-mono); font-size: 0.75rem; margin-left: 0.5rem; color: var(--text-muted);">
              Scan Time: ${data.scan_ms} ms
            </span>
          </div>
          <div style="font-family: var(--font-mono); font-weight: 800; font-size: 1.25rem;">
            Risk: <span style="color: ${data.verdict === 'PHISHING' ? 'var(--accent-crimson)' : data.verdict === 'SUSPICIOUS' ? 'var(--accent-amber)' : 'var(--accent-emerald)'};">${phishingPct}%</span>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            Target Domain: <strong style="color: var(--text-main);">${data.domain}</strong>
          </p>
          <p style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
            HTTPS Secured: <strong>${data.is_https ? '✅ Yes' : '❌ No (Insecure HTTP)'}</strong> | 
            Typosquatting: <strong>${data.typosquatting_detected ? `🚨 Target: ${data.typosquatting_target}` : '✅ Clean'}</strong>
          </p>
        </div>

        <!-- Entropy Meter -->
        <div style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.75rem; margin-bottom: 0.35rem;">
            <span>Shannon Domain Entropy (DGA Metric)</span>
            <span>${entropyPct}% (${(data.entropy_score * 4.5).toFixed(2)} bits/char)</span>
          </div>
          <div style="height: 6px; background: var(--input-bg); border-radius: 4px; overflow: hidden;">
            <div style="width: ${entropyPct}%; height: 100%; background: ${entropyPct > 60 ? 'var(--accent-crimson)' : 'var(--accent-cyan)'}; transition: width 0.4s ease;"></div>
          </div>
        </div>

        <h4 style="font-family: var(--font-mono); font-size: 0.85rem; margin-bottom: 0.75rem; color: var(--text-main);">
          Threat Indicators & Heuristics Breakdown:
        </h4>
        ${indicatorsHtml}
      </div>
    `;
  }
};
