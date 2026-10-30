const RETENTION_DAYS = 365;

function getCutoffDateStr(): string {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return cutoff.toISOString().split('T')[0];
}

export const localStorageBackup = {
  save: (key: string, data: any) => {
    try {
      const cutoff = getCutoffDateStr();
      let sanitizedData = data;
      if (Array.isArray(data)) {
        sanitizedData = data.filter((item: any) => !item.date || item.date >= cutoff);
      }
      const payload = {
        updatedAt: new Date().toISOString(),
        data: sanitizedData
      };
      localStorage.setItem(`KB_FACTORY_BACKUP_${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Local storage backup save warning:', e);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(`KB_FACTORY_BACKUP_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const cutoff = getCutoffDateStr();
      let result = parsed.data;
      if (Array.isArray(result)) {
        result = result.filter((item: any) => !item.date || item.date >= cutoff);
      }
      return result as T;
    } catch (e) {
      console.warn('Local storage backup read warning:', e);
      return null;
    }
  },

  clearAll: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('KB_FACTORY_BACKUP_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Local storage clear warning:', e);
    }
  }
};
