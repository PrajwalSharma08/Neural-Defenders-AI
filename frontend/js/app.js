import { parseURL, isValidURL, findTrackingParams, isShortURL } from './utils/urlUtils.js';
import { Storage } from './utils/storage.js';
import { HistoryModule } from './modules/history.js';
import { URLParserModule } from './modules/urlParser.js';
import { URLCleanerModule } from './modules/urlCleaner.js';
import { URLUnshortenerModule } from './modules/urlUnshortener.js';
import { StatusCheckerModule } from './modules/statusChecker.js';
import { PatternCheckerModule } from './modules/patternChecker.js';

class URLCheckApp {
  constructor() {
    this.currentUrl = '';
    this.modules = {};
    this.history = new HistoryModule();
    this.init();
  }

  init() {
    this.initModules();
    this.initUI();
    this.initEventListeners();
    this.initModeAndTheme();
    this.loadSettings();
    this.showToast('LinkGuard ready!', 'info');
  }

  initModules() {
    this.modules = {
      urlParser: new URLParserModule(),
      urlCleaner: new URLCleanerModule(),
      urlUnshortener: new URLUnshortenerModule(),
      statusChecker: new StatusCheckerModule(),
      patternChecker: new PatternCheckerModule(),
    };
  }

  initUI() {
    // Set up tool panel collapse/expand toggles
    document.querySelectorAll('.tool-panel-card').forEach(card => {
      if (card.id !== 'urlParserModule') {
        card.classList.add('collapsed');
      }
      const header = card.querySelector('.panel-header');
      if (header) {
        header.addEventListener('click', (e) => {
          if (e.target.closest('button:not(.panel-collapse-trigger)')) return;
          card.classList.toggle('collapsed');
        });
      }
    });
  }

