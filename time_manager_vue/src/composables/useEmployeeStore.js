// Employee Store - Now uses universal time store for backward compatibility
import { computed, ref } from 'vue';

// Create placeholder refs that will be wired to universal store
export const users = ref([]);
export const timeLogs = ref([]);
export const currentUser = ref(null);
export const isLoading = ref(false);
export const error = ref(null);

// Create placeholder computed refs that will be properly wired
export const todaysLog = ref(null);
export const weeklyHours = ref('0.0');
export const monthlyHours = ref('0.0');
export const recentLogs = ref([]);

// Function placeholders
let initializeTimeDataFn = async () => {};
let refreshWorkingTimesFn = async () => {};
let universalClockInFn = async () => {};
let universalClockOutFn = async () => {};
let universalStartBreakFn = async () => {};
let universalEndBreakFn = async () => {};

// Wire up to universal store
(async () => {
  try {
    const mod = await import('./useTimeStore.js');
    
    // Wire refs
    users.value = mod.users.value;
    timeLogs.value = mod.timeLogs.value;
    currentUser.value = mod.currentUser.value;
    isLoading.value = mod.isLoading.value;
    error.value = mod.error.value;

    // Watch for changes in universal store and sync
    if (mod.users && mod.users.value) {
      Object.defineProperty(users, 'value', {
        get: () => mod.users.value,
        set: (val) => { mod.users.value = val; }
      });
    }
    
    if (mod.timeLogs && mod.timeLogs.value) {
      Object.defineProperty(timeLogs, 'value', {
        get: () => mod.timeLogs.value,
        set: (val) => { mod.timeLogs.value = val; }
      });
    }
    
    if (mod.currentUser && mod.currentUser.value) {
      Object.defineProperty(currentUser, 'value', {
        get: () => mod.currentUser.value,
        set: (val) => { mod.currentUser.value = val; }
      });
    }
    
    if (mod.isLoading && mod.isLoading.value !== undefined) {
      Object.defineProperty(isLoading, 'value', {
        get: () => mod.isLoading.value,
        set: (val) => { mod.isLoading.value = val; }
      });
    }
    
    if (mod.error && mod.error.value !== undefined) {
      Object.defineProperty(error, 'value', {
        get: () => mod.error.value,
        set: (val) => { mod.error.value = val; }
      });
    }

    // Wire computed properties properly
    if (mod.todaysLog && mod.todaysLog.value !== undefined) {
      Object.defineProperty(todaysLog, 'value', {
        get: () => mod.todaysLog.value
      });
    }
    
    if (mod.weeklyHours && mod.weeklyHours.value !== undefined) {
      Object.defineProperty(weeklyHours, 'value', {
        get: () => mod.weeklyHours.value
      });
    }
    
    if (mod.monthlyHours && mod.monthlyHours.value !== undefined) {
      Object.defineProperty(monthlyHours, 'value', {
        get: () => mod.monthlyHours.value
      });
    }
    
    if (mod.recentLogs && mod.recentLogs.value !== undefined) {
      Object.defineProperty(recentLogs, 'value', {
        get: () => mod.recentLogs.value
      });
    }

    // Wire functions
    initializeTimeDataFn = mod.initializeTimeData;
    refreshWorkingTimesFn = mod.refreshWorkingTimes;
    universalClockInFn = mod.clockIn;
    universalClockOutFn = mod.clockOut;
    universalStartBreakFn = mod.startBreak;
    universalEndBreakFn = mod.endBreak;

    console.log('✅ Employee store wired to universal time store');
  } catch (err) {
    console.error('❌ Failed to load universal time store for employee store:', err);
  }
})();

// Initialize employee data
export const initializeEmployeeData = async () => {
  return initializeTimeDataFn('employee');
};

// Re-export universal functions with same names for compatibility
export const clockIn = (...args) => universalClockInFn(...args);
export const clockOut = (...args) => universalClockOutFn(...args);
export const startBreak = (...args) => universalStartBreakFn(...args);
export const endBreak = (...args) => universalEndBreakFn(...args);
export const refreshWorkingTimes = (...args) => refreshWorkingTimesFn(...args);