const STORAGE_PREFIX = 'urlcheck_';

export const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage', e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error('Error removing from localStorage', e);
    }
  },
  getModuleSettings() {
    const defaultSettings = {
      order: [
        'urlParser', 'urlCleaner', 'urlUnshortener', 'statusChecker',
        'patternChecker', 'history', 'openShare'
      ],
      enabled: {
        urlParser: true, urlCleaner: true, urlUnshortener: true, statusChecker: true,
        patternChecker: true, history: true, openShare: true
      }
    };
    return this.get('module_settings', defaultSettings);
  },
  setModuleSettings(settings) {
    this.set('module_settings', settings);
  },
  getApiKey(service) {
    return this.get(`apikey_${service}`, '');
  },
  setApiKey(service, key) {
    this.set(`apikey_${service}`, key);
  },
  getHistory() {
    return this.get('history', []);
  },
  addToHistory(entry) {
    const history = this.getHistory();
    history.unshift(entry);
    if (history.length > 100) {
      history.length = 100;
    }
    this.set('history', history);
  },
  clearHistory() {
    this.remove('history');
  },
  getPatternRules() {
    const defaultRules = [
      { id: '1', name: 'Force HTTPS', pattern: '^http://', replacement: 'https://', enabled: true }
    ];
    return this.get('pattern_rules', defaultRules);
  },
  setPatternRules(rules) {
    this.set('pattern_rules', rules);
  },
  exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        try {
          data[key.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    }
    return data;
  },
  importAll(data) {
    if (!data || typeof data !== 'object') return false;
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
    }
    return true;
  }
};
