// Employee Store - Now uses universal time store for backward compatibility
import { computed } from 'vue';
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

// Initialize employee data
export const initializeEmployeeData = async () => {
  await initializeTimeData('employee');
};

// Re-export universal functions with same names for compatibility
// refreshWorkingTimes is already imported and available
export const clockIn = universalClockIn;
export const clockOut = universalClockOut;
export const startBreak = universalStartBreak;
export const endBreak = universalEndBreak;

// Re-export universal computed properties - these are already computed in useTimeStore.js
export const todaysLog = universalTodaysLog;
export const weeklyHours = universalWeeklyHours;
export const monthlyHours = universalMonthlyHours;
export const recentLogs = universalRecentLogs;
