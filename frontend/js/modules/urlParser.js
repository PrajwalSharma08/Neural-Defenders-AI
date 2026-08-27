import { parseURL } from '../utils/urlUtils.js';

export class URLParserModule {
  constructor() {
    this.partsEl = document.getElementById('urlParts');
    this.visualEl = document.getElementById('urlVisual');
    this.statusEl = document.getElementById('urlParserStatus');
  }

  analyze(url) {
    const parsed = parseURL(url);
    if (!parsed) {
      this.clear();
      return;
    }
    this.renderParts(parsed);
    this.renderVisual(parsed);
    this.updateStatus(parsed);
  }

  renderParts(parsed) {
    // Render a grid of labeled URL parts
    // Each part is a <div class="url-part-card scheme/host/path/params/fragment">
    //   <div class="url-part-label">Label</div>
    //   <div class="url-part-value">Value</div>
    // </div>
    // Parts: Scheme, Host, Port (if present), Path, Query Parameters (each as sub-item), Fragment (if present)
    // For query params, render each key=value pair as a list
    // Use color coding: scheme=cyan, host=violet, path=green, params=yellow, fragment=orange
    
    let html = '<div class="url-parts-grid">';
    
    // Scheme
    html += this.createPartCard('Scheme', parsed.scheme, 'scheme');
    
    // Host
    html += this.createPartCard('Host', parsed.hostname, 'host');
    
    // Port
    if (parsed.port) {
      html += this.createPartCard('Port', parsed.port, 'host');
    }
    
    // Path
    if (parsed.pathname && parsed.pathname !== '/') {
      html += this.createPartCard('Path', parsed.pathname, 'path');
    }
    
    // Query Parameters
    const paramKeys = Object.keys(parsed.searchParams);
    if (paramKeys.length > 0) {
      let paramHtml = '<div class="params-list">';
      paramKeys.forEach(key => {
        parsed.searchParams[key].forEach(val => {
          paramHtml += `<div class="param-item"><span class="param-key">${this.escapeHtml(key)}</span><span class="param-eq">=</span><span class="param-val">${this.escapeHtml(val)}</span></div>`;
        });
      });
      paramHtml += '</div>';
      html += `<div class="url-part-card params"><div class="url-part-label">Parameters (${paramKeys.length})</div><div class="url-part-value">${paramHtml}</div></div>`;
    }
    
    // Fragment
    if (parsed.fragment) {
      html += this.createPartCard('Fragment', parsed.fragment, 'fragment');
    }
    
    html += '</div>';
    if (this.partsEl) {
      this.partsEl.innerHTML = html;
      this.partsEl.querySelectorAll('.copy-part-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = btn.dataset.copyVal;
          if (val && navigator.clipboard) {
            navigator.clipboard.writeText(val);
            if (window.urlCheckApp) window.urlCheckApp.showToast(`Copied: ${val}`, 'success');
          }
        });
      });
    }
  }

  createPartCard(label, value, colorClass) {
    return `
      <div class="url-part-card ${colorClass}">
        <div class="url-part-header">
          <span class="url-part-label">${label}</span>
          <button class="copy-part-btn" data-copy-val="${this.escapeHtml(value)}" title="Copy segment">📋</button>
        </div>
        <div class="url-part-value">${this.escapeHtml(value)}</div>
      </div>
    `;
  }

  renderVisual(parsed) {
    // Render the full URL with colored spans for each part
    // <span class="url-segment scheme">https</span><span class="url-segment-sep">://</span><span class="url-segment host">example.com</span>...
    let html = '';
    html += `<span class="url-segment scheme">${this.escapeHtml(parsed.scheme)}</span>`;
    html += `<span class="url-segment-sep">://</span>`;
    html += `<span class="url-segment host">${this.escapeHtml(parsed.hostname)}</span>`;
    if (parsed.port) {
      html += `<span class="url-segment-sep">:</span><span class="url-segment host">${parsed.port}</span>`;
    }
    if (parsed.pathname && parsed.pathname !== '/') {
      html += `<span class="url-segment path">${this.escapeHtml(parsed.pathname)}</span>`;
    } else if (parsed.pathname === '/') {
      html += `<span class="url-segment-sep">/</span>`;
    }
    if (parsed.search) {
      html += `<span class="url-segment params">${this.escapeHtml(parsed.search)}</span>`;
    }
    if (parsed.hash) {
      html += `<span class="url-segment fragment">${this.escapeHtml(parsed.hash)}</span>`;
    }
    if (this.visualEl) this.visualEl.innerHTML = html;
  }

  updateStatus(parsed) {
    if (!this.statusEl) return;
    const isSecure = parsed.scheme === 'https';
    this.statusEl.innerHTML = isSecure 
      ? '<span class="status-badge success">HTTPS</span>'
      : '<span class="status-badge warning">HTTP</span>';
  }

  clear() {
    if (this.partsEl) this.partsEl.innerHTML = '';
    if (this.visualEl) this.visualEl.innerHTML = '';
    if (this.statusEl) this.statusEl.innerHTML = '';
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
