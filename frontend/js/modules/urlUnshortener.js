import { isShortURL } from '../utils/urlUtils.js';

export class URLUnshortenerModule {
  constructor() {
    this.resultsEl = document.getElementById('unshortenerResults');
    this.statusEl = document.getElementById('urlUnshortenerStatus');
  }

  async unshorten(url) {
    // Show loading state
    if (this.resultsEl) {
      this.resultsEl.innerHTML = '<div class="loading-shimmer"><div class="shimmer-line"></div><div class="shimmer-line short"></div></div>';
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge info">Resolving...</span>';

    const isShort = isShortURL(url);
    
    try {
      // Try allorigins proxy first
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      // Check if we got a different URL (redirect)
      if (data.status && data.status.url && data.status.url !== url) {
        const resolved = data.status.url;
        this.showResolved(url, resolved);
        return { resolved };
      }
      
      // Try to extract from HTML meta refresh or og:url
      if (data.contents) {
        const metaMatch = data.contents.match(/url=([^"'\s>]+)/i);
        const ogMatch = data.contents.match(/property="og:url"\s+content="([^"]+)"/i);
        const canonicalMatch = data.contents.match(/rel="canonical"\s+href="([^"]+)"/i);
        
        const resolved = metaMatch?.[1] || ogMatch?.[1] || canonicalMatch?.[1];
        if (resolved && resolved !== url) {
          this.showResolved(url, resolved);
          return { resolved };
        }
      }

      // If it's a known shortener but we couldn't resolve
      if (isShort) {
        this.showError('Could not resolve shortened URL (CORS restriction)');
        return { error: 'Could not resolve shortened URL due to CORS restrictions' };
      }

      // Not a short URL
      if (this.resultsEl) {
        this.resultsEl.innerHTML = '<div class="clean-badge"><span class="badge-icon">ℹ</span> This URL does not appear to be shortened</div>';
      }
      if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge info">Not shortened</span>';
      return { resolved: url };
      
    } catch (e) {
      // Fallback: just report
      if (isShort) {
        this.showError('Network error while resolving URL');
        return { error: 'Network error: ' + e.message };
      }
      if (this.resultsEl) {
        this.resultsEl.innerHTML = '<div class="clean-badge"><span class="badge-icon">ℹ</span> This URL does not appear to be shortened</div>';
      }
      if (this.statusEl) this.statusEl.innerHTML = '';
      return { resolved: url };
    }
  }

  showResolved(original, resolved) {
    if (this.resultsEl) {
      this.resultsEl.innerHTML = `
        <div class="unshorten-result">
          <div class="unshorten-row"><span class="unshorten-label">Original:</span><span class="unshorten-url original">${this.escapeHtml(original)}</span></div>
          <div class="unshorten-arrow">↓</div>
          <div class="unshorten-row"><span class="unshorten-label">Resolved:</span><span class="unshorten-url resolved">${this.escapeHtml(resolved)}</span></div>
        </div>`;
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge success">Resolved</span>';
  }

  showError(msg) {
    if (this.resultsEl) {
      this.resultsEl.innerHTML = `<div class="module-error"><span class="error-icon">⚠</span> ${msg}</div>`;
    }
    if (this.statusEl) this.statusEl.innerHTML = '<span class="status-badge danger">Error</span>';
  }

  clear() {
    if (this.resultsEl) this.resultsEl.innerHTML = '<p class="module-placeholder">Shortened URLs will be resolved here</p>';
    if (this.statusEl) this.statusEl.innerHTML = '';
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
