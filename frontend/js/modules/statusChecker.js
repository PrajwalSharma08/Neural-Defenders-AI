export class StatusCheckerModule {
  constructor() {
    this.resultsEl = document.getElementById('statusResults');
    this.statusEl = document.getElementById('statusCheckerStatus');
  }

  async check(url) {
    // Show loading
    if (this.resultsEl) {
      this.resultsEl.innerHTML = '<div class="loading-shimmer"><div class="shimmer-line"></div><div class="shimmer-line short"></div></div>';
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge info">Checking...</span>';

    try {
      // Try via CORS proxy to get actual status
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      const statusCode = data.status?.http_code || response.status;
      const statusText = this.getStatusText(statusCode);
      const statusClass = this.getStatusClass(statusCode);
      
      this.showStatus(statusCode, statusText, statusClass, url, data);
      
    } catch (e) {
      // Fallback: try direct fetch
      try {
        const response = await fetch(url, { mode: 'no-cors', method: 'HEAD' });
        // In no-cors mode, we get type 'opaque' with status 0
        this.showStatus(0, 'Reachable (status hidden by CORS)', 'info', url);
      } catch (e2) {
        this.showStatus(-1, 'Unreachable — ' + e2.message, 'danger', url);
      }
    }
  }

  showStatus(code, text, statusClass, url, data) {
    let html = '<div class="status-display">';
    
    if (code > 0) {
      html += `<div class="status-code-large ${statusClass}">${code}</div>`;
      html += `<div class="status-text">${text}</div>`;
    } else if (code === 0) {
      html += `<div class="status-code-large info">OK</div>`;
      html += `<div class="status-text">${text}</div>`;
    } else {
      html += `<div class="status-code-large danger">✗</div>`;
      html += `<div class="status-text">${text}</div>`;
    }
    
    // Show response info if available
    if (data && data.status) {
      html += '<div class="status-details">';
      if (data.status.content_type) html += `<div class="status-detail"><span class="detail-label">Content-Type:</span> ${this.escapeHtml(data.status.content_type)}</div>`;
      if (data.status.content_length) html += `<div class="status-detail"><span class="detail-label">Size:</span> ${this.formatBytes(data.status.content_length)}</div>`;
      if (data.status.url && data.status.url !== url) html += `<div class="status-detail"><span class="detail-label">Final URL:</span> <span class="redirected-url">${this.escapeHtml(data.status.url)}</span></div>`;
      html += '</div>';
    }
    
    html += '</div>';
    if (this.resultsEl) this.resultsEl.innerHTML = html;
    
    // Update status badge
    if (this.statusEl) {
      if (code >= 200 && code < 300) {
        this.statusEl.innerHTML = `<span class="status-badge success">${code} OK</span>`;
      } else if (code >= 300 && code < 400) {
        this.statusEl.innerHTML = `<span class="status-badge info">${code} Redirect</span>`;
      } else if (code >= 400) {
        this.statusEl.innerHTML = `<span class="status-badge danger">${code} Error</span>`;
      } else if (code === 0) {
        this.statusEl.innerHTML = '<span class="status-badge success">Reachable</span>';
      } else {
        this.statusEl.innerHTML = '<span class="status-badge danger">Unreachable</span>';
      }
    }
  }

  getStatusText(code) {
    const codes = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      301: 'Moved Permanently', 302: 'Found (Redirect)', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 408: 'Request Timeout', 429: 'Too Many Requests',
      500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable', 504: 'Gateway Timeout'
    };
    return codes[code] || (code >= 200 && code < 300 ? 'Success' : code >= 300 && code < 400 ? 'Redirect' : code >= 400 && code < 500 ? 'Client Error' : code >= 500 ? 'Server Error' : 'Unknown');
  }

  getStatusClass(code) {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'info';
    if (code >= 400) return 'danger';
    return 'info';
  }

  formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    const b = parseInt(bytes);
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(1) + ' MB';
  }

  clear() {
    if (this.resultsEl) this.resultsEl.innerHTML = '<p class="module-placeholder">HTTP status will appear here</p>';
    if (this.statusEl) this.statusEl.innerHTML = '';
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
