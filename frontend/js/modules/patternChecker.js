import { Storage } from '../utils/storage.js';

export class PatternCheckerModule {
  constructor() {
    this.resultsEl = document.getElementById('patternResults');
    this.rulesEl = document.getElementById('patternRules');
    this.statusEl = document.getElementById('patternCheckerStatus');
    this.rules = Storage.getPatternRules();
    this.renderRules();
  }

  analyze(url) {
    if (!url) {
      this.clear();
      return;
    }

    const activeRules = this.rules.filter(r => r.enabled !== false);
    const matches = [];

    activeRules.forEach(rule => {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(url)) {
          let replacedUrl = null;
          if (rule.replacement !== undefined && rule.replacement !== null) {
            replacedUrl = url.replace(regex, rule.replacement);
          }
          matches.push({ rule, replacedUrl });
        }
      } catch (e) {
        console.error('Invalid regex in pattern rule:', rule.pattern, e);
      }
    });

    if (matches.length === 0) {
      if (this.resultsEl) {
        this.resultsEl.innerHTML = '<div class="clean-badge"><span class="badge-icon">✓</span> No rule violations or patterns matched</div>';
      }
      if (this.statusEl) {
        this.statusEl.innerHTML = '<span class="status-badge success">Passed</span>';
      }
      return;
    }

    let html = '<div class="pattern-matches-list">';
    matches.forEach(match => {
      html += `
        <div class="pattern-match-item">
          <div class="pattern-match-header">
            <span class="rule-name">${this.escapeHtml(match.rule.name)}</span>
            <span class="rule-pattern"><code>${this.escapeHtml(match.rule.pattern)}</code></span>
          </div>
          ${match.replacedUrl && match.replacedUrl !== url ? `
            <div class="pattern-suggestion">
              <span>Suggested change:</span>
              <span class="new-url-preview">${this.escapeHtml(match.replacedUrl)}</span>
              <button class="small-btn apply-rule-btn" data-new-url="${this.escapeHtml(match.replacedUrl)}" data-reason="${this.escapeHtml(match.rule.name)}">Apply</button>
            </div>
          ` : ''}
        </div>
      `;
    });
    html += '</div>';

    if (this.resultsEl) this.resultsEl.innerHTML = html;
    if (this.statusEl) {
      this.statusEl.innerHTML = `<span class="status-badge warning">${matches.length} match${matches.length > 1 ? 'es' : ''}</span>`;
    }

    // Attach event listeners for apply buttons
    if (this.resultsEl) {
      this.resultsEl.querySelectorAll('.apply-rule-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const newUrl = e.target.dataset.newUrl;
          const reason = e.target.dataset.reason;
          if (window.urlCheckApp && newUrl) {
            window.urlCheckApp.updateUrl(newUrl, `Applied rule: ${reason}`);
          }
        });
      });
    }
  }

  renderRules() {
    if (!this.rulesEl) return;
    this.rules = Storage.getPatternRules();

    if (this.rules.length === 0) {
      this.rulesEl.innerHTML = '<p class="module-placeholder">No custom pattern rules added</p>';
      return;
    }

    let html = '<div class="rules-list-container"><h4>Configured Rules</h4><ul class="rules-list">';
    this.rules.forEach(rule => {
      html += `
        <li class="rule-item" data-id="${rule.id}">
          <label class="toggle-switch small">
            <input type="checkbox" class="rule-toggle-cb" data-id="${rule.id}" ${rule.enabled !== false ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
          <div class="rule-info">
            <span class="rule-title">${this.escapeHtml(rule.name)}</span>
            <span class="rule-regex">Pattern: <code>${this.escapeHtml(rule.pattern)}</code></span>
            ${rule.replacement ? `<span class="rule-replace">Replace: <code>${this.escapeHtml(rule.replacement)}</code></span>` : ''}
          </div>
          <button class="icon-btn delete-rule-btn" data-id="${rule.id}" title="Delete Rule">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </li>
      `;
    });
    html += '</ul></div>';

    this.rulesEl.innerHTML = html;

    // Attach rule toggle & delete event listeners
    this.rulesEl.querySelectorAll('.rule-toggle-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const rule = this.rules.find(r => r.id === id);
        if (rule) {
          rule.enabled = e.target.checked;
          Storage.setPatternRules(this.rules);
          if (window.urlCheckApp && window.urlCheckApp.currentUrl) {
            this.analyze(window.urlCheckApp.currentUrl);
          }
        }
      });
    });

    this.rulesEl.querySelectorAll('.delete-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        this.rules = this.rules.filter(r => r.id !== id);
        Storage.setPatternRules(this.rules);
        this.renderRules();
        if (window.urlCheckApp && window.urlCheckApp.currentUrl) {
          this.analyze(window.urlCheckApp.currentUrl);
        }
      });
    });
  }

  showAddRuleDialog() {
    const name = prompt('Rule Name (e.g. Upgrade HTTP to HTTPS):');
    if (!name) return;
    const pattern = prompt('Regex Pattern (e.g. ^http://):');
    if (!pattern) return;
    const replacement = prompt('Replacement (optional, e.g. https://):') || '';

    const newRule = {
      id: Date.now().toString(),
      name: name.trim(),
      pattern: pattern.trim(),
      replacement: replacement.trim(),
      enabled: true
    };

    this.rules.push(newRule);
    Storage.setPatternRules(this.rules);
    this.renderRules();

    if (window.urlCheckApp) {
      window.urlCheckApp.showToast('Rule added', 'success');
      if (window.urlCheckApp.currentUrl) {
        this.analyze(window.urlCheckApp.currentUrl);
      }
    }
  }

  clear() {
    if (this.resultsEl) {
      this.resultsEl.innerHTML = '<p class="module-placeholder">Pattern matches will appear here</p>';
    }
    if (this.statusEl) {
      this.statusEl.innerHTML = '';
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
