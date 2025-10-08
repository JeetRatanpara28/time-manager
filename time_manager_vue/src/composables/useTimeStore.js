// Universal Time Store - Handles all user roles (employee, manager, gm)
import { ref, computed } from 'vue';
import { getApiService } from '@/services/apiService.js';
import { currentUser as authCurrentUser } from './useAuthStore.js';

// Universal state - works for all user roles
export const users = ref([]);
export const timeLogs = ref([]);
export const currentUser = ref(null);
export const isLoading = ref(false);
export const error = ref(null);

// API service
const getApiServiceInstance = () => getApiService();

// Initialize data based on user role
export const initializeTimeData = async (userRole = null) => {
  isLoading.value = true;
  error.value = null;

  try {
    const apiService = getApiServiceInstance();

    // Check if we have an authenticated user from the auth store
    if (authCurrentUser.value) {
      // Use the authenticated user
      currentUser.value = authCurrentUser.value;
      console.log('Using authenticated user:', currentUser.value);

      // Load users from API to get all users for filtering
      const usersResponse = await apiService.getUsers();
      users.value = usersResponse.data || [];

      // Add the authenticated user to users if not already present
      const existingUserIndex = users.value.findIndex(u => u.id === authCurrentUser.value.id);
      if (existingUserIndex === -1) {
        users.value.push(authCurrentUser.value);

        // If this is a manager and no employees exist, create some demo employees for them to monitor
        if (authCurrentUser.value.role === 'manager' && !users.value.some(u => u.role === 'employee')) {
          console.log('Creating demo employees for manager to monitor');
          const demoEmployees = [
            {
              id: authCurrentUser.value.id + 1,
              name: 'John Smith',
              email: 'john.smith@company.com',
              role: 'employee',
              department: 'Development',
              status: 'online',
              password: 'password123'
            },
            {
              id: authCurrentUser.value.id + 2,
              name: 'Sarah Johnson',
              email: 'sarah.johnson@company.com',
              role: 'employee',
              department: 'Design',
              status: 'online',
              password: 'password123'
            },
            {
              id: authCurrentUser.value.id + 3,
              name: 'Mike Davis',
              email: 'mike.davis@company.com',
              role: 'employee',
              department: 'Marketing',
              status: 'online',
              password: 'password123'
            }
          ];
          users.value.push(...demoEmployees);
        }
      }
    } else {
      // Fallback to finding user from API
      const usersResponse = await apiService.getUsers();
      users.value = usersResponse.data || [];

      // Ensure all users have password fields for GM visibility
      users.value = users.value.map(user => ({
        ...user,
        password: user.password || `password${user.id || '123'}` // Default password for demo/GM view
      }));

      // Set current user based on role
      let targetUser = null;

      if (userRole === 'employee') {
        const employeeUsers = users.value.filter(u => u.role === 'employee');
        targetUser = employeeUsers.length > 0 ? employeeUsers[0] : null;
      } else if (userRole === 'manager') {
        const managerUsers = users.value.filter(u => u.role === 'manager');
        targetUser = managerUsers.length > 0 ? managerUsers[0] : null;
      } else if (userRole === 'gm') {
        const gmUsers = users.value.filter(u => u.role === 'gm');
        targetUser = gmUsers.length > 0 ? gmUsers[0] : null;
      } else {
        targetUser = users.value.length > 0 ? users.value[0] : null;
      }

      // If no user found, create a demo user for testing
      if (!targetUser) {
        console.warn('No users found, creating demo user for testing');
        targetUser = {
          id: 1,
          name: `Demo ${userRole || 'Employee'}`,
          email: `demo@${userRole || 'employee'}.com`,
          role: userRole || 'employee',
          department: 'Demo',
          status: 'online',
          password: 'password123'
        };
        users.value = [targetUser];

        // If this is a manager, create some demo employees for them to monitor
        if (userRole === 'manager') {
          console.log('Creating demo employees for demo manager');
          const demoEmployees = [
            {
              id: 2,
              name: 'John Smith',
              email: 'john.smith@company.com',
              role: 'employee',
              department: 'Development',
              status: 'online',
              password: 'password123'
            },
            {
              id: 3,
              name: 'Sarah Johnson',
              email: 'sarah.johnson@company.com',
              role: 'employee',
              department: 'Design',
              status: 'online',
              password: 'password123'
            },
            {
              id: 4,
              name: 'Mike Davis',
              email: 'mike.davis@company.com',
              role: 'employee',
              department: 'Marketing',
              status: 'online',
              password: 'password123'
            }
          ];
          users.value.push(...demoEmployees);
        }
      }

      currentUser.value = targetUser;
    }

    // Load working times
    await refreshWorkingTimes();

    // Add demo time logs if no data exists and we have a current user
    if (currentUser.value && timeLogs.value.length === 0) {
      console.log('No time logs found, adding demo data for testing');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create demo time logs for all users (including employees for managers to monitor)
      const allUsers = users.value;
      const demoLogs = [];

      allUsers.forEach((user, index) => {
        // Add today's log
        demoLogs.push({
          id: (index * 2) + 1,
          userId: user.id,
          date: today.toISOString().split('T')[0],
          clockIn: '09:00',
          clockOut: '17:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          status: 'complete',
          totalHours: 8.0
        });

        // Add yesterday's log
        demoLogs.push({
          id: (index * 2) + 2,
          userId: user.id,
          date: yesterday.toISOString().split('T')[0],
          clockIn: '09:15',
          clockOut: '17:30',
          breakStart: '12:30',
          breakEnd: '13:30',
          status: 'complete',
          totalHours: 8.25
        });
      });

      timeLogs.value = demoLogs;
    }

  } catch (err) {
    console.error('Failed to initialize time data:', err);
    error.value = 'Failed to load data from server';
  } finally {
    isLoading.value = false;
  }
};

