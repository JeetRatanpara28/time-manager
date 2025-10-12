// src/db/database.js
// Simple localStorage-based database for mobile app
const DB_PREFIX = "timemanager_";

/**
 * Get working times
 */
export const getWorkingTimes = () => {
  try {
    const key = `${DB_PREFIX}workingtimes`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting working times:", error);
    return [];
  }
};

/**
 * Save working times
 */
export const saveWorkingTimes = (workingTimes) => {
  try {
    const key = `${DB_PREFIX}workingtimes`;
    localStorage.setItem(key, JSON.stringify(workingTimes));
  } catch (error) {
    console.error("Error saving working times:", error);
  }
};

/**
 * Get a single working time by ID
 */
export const getWorkingTimeById = (id) => {
  try {
    const times = getWorkingTimes();
    return times.find((t) => t.id === id) || null;
  } catch (error) {
    console.error("Error getting working time:", error);
    return null;
  }
};

/**
 * Upsert working time (update or insert)
 */
export const upsertWorkingTime = (workingTime) => {
  try {
    const times = getWorkingTimes();
    const index = times.findIndex((t) => t.id === workingTime.id);

    if (index !== -1) {
      times[index] = { ...times[index], ...workingTime };
    } else {
      times.push(workingTime);
    }

    saveWorkingTimes(times);
    return workingTime;
  } catch (error) {
    console.error("Error upserting working time:", error);
    return null;
  }
};

/**
 * Upsert multiple working times (from server sync)
 */
export const upsertWorkingTimes = (timesArray) => {
  try {
    const existing = getWorkingTimes();
    const timesMap = new Map(existing.map((t) => [t.id, t]));

    timesArray.forEach((time) => {
      timesMap.set(time.id, { ...timesMap.get(time.id), ...time });
    });

    const updated = Array.from(timesMap.values());
    saveWorkingTimes(updated);
  } catch (error) {
    console.error("Error upserting working times:", error);
  }
};

/**
 * Delete working time
 */
export const deleteWorkingTime = (id) => {
  try {
    const times = getWorkingTimes();
    const filtered = times.filter((t) => t.id !== id);
    saveWorkingTimes(filtered);
  } catch (error) {
    console.error("Error deleting working time:", error);
  }
};

/**
 * Clock in - create new working time entry
 */
export const clockIn = (userId) => {
  try {
    const newEntry = {
      id: `temp_${Date.now()}`,
      userId,
      start: new Date().toISOString(),
      end: null,
      synced: false,
    };
    upsertWorkingTime(newEntry);
    return newEntry;
  } catch (error) {
    console.error("Error clocking in:", error);
    return null;
  }
};

/**
 * Clock out - update current working time entry
 */
export const clockOut = (workingTimeId) => {
  try {
    const entry = getWorkingTimeById(workingTimeId);
    if (entry) {
      entry.end = new Date().toISOString();
      entry.synced = false;
      upsertWorkingTime(entry);
      return entry;
    }
    return null;
  } catch (error) {
    console.error("Error clocking out:", error);
    return null;
  }
};

/**
 * Get current active clock-in (no end time)
 */
export const getCurrentClockIn = (userId) => {
  try {
    const times = getWorkingTimes();
    return times.find((t) => t.userId === userId && !t.end) || null;
  } catch (error) {
    console.error("Error getting current clock-in:", error);
    return null;
  }
};

/**
 * Get statistics for charts
 */
