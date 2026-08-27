import { findTrackingParams } from '../utils/urlUtils.js';

export class URLCleanerModule {
  constructor() {
    this.resultsEl = document.getElementById('cleanerResults');
    this.statusEl = document.getElementById('urlCleanerStatus');
    this.lastAnalysis = null;
  }

  analyze(url) {
    const result = findTrackingParams(url);
    this.lastAnalysis = result;
    
    if (!result || result.found.length === 0) {
      if (this.resultsEl) this.resultsEl.innerHTML = '<div class="clean-badge"><span class="badge-icon">✓</span> No tracking parameters found</div>';
      if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge success">Clean</span>';
      return;
    }
    
    // Show found tracking params
    let html = `<div class="tracking-found"><p class="tracking-count">${result.found.length} tracking parameter${result.found.length !== 1 ? 's' : ''} found:</p><ul class="tracking-list">`;
    result.found.forEach(param => {
      html += `<li class="tracking-item"><span class="tracking-name">${this.escapeHtml(param.name)}</span><span class="tracking-eq">=</span><span class="tracking-value">${this.escapeHtml(param.value)}</span></li>`;
    });
    html += '</ul></div>';
    
    if (this.resultsEl) this.resultsEl.innerHTML = html;
    if (this.statusEl) this.statusEl.innerHTML = `<span class="status-badge warning">${result.found.length} tracker${result.found.length !== 1 ? 's' : ''}</span>`;
  }

  clean(url) {
    const result = findTrackingParams(url);
    if (!result) return null;
    
    // After cleaning, update the display
    if (result.found.length > 0) {
      let html = `<div class="clean-badge"><span class="badge-icon">✓</span> Removed ${result.found.length} tracking parameter${result.found.length !== 1 ? 's' : ''}:</div>`;
      html += '<ul class="tracking-list cleaned">';
      result.found.forEach(param => {
        html += `<li class="tracking-item removed"><span class="tracking-name">${this.escapeHtml(param.name)}</span><span class="tracking-eq">=</span><span class="tracking-value">${this.escapeHtml(param.value)}</span></li>`;
      });
      html += '</ul>';
      if (this.resultsEl) this.resultsEl.innerHTML = html;
      if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge success">Cleaned</span>';
    }
    
    return { cleanUrl: result.cleanUrl, removed: result.found };
  }

  clear() {
    if (this.resultsEl) this.resultsEl.innerHTML = '<p class="module-placeholder">Tracking parameters will be identified here</p>';
    if (this.statusEl) this.statusEl.innerHTML = '';
    this.lastAnalysis = null;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