  initEventListeners() {
    const urlInput = document.getElementById('urlInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const cleanBtn = document.getElementById('cleanBtn');
    const unshortenBtn = document.getElementById('unshortenBtn');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const scanBtn = document.getElementById('scanBtn');
    const openBtn = document.getElementById('openBtn');
    const copyBtn = document.getElementById('copyBtn');
    const shareBtn = document.getElementById('shareBtn');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const addPatternBtn = document.getElementById('addPatternBtn');

    // URL input
    if (urlInput) {
      urlInput.addEventListener('input', () => this.onUrlChange(urlInput.value));
      urlInput.addEventListener('paste', (e) => {
        setTimeout(() => this.onUrlChange(urlInput.value), 0);
      });
    }

    // Paste button
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (urlInput) urlInput.value = text;
          this.onUrlChange(text);
          this.showToast('Pasted from clipboard', 'success');
        } catch (e) {
          this.showToast('Cannot access clipboard', 'error');
        }
      });
    }

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (urlInput) urlInput.value = '';
        this.onUrlChange('');
      });
    }

    // Module action buttons
    if (cleanBtn) cleanBtn.addEventListener('click', () => this.cleanUrl());
    if (unshortenBtn) unshortenBtn.addEventListener('click', () => this.unshortenUrl());
    if (checkStatusBtn) checkStatusBtn.addEventListener('click', () => this.checkStatus());
    if (scanBtn) scanBtn.addEventListener('click', () => this.scanUrl());

    // Open & Share
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (this.currentUrl) window.open(this.currentUrl, '_blank');
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(this.currentUrl);
          this.showToast('URL copied!', 'success');
        } catch(e) {
          this.showToast('Failed to copy', 'error');
        }
      });
    }
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ url: this.currentUrl });
          } catch(e) {}
        } else {
          await navigator.clipboard.writeText(this.currentUrl);
          this.showToast('URL copied (share not supported)', 'info');
        }
      });
    }

    // Sample / Demo URLs pills
    document.querySelectorAll('.sample-pill, .demo-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const sampleUrl = pill.dataset.url;
        const input = document.getElementById('urlInput');
        if (input) input.value = sampleUrl;
        this.onUrlChange(sampleUrl);
      });
    });

    // Auto-Fix button
    const autoFixBtn = document.getElementById('autoFixBtn');
    if (autoFixBtn) {
      autoFixBtn.addEventListener('click', () => this.autoFixUrl());
    }


    if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
    if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => this.clearChangeHistory());

    // Settings
    if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettings());
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeSettings());
    if (settingsOverlay) {
      settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) this.closeSettings();
      });
    }

    // Pattern
    if (addPatternBtn) addPatternBtn.addEventListener('click', () => this.addPatternRule());

    // Settings actions
    document.getElementById('exportSettingsBtn')?.addEventListener('click', () => this.exportSettings());
    document.getElementById('importSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', (e) => this.importSettings(e));

    // VT API key save (both in module and settings)
    document.getElementById('saveVtKey')?.addEventListener('click', () => {
      const key = document.getElementById('vtApiKey')?.value;
      if (key) {
        Storage.setApiKey('virustotal', key);
        this.showToast('API key saved', 'success');
      }
    });
    document.getElementById('settingsSaveVtKey')?.addEventListener('click', () => {
      const key = document.getElementById('settingsVtApiKey')?.value;
      if (key) {
        Storage.setApiKey('virustotal', key);
        const modKey = document.getElementById('vtApiKey');
        if (modKey) modKey.value = key;
        this.showToast('API key saved', 'success');
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this.redo(); }
      if (e.ctrlKey && e.key === 'v' && document.activeElement !== urlInput) {
        if (pasteBtn) pasteBtn.click();
      }
    });

    // Anti-Quishing QR Code Scanner
    this.initQrScanner();
  }

  onUrlChange(url) {
    const trimmed = url.trim();
    // Auto-add protocol if missing
    let processedUrl = trimmed;
    if (trimmed && !trimmed.match(/^[a-zA-Z]+:\/\//)) {
      processedUrl = 'https://' + trimmed;
    }
    
    const valid = isValidURL(processedUrl);
    const statusEl = document.getElementById('inputStatus');
    
    if (!trimmed) {
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'input-status';
      }
      this.currentUrl = '';
      this.updateButtonStates(false);
      this.clearAllModules();
      return;
    }

    if (valid) {
      if (statusEl) {
        statusEl.innerHTML = '<span class="status-valid">✓ Valid URL</span>';
        statusEl.className = 'input-status valid';
      }
      
      const oldUrl = this.currentUrl;
      this.currentUrl = processedUrl;
      
      if (oldUrl && oldUrl !== processedUrl) {
        this.history.push(oldUrl, processedUrl, 'Manual edit');
      } else if (!oldUrl) {
        this.history.push('', processedUrl, 'URL entered');
      }
      
      this.updateButtonStates(true);
      this.processUrl(processedUrl);
    } else {
      if (statusEl) {
        statusEl.innerHTML = '<span class="status-invalid">✗ Invalid URL</span>';
        statusEl.className = 'input-status invalid';
      }
      this.currentUrl = '';
      this.updateButtonStates(false);
      this.clearAllModules();
    }
  }

  async processUrl(url) {
    if (!url) {
      this.clearAllModules();
      return;
    }

    // Hide final results card while steps run
    const scoreCard = document.getElementById('heroScoreCard');
    if (scoreCard) scoreCard.style.display = 'none';

    const stepper = document.getElementById('pipelineStepper');
    if (stepper) stepper.style.display = 'flex';

    // Step 1: Breakdown (URL Syntax)
    this.updateStepUI(1, 'active');
    if (this.modules.urlParser) this.modules.urlParser.analyze(url);
    await new Promise(r => setTimeout(r, 60));
    this.updateStepUI(1, 'completed');

    // Step 2: Analyze (Trackers, Shorteners, Rules)
    this.updateStepUI(2, 'active');
    if (this.modules.urlCleaner) this.modules.urlCleaner.analyze(url);
    if (this.modules.patternChecker) this.modules.patternChecker.analyze(url);
    await new Promise(r => setTimeout(r, 60));
    this.updateStepUI(2, 'completed');

    // Step 3: Existence Check (HTTP Status)
    this.updateStepUI(3, 'active');
    let statusResult = null;
    if (this.modules.statusChecker) {
      statusResult = await this.modules.statusChecker.check(url);
    }
    this.updateStepUI(3, 'completed');

    // Step 4: Safety & Threat Evaluation
    this.updateStepUI(4, 'active');
    if (this.history) this.history.render();
    await new Promise(r => setTimeout(r, 60));
    this.updateStepUI(4, 'completed');

    // SHOW FINAL RESULTS DASHBOARD ONLY AFTER ALL 4 STEPS COMPLETE!
    this.calculateScore(url, statusResult);
  }

  updateStepUI(stepNum, status) {
    const item = document.getElementById(`step${stepNum}Item`);
    if (!item) return;
    if (status === 'active') {
      item.classList.remove('completed');
      item.classList.add('active');
    } else if (status === 'completed') {
      item.classList.remove('active');
      item.classList.add('completed');
      const badge = item.querySelector('.step-badge');
      if (badge) badge.textContent = '✓';
    } else {
      item.classList.remove('active', 'completed');
      const badge = item.querySelector('.step-badge');
      if (badge) badge.textContent = stepNum.toString();
    }
  }

  clearAllModules() {
    Object.values(this.modules).forEach(m => {
      if (m && m.clear) m.clear();
    });
    const scoreCard = document.getElementById('heroScoreCard');
    if (scoreCard) scoreCard.style.display = 'none';
    const stepper = document.getElementById('pipelineStepper');
    if (stepper) stepper.style.display = 'none';
    [1, 2, 3, 4].forEach(num => this.updateStepUI(num, 'reset'));
  }

  updateButtonStates(enabled) {
    const buttons = ['cleanBtn', 'unshortenBtn', 'checkStatusBtn', 'openBtn', 'copyBtn', 'shareBtn', 'qrBtn'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !enabled;
    });
  }

  calculateScore(url, statusResult = null) {
    const scoreCard = document.getElementById('heroScoreCard');
    if (!url || !scoreCard) {
      if (scoreCard) scoreCard.style.display = 'none';
      return;
    }

    let score = 100;
    const issues = [];
    const parsed = parseURL(url);

    if (!parsed) {
      scoreCard.style.display = 'none';
      return;
    }

    // Check 1: Tracking params
    const trackerResult = findTrackingParams(url);
    if (trackerResult && trackerResult.found.length > 0) {
      const count = trackerResult.found.length;
      const penalty = Math.min(count * 15, 45);
      score -= penalty;
      issues.push({ type: 'warning', text: `${count} tracker${count > 1 ? 's' : ''} detected (-${penalty}%)` });
    }

    // Check 2: Insecure HTTP
    if (parsed.scheme === 'http') {
      score -= 20;
      issues.push({ type: 'warning', text: 'Insecure HTTP (-20%)' });
    }

    // Check 3: Short URL
    if (isShortURL(url)) {
      score -= 15;
      issues.push({ type: 'info', text: 'Shortened Link (-15%)' });
    }

    // Check 4: Link Existence / Reachability
    if (statusResult) {
      if (statusResult.exists === false) {
        score -= 40;
        issues.push({ type: 'warning', text: `Unreachable / Dead Link (-40%)` });
      } else if (statusResult.isRedirect) {
        score -= 10;
        issues.push({ type: 'info', text: `Link Redirects (${statusResult.statusCode}) (-10%)` });
      } else {
        issues.push({ type: 'info', text: `Link Verified Live (${statusResult.statusCode} OK)` });
      }
    }

    score = Math.max(0, Math.min(100, score));
    scoreCard.style.display = 'flex';

    // Render Radial Score
    const radial = document.getElementById('scoreRadial');
    const valEl = document.getElementById('scoreValue');
    const titleEl = document.getElementById('scoreTitle');
    const subTitleEl = document.getElementById('scoreSubtitle');
    const issuesEl = document.getElementById('scoreIssues');
    const autoFixBtn = document.getElementById('autoFixBtn');

    if (valEl) valEl.textContent = `${score}%`;

    let color = 'var(--accent-green)';
    if (score < 60) color = 'var(--accent-red)';
    else if (score < 85) color = 'var(--accent-yellow)';

    if (radial) {
      radial.style.background = `conic-gradient(${color} calc(${score} * 1%), rgba(255,255,255,0.08) 0)`;
      radial.style.boxShadow = `0 0 15px ${color}`;
    }

    if (titleEl) {
      if (score === 100) titleEl.textContent = 'Clean & Secure';
      else if (score >= 80) titleEl.textContent = 'Good — Minor Recommendations';
      else if (score >= 50) titleEl.textContent = 'Warning — Issues Found';
      else titleEl.textContent = 'Critical Risks Detected';
    }

    if (subTitleEl) {
      subTitleEl.textContent = issues.length === 0 ? 'No tracking params or security risks found' : `${issues.length} item(s) need attention`;
    }

    if (issuesEl) {
      issuesEl.innerHTML = issues.map(iss => `<span class="score-issue-tag ${iss.type}">${iss.text}</span>`).join('');
    }

    if (autoFixBtn) {
      autoFixBtn.style.display = score < 100 ? 'inline-flex' : 'none';
    }
  }

  async autoFixUrl() {
    let fixedUrl = this.currentUrl;
    let fixesCount = 0;

    // 1. Strip tracking params
    const trackerResult = findTrackingParams(fixedUrl);
    if (trackerResult && trackerResult.cleanUrl !== fixedUrl) {
      fixedUrl = trackerResult.cleanUrl;
      fixesCount += trackerResult.found.length;
    }

    // 2. Upgrade http to https
    if (fixedUrl.startsWith('http://')) {
      fixedUrl = fixedUrl.replace(/^http:\/\//, 'https://');
      fixesCount++;
    }

    // 3. Unshorten if short URL
    if (isShortURL(fixedUrl) && this.modules.urlUnshortener) {
      const res = await this.modules.urlUnshortener.unshorten(fixedUrl);
      if (res && res.resolved && res.resolved !== fixedUrl) {
        fixedUrl = res.resolved;
        fixesCount++;
      }
    }

    if (fixedUrl !== this.currentUrl) {
      this.updateUrl(fixedUrl, 'Auto-Fix Link');
      this.showToast('Link auto-fixed successfully!', 'success');
    } else {
      this.showToast('Link is already fully clean & secure!', 'info');
    }
  }

  initModeAndTheme() {
    // Mode
    const mode = Storage.get('view_mode', 'compact');
    this.setMode(mode);

    const compactBtn = document.getElementById('compactModeBtn');
    const powerBtn = document.getElementById('powerModeBtn');

    if (compactBtn) compactBtn.addEventListener('click', () => this.setMode('compact'));
    if (powerBtn) powerBtn.addEventListener('click', () => this.setMode('power'));

    // Themes
    const theme = Storage.get('theme', 'cyber');
    this.setTheme(theme);

    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedTheme = card.dataset.theme;
        this.setTheme(selectedTheme);
      });
    });

    // Scan Submit button (CheckPhish style)
    const scanBtn = document.getElementById('scanSubmitBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        const input = document.getElementById('urlInput');
        if (input && input.value) {
          this.onUrlChange(input.value);
        }
      });
    }

    // Navigation tool tabs handler
    const toolTabsBar = document.getElementById('toolTabsBar');
    if (toolTabsBar) {
      toolTabsBar.addEventListener('click', (e) => {
        const item = e.target.closest('.nav-tab-btn, .nav-tab-item');
        if (!item) return;
        e.preventDefault();
        const target = item.dataset.tab;
        this.switchTab(target);
      });
    }

    // Default to active tab
    const activeTab = document.querySelector('#toolTabsBar .active')?.dataset.tab || 'all';
    this.switchTab(activeTab);
  }

  switchTab(target) {
    if (!target) target = 'all';
    this.currentTab = target;

    document.querySelectorAll('#toolTabsBar .nav-tab-btn, #toolTabsBar .nav-tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === target);
    });

    const allCards = document.querySelectorAll('.tool-panel-card, .module-card');

    allCards.forEach(card => {
      const modId = card.dataset.module;
      if (target === 'all' || modId === target) {
        card.style.setProperty('display', 'block', 'important');
        card.classList.remove('collapsed');
        const body = card.querySelector('.panel-body, .module-body');
        if (body) body.style.setProperty('display', 'block', 'important');
      } else {
        card.style.setProperty('display', 'none', 'important');
      }
    });
  }

  setMode(mode) {
    document.body.className = mode === 'compact' ? 'mode-compact' : 'mode-power';
    document.documentElement.setAttribute('data-mode', mode);
    Storage.set('view_mode', mode);

    const compactBtn = document.getElementById('compactModeBtn');
    const powerBtn = document.getElementById('powerModeBtn');

    if (compactBtn) compactBtn.classList.toggle('active', mode === 'compact');
    if (powerBtn) powerBtn.classList.toggle('active', mode === 'power');

    this.showToast(`Switched to ${mode === 'compact' ? 'Compact' : 'Power-User'} Mode`, 'info');
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.set('theme', theme);

    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === theme);
    });
  }

  // --- Anti-Quishing QR Code Scanner ---
  initQrScanner() {
    const qrScanBtn = document.getElementById('qrScanBtn');
    const closeBtn = document.getElementById('closeQrModalBtn');
    const modal = document.getElementById('qrScannerModal');
    const uploadTabBtn = document.getElementById('qrUploadTabBtn');
    const cameraTabBtn = document.getElementById('qrCameraTabBtn');
    const dropZone = document.getElementById('qrDropZone');
    const fileInput = document.getElementById('qrFileInput');
    const stopCamBtn = document.getElementById('stopCameraBtn');

    if (qrScanBtn) qrScanBtn.addEventListener('click', () => this.openQrModal());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeQrModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeQrModal();
      });
    }

    if (uploadTabBtn) uploadTabBtn.addEventListener('click', () => this.switchQrTab('upload'));
    if (cameraTabBtn) cameraTabBtn.addEventListener('click', () => this.switchQrTab('camera'));

    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput && fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleQrFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleQrFile(e.target.files[0]);
        }
      });
    }

    if (stopCamBtn) stopCamBtn.addEventListener('click', () => this.stopCameraScanner());
  }

  openQrModal() {
    const modal = document.getElementById('qrScannerModal');
    if (modal) modal.style.display = 'flex';
    this.switchQrTab('upload');
    const status = document.getElementById('qrScanStatus');
    if (status) status.innerHTML = '';
  }

  closeQrModal() {
    const modal = document.getElementById('qrScannerModal');
    if (modal) modal.style.display = 'none';
    this.stopCameraScanner();
  }

  switchQrTab(tab) {
    const uploadBtn = document.getElementById('qrUploadTabBtn');
    const cameraBtn = document.getElementById('qrCameraTabBtn');
    const uploadPane = document.getElementById('qrUploadPane');
    const cameraPane = document.getElementById('qrCameraPane');

    if (tab === 'upload') {
      if (uploadBtn) uploadBtn.classList.add('active');
      if (cameraBtn) cameraBtn.classList.remove('active');
      if (uploadPane) uploadPane.style.display = 'block';
      if (cameraPane) cameraPane.style.display = 'none';
      this.stopCameraScanner();
    } else {
      if (cameraBtn) cameraBtn.classList.add('active');
      if (uploadBtn) uploadBtn.classList.remove('active');
      if (cameraPane) cameraPane.style.display = 'block';
      if (uploadPane) uploadPane.style.display = 'none';
      this.startCameraScanner();
    }
  }

  handleQrFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => this.decodeQrFromImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  decodeQrFromImage(img) {
    const canvas = document.getElementById('qrCanvas');
    const status = document.getElementById('qrScanStatus');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (window.jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        this.processDecodedUrl(code.data);
      } else {
        if (status) status.innerHTML = '<span style="color: var(--accent-red)">⚠ No valid QR code detected in image</span>';
      }
    } else {
      this.showToast('QR decoder library loading...', 'info');
    }
  }

  startCameraScanner() {
    const video = document.getElementById('qrVideo');
    const status = document.getElementById('qrScanStatus');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.innerHTML = '<span style="color: var(--accent-red)">Camera access not supported on this device/browser</span>';
      return;
    }

    if (status) status.innerHTML = '<span style="color: var(--accent-cyan)">Align QR code inside frame...</span>';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        this.qrStream = stream;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', true);
          video.play();
          this.scanCameraFrame();
        }
      })
      .catch(err => {
        if (status) status.innerHTML = `<span style="color: var(--accent-red)">Camera access denied: ${err.message}</span>`;
      });
  }

  scanCameraFrame() {
    const video = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');
    if (!video || !this.qrStream || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (this.qrStream) this.qrAnimFrame = requestAnimationFrame(() => this.scanCameraFrame());
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (window.jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code && code.data) {
        this.processDecodedUrl(code.data);
        this.stopCameraScanner();
        return;
      }
    }
    this.qrAnimFrame = requestAnimationFrame(() => this.scanCameraFrame());
  }

  stopCameraScanner() {
    if (this.qrStream) {
      this.qrStream.getTracks().forEach(track => track.stop());
      this.qrStream = null;
    }
    if (this.qrAnimFrame) {
      cancelAnimationFrame(this.qrAnimFrame);
      this.qrAnimFrame = null;
    }
  }

  processDecodedUrl(rawText) {
    this.closeQrModal();
    const input = document.getElementById('urlInput');
    if (input) input.value = rawText;
    this.showToast('🛡️ Anti-Quishing: Extracted URL from QR Code!', 'success');
    this.onUrlChange(rawText);
  }

  updateUrl(newUrl, reason) {
    const oldUrl = this.currentUrl;
    this.currentUrl = newUrl;
    const urlInput = document.getElementById('urlInput');
    if (urlInput) urlInput.value = newUrl;
    this.history.push(oldUrl, newUrl, reason);
    this.processUrl(newUrl);
    this.updateButtonStates(true);
  }

  async cleanUrl() {
    if (!this.modules.urlCleaner) return;
    const result = this.modules.urlCleaner.clean(this.currentUrl);
    if (result && result.cleanUrl !== this.currentUrl) {
      this.updateUrl(result.cleanUrl, `Cleaned ${result.removed.length} tracking param(s)`);
      this.showToast(`Removed ${result.removed.length} tracking parameter(s)`, 'success');
    } else {
      this.showToast('URL is already clean!', 'info');
    }
  }

  async unshortenUrl() {
    if (!this.modules.urlUnshortener) return;
    const result = await this.modules.urlUnshortener.unshorten(this.currentUrl);
    if (result && result.resolved && result.resolved !== this.currentUrl) {
      this.updateUrl(result.resolved, 'Unshortened URL');
      this.showToast('URL unshortened!', 'success');
    } else if (result && result.error) {
      this.showToast(result.error, 'error');
    } else {
      this.showToast('URL does not appear to be shortened', 'info');
    }
  }

  async checkStatus() {
    if (!this.modules.statusChecker) return;
    await this.modules.statusChecker.check(this.currentUrl);
  }

  async scanUrl() {
    if (!this.modules.virusTotal) return;
    const apiKey = Storage.getApiKey('virustotal');
    if (!apiKey) {
      this.showToast('Please enter a VirusTotal API key first', 'warning');
      return;
    }
    await this.modules.virusTotal.scan(this.currentUrl, apiKey);
  }

  undo() {
    if (!this.history) return;
    const entry = this.history.undo();
    if (entry) {
      this.currentUrl = entry.url;
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.value = entry.url;
      this.processUrl(entry.url);
      this.updateButtonStates(!!entry.url);
    }
  }

  redo() {
    if (!this.history) return;
    const entry = this.history.redo();
    if (entry) {
      this.currentUrl = entry.url;
      const urlInput = document.getElementById('urlInput');
      if (urlInput) urlInput.value = entry.url;
      this.processUrl(entry.url);
      this.updateButtonStates(!!entry.url);
    }
  }

  clearChangeHistory() {
    if (this.history) this.history.clear();
    this.showToast('History cleared', 'info');
  }

  addPatternRule() {
    if (this.modules.patternChecker) this.modules.patternChecker.showAddRuleDialog();
  }

  // Settings
  openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) overlay.classList.add('active');
    this.renderSettingsModuleList();
    // Load saved VT key
    const vtKey = Storage.getApiKey('virustotal');
    if (vtKey) {
      const el = document.getElementById('settingsVtApiKey');
      if (el) el.value = vtKey;
    }
  }

  closeSettings() {
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) overlay.classList.remove('active');
  }

  renderSettingsModuleList() {
    const list = document.getElementById('moduleList');
    if (!list) return;
    const settings = Storage.getModuleSettings();
    list.innerHTML = '';
    
    const moduleNames = {
      urlParser: 'URL Breakdown',
      urlCleaner: 'URL Cleaner',
      urlUnshortener: 'URL Unshortener',
      statusChecker: 'Status Checker',
      patternChecker: 'Pattern Checker',
      history: 'History',
      openShare: 'Open & Share'
    };

    settings.order.forEach(moduleId => {
      const li = document.createElement('li');
      li.className = 'module-setting-item';
      li.dataset.moduleId = moduleId;
      li.draggable = true;
      li.innerHTML = `
        <span class="drag-handle">⠿</span>
        <span class="module-setting-name">${moduleNames[moduleId] || moduleId}</span>
        <label class="toggle-switch">
          <input type="checkbox" ${settings.enabled[moduleId] !== false ? 'checked' : ''} data-module="${moduleId}">
          <span class="toggle-slider"></span>
        </label>
      `;
      list.appendChild(li);
    });

    // Toggle listeners
    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const moduleId = cb.dataset.module;
        const card = document.querySelector(`[data-module="${moduleId}"]`);
        if (card) {
          card.style.display = cb.checked ? '' : 'none';
        }
        this.saveModuleSettings();
      });
    });

    // Drag-and-drop reordering
    this.initDragReorder(list);
  }

  initDragReorder(list) {
    let dragItem = null;
    list.addEventListener('dragstart', (e) => {
      dragItem = e.target.closest('.module-setting-item');
      if (dragItem) dragItem.classList.add('dragging');
    });
    list.addEventListener('dragend', () => {
      if (dragItem) dragItem.classList.remove('dragging');
      dragItem = null;
      this.saveModuleSettings();
    });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        if (dragItem) list.appendChild(dragItem);
      } else {
        if (dragItem) list.insertBefore(dragItem, afterElement);
      }
    });
  }

  getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.module-setting-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  saveModuleSettings() {
    const items = document.querySelectorAll('.module-setting-item');
    const order = [];
    const enabled = {};
    items.forEach(item => {
      const id = item.dataset.moduleId;
      order.push(id);
      enabled[id] = item.querySelector('input[type=checkbox]').checked;
    });
    Storage.setModuleSettings({ order, enabled });
  }

  loadSettings() {
    const settings = Storage.getModuleSettings();
    // Apply module order
    const container = document.getElementById('modulesContainer');
    if (container) {
      settings.order.forEach(moduleId => {
        const card = document.querySelector(`[data-module="${moduleId}"]`);
        if (card) container.appendChild(card);
      });
    }
    // Re-apply current tab selection cleanly
    this.switchTab(this.currentTab || 'all');
  }

  exportSettings() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkguard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Settings exported', 'success');
  }

  importSettings(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Storage.importAll(data);
        this.loadSettings();
        this.showToast('Settings imported', 'success');
      } catch (err) {
        this.showToast('Invalid settings file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-message">${message}</span>
      <div class="toast-progress"></div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('active'));
    
    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.urlCheckApp = new URLCheckApp();
});
