// Manager Store - Now uses universal time store for backward compatibility
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
export const isLoading = universalIsLoading;
export const error = universalError;

// API service
const getApiServiceInstance = async () => {
  // Dynamic import to avoid circular dependencies
  const { getApiService } = await import('@/services/apiService.js');
  return getApiService();
};

// Initialize manager data
export const initializeManagerData = async () => {
  await initializeTimeData('manager');
};

// Re-export universal functions with same names for compatibility
// refreshWorkingTimes is already imported and available

export const addUser = async (userData) => {
  const { getApiService } = await import('@/services/apiService.js');
  const apiService = getApiService();
  const response = await apiService.createUser(userData);
  users.value.push(response.data);
  return response.data;
};

export const updateUser = async (userId, updates) => {
  const { getApiService } = await import('@/services/apiService.js');
  const apiService = getApiService();
  const response = await apiService.updateUser(userId, updates);
  const userIndex = users.value.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users.value[userIndex] = response.data;
  }
  return response.data;
};

// Re-export universal clock functions
export const clockIn = universalClockIn;
export const clockOut = universalClockOut;
export const startBreak = universalStartBreak;
export const endBreak = universalEndBreak;

// Re-export universal computed properties
export const todaysLog = universalTodaysLog;
export const weeklyHours = universalWeeklyHours;
export const monthlyHours = universalMonthlyHours;
export const recentLogs = universalRecentLogs;

// Manager-specific computed properties
export const employees = computed(() =>
  users.value.filter(u => u.role === 'employee')
);

export const teamMembers = computed(() =>
  users.value.filter(u => u.role !== 'general_manager') // All non-GM users
);

export const todaysLogs = computed(() =>
  timeLogs.value.filter(log => log.date === new Date().toISOString().split('T')[0])
);

export const teamTodaysLogs = computed(() =>
  timeLogs.value.filter(log =>
    log.date === new Date().toISOString().split('T')[0] &&
    users.value.find(u => u.id === log.userId)?.role !== 'general_manager'
  )
);

// Team productivity metrics
export const teamStats = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const teamLogs = timeLogs.value.filter(log =>
    users.value.find(u => u.id === log.userId)?.role !== 'general_manager'
  );

  const todaysTeamLogs = teamLogs.filter(log => log.date === today);
  const activeNow = todaysTeamLogs.filter(log => log.status === 'active').length;
  const totalTeamMembers = users.value.filter(u => u.role !== 'general_manager').length;

  return {
    totalMembers: totalTeamMembers,
    activeNow: activeNow,
    onBreak: todaysTeamLogs.filter(log => log.breakStart && !log.breakEnd).length,
    completedToday: todaysTeamLogs.filter(log => log.status === 'complete').length
  };
});

// CSV Export for team logs
export const exportTeamLogsToCSV = (userId) => {
  const user = users.value.find(u => u.id === userId);
  const logs = timeLogs.value.filter(log => log.userId === userId);

  if (!user || logs.length === 0) return null;

  const headers = ['Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      log.date,
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      log.totalHours || '',
      log.status
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
