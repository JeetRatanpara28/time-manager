// Manager Store - Now uses universal time store for backward compatibility
import { ref, computed } from 'vue';

// NOTE: avoid direct top-level destructured import from `useTimeStore.js`
// to prevent circular import / temporal dead zone issues. Instead we
// create placeholder exports and wire them to the universal store with
// a dynamic import after module evaluation.

// Placeholder reactive bindings (will be reassigned to the universal store's
// refs once the dynamic import completes). Initializing with sensible
// defaults keeps consumers from crashing during early access.
export let users = ref([]);
export let timeLogs = ref([]);
export let currentUser = ref(null);
export let isLoading = ref(false);
export let error = ref(null);

// Function placeholders - will be set to the universal implementations
// after dynamic import resolves.
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

// Wire up the placeholders to the real universal store asynchronously.
(async () => {
  try {
    const mod = await import('./useTimeStore.js');

    // Rebind exported variables to the universal store refs/values.
    users = mod.users;
    timeLogs = mod.timeLogs;
    currentUser = mod.currentUser;
    isLoading = mod.isLoading;
    error = mod.error;

    // Wire functions/computeds
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
    console.error('Failed to load universal time store for manager store:', err);
  }
})();

// Backward compatibility - the exported placeholders above will be wired to
// the universal store when the dynamic import completes.

// API service
const getApiServiceInstance = async () => {
  // Dynamic import to avoid circular dependencies
  const { getApiService } = await import('@/services/apiService.js');
  return getApiService();
};

// Initialize manager data
export const initializeManagerData = async () => {
  return initializeTimeDataFn('manager');
};

// Re-export universal functions with same names for compatibility
// refreshWorkingTimes is already imported and available

export const addUser = async (userData) => {
  const { getApiService } = await import('@/services/apiService.js');
  const apiService = getApiService();
  const response = await apiService.createUser(userData);
  // Ensure users is wired - if not, push into placeholder ref
  if (users && users.value) {
    users.value.push(response.data);
  }
  return response.data;
};

export const updateUser = async (userId, updates) => {
  const { getApiService } = await import('@/services/apiService.js');
  const apiService = getApiService();
  const response = await apiService.updateUser(userId, updates);
  if (users && users.value) {
    const userIndex = users.value.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users.value[userIndex] = response.data;
    }
  }
  return response.data;
};

// Re-export universal clock functions
export const clockIn = (...args) => universalClockInFn(...args);
export const clockOut = (...args) => universalClockOutFn(...args);
export const startBreak = (...args) => universalStartBreakFn(...args);
export const endBreak = (...args) => universalEndBreakFn(...args);

// Re-export universal computed properties
export const todaysLog = (() => universalTodaysLogComp)();
export const weeklyHours = (() => universalWeeklyHoursComp)();
export const monthlyHours = (() => universalMonthlyHoursComp)();
export const recentLogs = (() => universalRecentLogsComp)();

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
  URL.revokeObjectURL(url);
};

// useManagerStore composable function
export const useManagerStore = () => {
  // Helper function to get API service
  const getApiService = async () => {
    const { getApiService: apiService } = await import('@/services/apiService.js');
    return apiService();
  };

  return {
    // Reactive state
    users,
    timeLogs,
    currentUser,
    isLoading,
    error,

    // Computed properties
    employees,
    teamMembers,
    todaysLogs,
    teamTodaysLogs,
    teamStats,

    // Functions
    initializeManagerData,
    addUser,
    updateUser,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    exportTeamLogsToCSV,

    // Manager-specific API methods
    fetchTeamMembers: async (managerId) => {
      const apiService = await getApiService();
      const response = await apiService.getTeamMembers(managerId);
      if (users && users.value) {
        users.value = response.data || [];
      }
      return response.data;
    },

    fetchTodayActivities: async (employeeIds) => {
      const apiService = await getApiService();
      const response = await apiService.getTodayActivities(employeeIds);
      return response.data || [];
    },

    fetchTeamStats: async (managerId) => {
      const apiService = await getApiService();
      const response = await apiService.getTeamStats(managerId);
      return response.data || {
        totalMembers: 0,
        activeNow: 0,
        onBreak: 0,
        completedToday: 0
      };
    },

    fetchTeamProductivity: async (managerId) => {
      const apiService = await getApiService();
      const response = await apiService.getTeamProductivity(managerId);
      return response.data || [];
    },

    setSelectedEmployee: (employee) => {
      // Store selected employee in session storage for navigation
      sessionStorage.setItem('selectedEmployee', JSON.stringify(employee));
    },

    exportEmployeeLogs: async (employeeId) => {
      const apiService = await getApiService();
      const response = await apiService.exportEmployeeLogs(employeeId);

      // If API doesn't handle CSV export, use the local export function
      if (!response || !response.data) {
        exportTeamLogsToCSV(employeeId);
      }

      return response;
    },

    subscribeToEmployeeStatusUpdates: (callback) => {
      // Placeholder for real-time updates - could be implemented with WebSockets
      // For now, this is a no-op but allows the component to call it without error
      return () => {}; // Return unsubscribe function
    },

    // Additional helper methods
    refreshWorkingTimes: async () => {
      return refreshWorkingTimesFn();
    },

    // Computed aliases for backward compatibility
    todaysLog,
    weeklyHours,
    monthlyHours,
    recentLogs,
  };
};
