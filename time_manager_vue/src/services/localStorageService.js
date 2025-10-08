// Local Storage Service for persistent data storage
// Uses browser localStorage to persist data between sessions

class LocalStorageService {
  constructor() {
    this.STORAGE_KEYS = {
      USERS: 'time_manager_users',
      TIME_LOGS: 'time_manager_time_logs',
      CURRENT_USER: 'time_manager_current_user',
      APP_SETTINGS: 'time_manager_settings'
    };
  }

  // Generic storage methods
  setItem(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  clearAll() {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Users management
  getUsers() {
    return this.getItem(this.STORAGE_KEYS.USERS, []);
  }

  saveUsers(users) {
    return this.setItem(this.STORAGE_KEYS.USERS, users);
  }

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    return this.saveUsers(users);
  }

  updateUser(userId, updates) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      return this.saveUsers(users);
    }
    return false;
  }

  deleteUser(userId) {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    return this.saveUsers(filteredUsers);
  }

  // Time logs management
  getTimeLogs() {
    return this.getItem(this.STORAGE_KEYS.TIME_LOGS, []);
  }

  saveTimeLogs(timeLogs) {
    return this.setItem(this.STORAGE_KEYS.TIME_LOGS, timeLogs);
  }

  addTimeLog(timeLog) {
    const timeLogs = this.getTimeLogs();
    timeLogs.push(timeLog);
    return this.saveTimeLogs(timeLogs);
  }

  updateTimeLog(logId, updates) {
    const timeLogs = this.getTimeLogs();
    const index = timeLogs.findIndex(log => log.id === logId);
    if (index !== -1) {
      timeLogs[index] = { ...timeLogs[index], ...updates };
      return this.saveTimeLogs(timeLogs);
    }
    return false;
  }

  deleteTimeLog(logId) {
    const timeLogs = this.getTimeLogs();
    const filteredLogs = timeLogs.filter(log => log.id !== logId);
    return this.saveTimeLogs(filteredLogs);
  }

  // Current user management
  getCurrentUser() {
    return this.getItem(this.STORAGE_KEYS.CURRENT_USER, null);
  }

  saveCurrentUser(user) {
    return this.setItem(this.STORAGE_KEYS.CURRENT_USER, user);
  }

  clearCurrentUser() {
    return this.removeItem(this.STORAGE_KEYS.CURRENT_USER);
  }

  // App settings
  getSettings() {
    return this.getItem(this.STORAGE_KEYS.APP_SETTINGS, {});
  }

  saveSettings(settings) {
    return this.setItem(this.STORAGE_KEYS.APP_SETTINGS, settings);
  }

  // Initialize with default data if empty
  initializeDefaults(defaultUsers = [], defaultTimeLogs = [], defaultCurrentUser = null) {
    if (this.getUsers().length === 0 && defaultUsers.length > 0) {
      this.saveUsers(defaultUsers);
    }

    if (this.getTimeLogs().length === 0 && defaultTimeLogs.length > 0) {
      this.saveTimeLogs(defaultTimeLogs);
    }

    if (!this.getCurrentUser() && defaultCurrentUser) {
      this.saveCurrentUser(defaultCurrentUser);
    }
  }

  // Get storage info
  getStorageInfo() {
    const users = this.getUsers();
    const timeLogs = this.getTimeLogs();
    const currentUser = this.getCurrentUser();

    return {
      usersCount: users.length,
      timeLogsCount: timeLogs.length,
      hasCurrentUser: !!currentUser,
      currentUser: currentUser,
      storageSize: this.getStorageSize()
    };
  }

  // Estimate storage size
  getStorageSize() {
    let total = 0;
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        total += item.length;
      }
    });
    return total; // bytes
  }
}

// Create singleton instance
export const localStorageService = new LocalStorageService();

// Export default
export default localStorageService;
