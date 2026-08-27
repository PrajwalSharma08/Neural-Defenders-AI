export class HistoryModule {
  constructor() {
    this.stack = []; // Array of {oldUrl, newUrl, reason, timestamp}
    this.pointer = -1; // Current position in stack
  }

  push(oldUrl, newUrl, reason) {
    // When a new change is pushed, discard any entries after pointer (branch off)
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push({
      oldUrl,
      newUrl,
      reason,
      timestamp: new Date()
    });
    this.pointer = this.stack.length - 1;
    this.updateButtons();
    this.render();
  }

  undo() {
    if (this.pointer > 0) {
      this.pointer--;
      this.updateButtons();
      this.render();
      return { url: this.stack[this.pointer].newUrl };
    } else if (this.pointer === 0) {
      this.pointer--;
      this.updateButtons();
      this.render();
      return { url: this.stack[0].oldUrl };
    }
    return null;
  }

  redo() {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      this.updateButtons();
      this.render();
      return { url: this.stack[this.pointer].newUrl };
    }
    return null;
  }

  clear() {
    this.stack = [];
    this.pointer = -1;
    this.updateButtons();
    this.render();
  }

  updateButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = this.pointer < 0;
    if (redoBtn) redoBtn.disabled = this.pointer >= this.stack.length - 1;
    
    // Update status
    const status = document.getElementById('historyStatus');
    if (status) {
      if (this.stack.length > 0) {
        status.innerHTML = `<span class="status-badge info">${this.stack.length} change${this.stack.length !== 1 ? 's' : ''}</span>`;
      } else {
        status.innerHTML = '';
      }
    }
  }

  render() {
    const log = document.getElementById('historyLog');
    if (!log) return;
    
    if (this.stack.length === 0) {
      log.innerHTML = '<p class="module-placeholder">Changes will be logged here</p>';
      return;
    }
    
    // Render log entries in reverse order (newest first)
    // Each entry shows: timestamp, reason, old->new URL diff
    // Highlight current position with an 'active' class
    // For the URL change, show removed text in red and added text in green
    // Format timestamp as HH:MM:SS
    // Use <div class="history-entry active/"> wrapping
    log.innerHTML = this.stack.map((entry, i) => {
      const time = entry.timestamp.toLocaleTimeString();
      const isActive = i === this.pointer;
      return `
        <div class="history-entry ${isActive ? 'active' : ''}">
          <div class="history-entry-header">
            <span class="history-time">${time}</span>
            <span class="history-reason">${entry.reason}</span>
          </div>
          <div class="history-diff">
            ${entry.oldUrl ? `<div class="history-old"><span class="diff-indicator">−</span>${this.escapeHtml(entry.oldUrl)}</div>` : ''}
            <div class="history-new"><span class="diff-indicator">+</span>${this.escapeHtml(entry.newUrl)}</div>
          </div>
        </div>
      `;
    }).reverse().join('');
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
