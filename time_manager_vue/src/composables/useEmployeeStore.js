// Employee Store - Now uses universal time store for backward compatibility
import { computed, ref } from 'vue';

// Avoid top-level destructured import from `useTimeStore.js` to prevent
// circular import / TDZ errors. We create placeholder exports and wire
// them to the universal store with a dynamic import.

export let users = ref([]);
export let timeLogs = ref([]);
export let currentUser = ref(null);
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
    console.error('Failed to load universal time store for employee store:', err);
  }
})();

// Initialize employee data
export const initializeEmployeeData = async () => {
  return initializeTimeDataFn('employee');
};

// Re-export universal functions with same names for compatibility
// refreshWorkingTimes is already imported and available
export const clockIn = (...args) => universalClockInFn(...args);
export const clockOut = (...args) => universalClockOutFn(...args);
export const startBreak = (...args) => universalStartBreakFn(...args);
export const endBreak = (...args) => universalEndBreakFn(...args);

// Re-export universal computed properties - these are already computed in useTimeStore.js
export const todaysLog = (() => universalTodaysLogComp)();
export const weeklyHours = (() => universalWeeklyHoursComp)();
export const monthlyHours = (() => universalMonthlyHoursComp)();
export const recentLogs = (() => universalRecentLogsComp)();
