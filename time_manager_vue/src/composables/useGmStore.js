// GM Store - Now uses universal time store for backward compatibility
import { ref, computed } from 'vue';

// Avoid direct top-level import to prevent TDZ/circular import issues.
export let users = ref([]);
export let timeLogs = ref([]);
export let currentUser = ref(null);
export const activeView = ref('overview');
export let isLoading = ref(false);
export let error = ref(null);

let initializeTimeDataFn = async () => {};
let refreshWorkingTimesFn = async () => {};
let universalClockInFn = async () => {};
let universalClockOutFn = async () => {};
let universalStartBreakFn = async () => {};
let universalEndBreakFn = async () => {};
let universalTodaysLogComp = null;
let universalWeeklyHoursComp = null;
let universalMonthlyHoursComp = null;
let universalRecentLogsComp = null;

(async () => {
  try {
    const mod = await import('./useTimeStore.js');
    users = mod.users;
    timeLogs = mod.timeLogs;
    currentUser = mod.currentUser;
    isLoading = mod.isLoading;
    error = mod.error;

    initializeTimeDataFn = mod.initializeTimeData;
    refreshWorkingTimesFn = mod.refreshWorkingTimes;
    universalClockInFn = mod.clockIn;
    universalClockOutFn = mod.clockOut;
    universalStartBreakFn = mod.startBreak;
    universalEndBreakFn = mod.endBreak;

    universalTodaysLogComp = mod.todaysLog;
    universalWeeklyHoursComp = mod.weeklyHours;
    universalMonthlyHoursComp = mod.monthlyHours;
    universalRecentLogsComp = mod.recentLogs;
  } catch (err) {
    console.error('Failed to load universal time store for GM store:', err);
  }
})();

// Initialize GM data (wrapper for backward compatibility)
export const initializeGmData = async () => {
  return initializeTimeDataFn('gm');
};

// Initialize data from API (legacy compatibility)
export const initializeData = async () => {
  return initializeTimeDataFn('gm');
};

// Re-export universal functions with same names for compatibility
export const addUser = async (userData) => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  const response = await authenticatedRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ user: userData }),
  });

  // Ensure password field is included in the response
  if (userData.password) {
    response.data.password = userData.password;
  } else {
    response.data.password = 'password123'; // Default password for demo
  }

  if (users && users.value) users.value.push(response.data);
  return response.data;
};

export const updateUser = async (userId, updates) => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  const response = await authenticatedRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ user: updates }),
  });

  // Ensure password field is included in the response
  if (updates.password) {
    response.data.password = updates.password;
  }

  if (users && users.value) {
    const userIndex = users.value.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users.value[userIndex] = response.data;
    }
  }
  return response.data;
};

export const deleteUser = async (userId) => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  await authenticatedRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
  if (users && users.value) {
    const userIndex = users.value.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users.value.splice(userIndex, 1);
    }
  }
};

export const getDashboardStats = async () => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  return await authenticatedRequest('/dashboard/stats');
};

// Re-export universal clock functions
export const clockIn = (...args) => universalClockInFn(...args);
export const clockOut = (...args) => universalClockOutFn(...args);
export const startBreak = (...args) => universalStartBreakFn(...args);
export const endBreak = (...args) => universalEndBreakFn(...args);

// Re-export universal computed properties
export const employees = computed(() =>
  users.value.filter(u => u.role === 'employee')
);

export const managers = computed(() =>
  users.value.filter(u => u.role === 'manager')
);

export const generalManagers = computed(() =>
  users.value.filter(u => u.role === 'general_manager')
);

export const onlineUsers = computed(() =>
  users.value.filter(u => u.status === 'online')
);

export const offlineUsers = computed(() =>
  users.value.filter(u => u.status === 'offline')
);

export const todaysLogs = computed(() =>
  timeLogs.value.filter(log => log.date === new Date().toISOString().split('T')[0])
);

export const userLogs = computed(() => (userId) =>
  timeLogs.value.filter(log => log.userId === userId)
);

// Re-export universal computed properties
export const todaysLog = (() => universalTodaysLogComp)();
export const weeklyHours = (() => universalWeeklyHoursComp)();
export const monthlyHours = (() => universalMonthlyHoursComp)();
export const recentLogs = (() => universalRecentLogsComp)();

// CSV Export function
export const exportUserLogsToCSV = (userId) => {
  const user = users.value.find(u => u.id === userId);
  const logs = timeLogs.value.filter(log => log.userId === userId);
  if (!user || logs.length === 0) return null;

  const headers = ['Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Overtime'];
  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      log.date,
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      log.totalHours || '',
      log.overtime || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${user.name}_time_logs.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
