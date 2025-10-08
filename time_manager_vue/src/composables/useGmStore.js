// GM Store - Now uses universal time store for backward compatibility
import { ref, computed } from 'vue';
import {
  users as universalUsers,
  timeLogs as universalTimeLogs,
  currentUser as universalCurrentUser,
  isLoading as universalIsLoading,
  error as universalError,
  initializeTimeData,
  refreshWorkingTimes,
  clockIn as universalClockIn,
  clockOut as universalClockOut,
  startBreak as universalStartBreak,
  endBreak as universalEndBreak,
  todaysLog as universalTodaysLog,
  weeklyHours as universalWeeklyHours,
  monthlyHours as universalMonthlyHours,
  recentLogs as universalRecentLogs
} from './useTimeStore.js';

// Backward compatibility - re-export universal store values
export const users = universalUsers;
export const timeLogs = universalTimeLogs;
export const currentUser = universalCurrentUser;
export const activeView = ref('overview');
export const isLoading = universalIsLoading;
export const error = universalError;

// Initialize GM data (wrapper for backward compatibility)
export const initializeGmData = async () => {
  await initializeTimeData('gm');
};

// Initialize data from API (legacy compatibility)
export const initializeData = async () => {
  await initializeTimeData('gm');
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

  users.value.push(response.data);
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

  const userIndex = users.value.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users.value[userIndex] = response.data;
  }
  return response.data;
};

export const deleteUser = async (userId) => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  await authenticatedRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
  const userIndex = users.value.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users.value.splice(userIndex, 1);
  }
};

export const getDashboardStats = async () => {
  const { authenticatedRequest } = await import('@/composables/useAuthStore.js');
  return await authenticatedRequest('/dashboard/stats');
};

// Re-export universal clock functions
export const clockIn = universalClockIn;
export const clockOut = universalClockOut;
export const startBreak = universalStartBreak;
export const endBreak = universalEndBreak;

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
  universalTimeLogs.value.filter(log => log.date === new Date().toISOString().split('T')[0])
);

export const userLogs = computed(() => (userId) =>
  universalTimeLogs.value.filter(log => log.userId === userId)
);

// Re-export universal computed properties
export const todaysLog = universalTodaysLog;
export const weeklyHours = universalWeeklyHours;
export const monthlyHours = universalMonthlyHours;
export const recentLogs = universalRecentLogs;

// CSV Export function
export const exportUserLogsToCSV = (userId) => {
  const user = users.value.find(u => u.id === userId);
  const logs = universalTimeLogs.value.filter(log => log.userId === userId);
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