export const getStatistics = (userId, startDate, endDate) => {
  try {
    const times = getWorkingTimes();
    const userTimes = times.filter((t) => {
      if (t.userId !== userId) return false;
      if (!t.start) return false;

      const entryDate = new Date(t.start);
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();

      return entryDate >= start && entryDate <= end;
    });

    // Calculate hours per day
    const hoursPerDay = {};
    userTimes.forEach((t) => {
      if (t.start && t.end) {
        const date = new Date(t.start).toISOString().split("T")[0];
        const hours = (new Date(t.end) - new Date(t.start)) / (1000 * 60 * 60);
        hoursPerDay[date] = (hoursPerDay[date] || 0) + hours;
      }
    });

    // Calculate total hours
    const totalHours = Object.values(hoursPerDay).reduce(
      (sum, h) => sum + h,
      0
    );

    return {
      hoursPerDay,
      totalHours,
      averageHoursPerDay: totalHours / Object.keys(hoursPerDay).length || 0,
      daysWorked: Object.keys(hoursPerDay).length,
    };
  } catch (error) {
    console.error("Error calculating statistics:", error);
    return {
      hoursPerDay: {},
      totalHours: 0,
      averageHoursPerDay: 0,
      daysWorked: 0,
    };
  }
};

/**
 * Get all users
 */
export const getUsers = () => {
  try {
    const key = `${DB_PREFIX}users`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

/**
 * Save all users
 */
export const saveUsers = (users) => {
  try {
    const key = `${DB_PREFIX}users`;
    localStorage.setItem(key, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users:", error);
  }
};

/**
 * Get user by ID
 */
export const getUserById = (userId) => {
  try {
    const users = getUsers();
    return users.find((u) => u.id === userId) || null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

/**
 * Upsert user
 */
export const upsertUser = (user) => {
  try {
    const users = getUsers();
    const index = users.findIndex((u) => u.id === user.id);

    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }

    saveUsers(users);
    return user;
  } catch (error) {
    console.error("Error upserting user:", error);
    return null;
  }
};

/**
 * Delete user
 */
export const deleteUser = (userId) => {
  try {
    const users = getUsers();
    const filtered = users.filter((u) => u.id !== userId);
    saveUsers(filtered);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};

/**
 * Get team members for a user (manager)
 */
export const getTeamMembers = async (userId) => {
  try {
    const key = `${DB_PREFIX}team_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting team members:", error);
    return [];
  }
};

/**
 * Save team members for a user (manager)
 */
export const saveTeamMembers = async (userId, members) => {
  try {
    const key = `${DB_PREFIX}team_${userId}`;
    localStorage.setItem(key, JSON.stringify(members));
  } catch (error) {
    console.error("Error saving team members:", error);
  }
};

/**
 * Queue operation for offline sync
 */
export const queueOperation = async (operationType, data) => {
  try {
    const key = `${DB_PREFIX}pending_operations`;
    const existing = localStorage.getItem(key);
    const operations = existing ? JSON.parse(existing) : [];
    operations.push({
      id: Date.now(),
      type: operationType,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(operations));
  } catch (error) {
    console.error("Error queueing operation:", error);
  }
};

/**
 * Get pending operations
 */
export const getPendingOperations = async () => {
  try {
    const key = `${DB_PREFIX}pending_operations`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting pending operations:", error);
    return [];
  }
};

/**
 * Clear pending operations
 */
export const clearPendingOperations = async () => {
  try {
    const key = `${DB_PREFIX}pending_operations`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing pending operations:", error);
  }
};

/**
 * Get user data
 */
export const getUserData = async (userId) => {
  try {
    const key = `${DB_PREFIX}user_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

/**
 * Save user data
 */
export const saveUserData = async (userId, userData) => {
  try {
    const key = `${DB_PREFIX}user_${userId}`;
    localStorage.setItem(key, JSON.stringify(userData));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

// Export as default object
export default {
  getWorkingTimes,
  saveWorkingTimes,
  getWorkingTimeById,
  upsertWorkingTime,
  upsertWorkingTimes,
  deleteWorkingTime,
  clockIn,
  clockOut,
  getCurrentClockIn,
  getStatistics,
  getUsers,
  saveUsers,
  getUserById,
  upsertUser,
  deleteUser,
  getTeamMembers,
  saveTeamMembers,
  queueOperation,
  getPendingOperations,
  clearPendingOperations,
  getUserData,
  saveUserData,
};