// Initialize employee data (legacy compatibility)
export const initializeEmployeeData = async () => {
  await initializeTimeData('employee');
};

// Initialize manager data
export const initializeManagerData = async () => {
  await initializeTimeData('manager');
};

// Initialize GM data
export const initializeGmData = async () => {
  await initializeTimeData('gm');
};

export const refreshWorkingTimes = async () => {
  try {
    isLoading.value = true;
    const apiService = getApiServiceInstance();
    const workingTimesResponse = await apiService.getWorkingTimes();
    const workingTimes = workingTimesResponse.data || [];

    // Filter working times based on user role
    let filteredWorkingTimes = workingTimes;

    if (authCurrentUser.value?.role === 'employee') {
      // Employees only see their own logs
      filteredWorkingTimes = workingTimes.filter(wt => wt.user_id === authCurrentUser.value?.id);
    } else if (authCurrentUser.value?.role === 'manager') {
      // Managers see their own logs + team logs (for demo, include all employees)
      const teamUserIds = users.value
        .filter(u => u.role === 'employee' || u.id === authCurrentUser.value?.id)
        .map(u => u.id);
      filteredWorkingTimes = workingTimes.filter(wt => teamUserIds.includes(wt.user_id));
    } else if (authCurrentUser.value?.role === 'gm') {
      // GMs see all logs
      filteredWorkingTimes = workingTimes;
    }

    // If we have real API data, use it; otherwise keep demo data
    if (filteredWorkingTimes.length > 0) {
      // Convert working times to timeLogs format
      timeLogs.value = filteredWorkingTimes.map(wt => {
        // Ensure status consistency: if end_time exists, must be complete
        const hasEndTime = !!wt.end_time;
        const correctStatus = hasEndTime ? 'complete' : 'active';

        const log = {
          id: wt.id,
          userId: wt.user_id,
          date: wt.date,
          clockIn: wt.start_time ? new Date(wt.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
          clockOut: wt.end_time ? new Date(wt.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
          breakStart: wt.break_start ? new Date(wt.break_start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
          breakEnd: wt.break_end ? new Date(wt.break_end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null,
          status: correctStatus, // Use corrected status
          workingTimeId: wt.id,
          totalHours: calculateTotalHours(wt.start_time, wt.end_time)
        };
        return log;
      });
    }
    // If no API data and we have demo data, keep the demo data

  } catch (err) {
    console.error('Failed to refresh working times:', err);
    // Don't throw error, just log it - keep existing data
    console.log('Keeping existing timeLogs data due to API error');
  } finally {
    isLoading.value = false;
  }
};

// Helper function to calculate total hours
const calculateTotalHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

// Clock functions - universal for all roles
export const clockIn = async (userInitiated = false) => {
  if (!userInitiated) {
    console.warn('clockIn called without user initiation flag - blocking auto clock-in');
    return;
  }

  if (!authCurrentUser.value) {
    throw new Error('No user logged in');
  }

  // Check if already clocked in today
  const today = new Date().toISOString().split('T')[0];
  const existingLog = timeLogs.value.find(log =>
    log.userId === authCurrentUser.value.id &&
    log.date === today &&
    log.status === 'active'
  );

  if (existingLog) {
    console.log('Already clocked in today, skipping');
    throw new Error('Already clocked in for today');
  }

  try {
    console.log('clockIn called - setting isLoading to true');
    isLoading.value = true;
    const apiService = getApiServiceInstance();

    // Create new working time record via API
    const workingTimeData = {
      user_id: authCurrentUser.value.id,
      start_time: `${today}T${new Date().toTimeString().split(' ')[0]}`, // ISO format
      date: today
    };

    const response = await apiService.createWorkingTime(workingTimeData);

    // Refresh data from API to get all working times with updated status
    await refreshWorkingTimes();

    return response.data;
  } catch (err) {
    console.error('Failed to clock in:', err);
    // Make sure loading state is reset on error
    isLoading.value = false;
    throw err;
  }
};

export const clockOut = async () => {
  try {
    console.log('clockOut called - setting isLoading to true');
    isLoading.value = true;
    if (!authCurrentUser.value) {
      throw new Error('No current user logged in');
    }

    const today = new Date().toISOString().split('T')[0];
    // Find the most recent active log for today that doesn't have clock_out
    const activeLog = timeLogs.value
      .filter(log =>
        log.userId === authCurrentUser.value.id &&
        log.date === today &&
        log.status === 'active' &&
        log.clockIn && !log.clockOut
      )
      .sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn))[0]; // Most recent first

    if (activeLog && activeLog.workingTimeId) {
      const apiService = getApiServiceInstance();

      // Update working time record via API
      const workingTimeData = {
        end_time: `${today}T${new Date().toTimeString().split(' ')[0]}`, // ISO format
      };

      await apiService.updateWorkingTime(activeLog.workingTimeId, workingTimeData);

      // Refresh data from API to get backend-calculated values
      await refreshWorkingTimes();
    } else {
      throw new Error('No active clock-in session found');
    }
  } catch (err) {
    console.error('Failed to clock out:', err);
    // Make sure loading state is reset on error
    isLoading.value = false;
    throw err;
  }
};

export const startBreak = async () => {
  try {
    isLoading.value = true;

    if (!authCurrentUser.value) {
      throw new Error('No current user logged in');
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('startBreak: looking for active log', {
      currentUser: authCurrentUser.value,
      today: today,
      timeLogsLength: timeLogs.value.length,
      timeLogsContent: timeLogs.value
    });

    // Find the most recent active log for today that doesn't have clock_out and doesn't have an active break
    const activeLog = timeLogs.value
      .filter(log => {
        console.log('startBreak: checking log:', log);
        const userMatch = log.userId === authCurrentUser.value.id;
        const dateMatch = log.date === today;
        const statusMatch = log.status === 'active';
        const clockInMatch = log.clockIn && !log.clockOut;
        const breakMatch = (!log.breakStart || log.breakEnd); // No active break

        console.log('startBreak filter check:', {
          userMatch,
          dateMatch,
          statusMatch,
          clockInMatch,
          breakMatch,
          passes: userMatch && dateMatch && statusMatch && clockInMatch && breakMatch
        });

        return userMatch && dateMatch && statusMatch && clockInMatch && breakMatch;
      })
      .sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn))[0]; // Most recent first

    console.log('startBreak: found activeLog:', activeLog);

    if (activeLog && activeLog.workingTimeId) {
      const apiService = getApiServiceInstance();

      // Update working time record via API
      const workingTimeData = {
        break_start: `${today}T${new Date().toTimeString().split(' ')[0]}`, // ISO format
      };

      await apiService.updateWorkingTime(activeLog.workingTimeId, workingTimeData);

      // Update local state
      activeLog.breakStart = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Refresh data from API to update UI
      await refreshWorkingTimes();
    } else {
      throw new Error('No active clock-in session found or break already active');
    }
  } catch (err) {
    console.error('Failed to start break:', err);
    // Make sure loading state is reset on error
    isLoading.value = false;
    throw err;
  }
};

export const endBreak = async () => {
  try {
    console.log('endBreak called - setting isLoading to true');
    isLoading.value = true;

    if (!authCurrentUser.value) {
      throw new Error('No current user logged in');
    }

    const today = new Date().toISOString().split('T')[0];
    // Find the most recent active log for today that has an active break (break started but not ended)
    const activeLog = timeLogs.value
      .filter(log =>
        log.userId === authCurrentUser.value.id &&
        log.date === today &&
        log.status === 'active' &&
        log.clockIn && !log.clockOut &&
        log.breakStart && !log.breakEnd // Active break (break started but not ended)
      )
      .sort((a, b) => new Date(b.clockIn) - new Date(a.clockIn))[0]; // Most recent first

    if (activeLog && activeLog.workingTimeId) {
      const apiService = getApiServiceInstance();

      // Update working time record via API
      const workingTimeData = {
        break_end: `${today}T${new Date().toTimeString().split(' ')[0]}`, // ISO format
      };

      await apiService.updateWorkingTime(activeLog.workingTimeId, workingTimeData);

      // Update local state
      activeLog.breakEnd = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Refresh data from API to update UI
      await refreshWorkingTimes();
    } else {
      throw new Error('No active break found to end');
    }
  } catch (err) {
    console.error('Failed to end break:', err);
    // Make sure loading state is reset on error
    isLoading.value = false;
    throw err;
  }
};

// Computed properties - universal for all roles
export const todaysLog = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = timeLogs.value.filter(log =>
    log.userId === authCurrentUser.value?.id && log.date === today
  );

  if (todayLogs.length === 0) {
    return null;
  }

  // Prioritize: active logs first, then most recent complete log
  const activeLog = todayLogs.find(log => log.status === 'active');
  if (activeLog) {
    return activeLog;
  }

  // If no active log, return the most recent complete log
  const completeLogs = todayLogs.filter(log => log.status === 'complete');
  if (completeLogs.length > 0) {
    const mostRecent = completeLogs.sort((a, b) => new Date(b.clockOut || b.clockIn) - new Date(a.clockOut || a.clockIn))[0];
    return mostRecent;
  }

  return todayLogs[0];
});

export const weeklyHours = computed(() => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekLogs = timeLogs.value.filter(log => {
    const logDate = new Date(log.date);
    return log.userId === authCurrentUser.value?.id &&
           logDate >= weekStart &&
           log.totalHours;
  });

  return weekLogs.reduce((total, log) => total + (log.totalHours || 0), 0).toFixed(1);
});

export const monthlyHours = computed(() => {
  const monthStart = new Date();
  monthStart.setDate(1);

  const monthLogs = timeLogs.value.filter(log => {
    const logDate = new Date(log.date);
    return log.userId === authCurrentUser.value?.id &&
           logDate >= monthStart &&
           log.totalHours;
  });

  return monthLogs.reduce((total, log) => total + (log.totalHours || 0), 0).toFixed(1);
});

// Recent logs (last 7 days)
export const recentLogs = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return timeLogs.value
    .filter(log => {
      const logDate = new Date(log.date);
      return log.userId === authCurrentUser.value?.id && logDate >= sevenDaysAgo;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);
});
