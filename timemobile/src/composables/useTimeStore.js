// src/composables/useTimeStore.js
import { ref, computed } from "vue";
import * as api from "@/utils/api";
import { user as currentUser } from "@/store/authStore";

// State
export const users = ref([]);
export const timeLogs = ref([]);
export const isLoading = ref(false);
export const error = ref(null);

/**
 * Initialize time data
 */
export async function initializeTimeData() {
  isLoading.value = true;
  error.value = null;

  try {
    // Fetch users
    const usersResponse = await api.get("/users");
    if (usersResponse.data?.data) {
      users.value = usersResponse.data.data;
    }

    // Fetch working times
    const workingTimesResponse = await api.get("/working_times");
    if (workingTimesResponse.data?.data) {
      timeLogs.value = transformWorkingTimes(workingTimesResponse.data.data);
    }

    console.log("✅ Time data initialized");
  } catch (err) {
    console.error("Failed to initialize time data:", err);
    error.value = err.message;

    // Set demo data for development
    setDemoData();
  } finally {
    isLoading.value = false;
  }
}

/**
 * Transform backend working times to frontend format
 */
function transformWorkingTimes(workingTimes) {
  return workingTimes.map((wt) => {
    const startTime = wt.start_time ? new Date(wt.start_time) : null;
    const endTime = wt.end_time ? new Date(wt.end_time) : null;

    return {
      id: wt.id,
      userId: wt.user_id,
      date:
        wt.date ||
        (startTime
          ? startTime.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]),
      clockIn: startTime
        ? startTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      clockOut: endTime
        ? endTime.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      breakStart: wt.break_start
        ? new Date(wt.break_start).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      breakEnd: wt.break_end
        ? new Date(wt.break_end).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      status: endTime ? "complete" : "active",
      totalHours: calculateTotalHours(startTime, endTime),
      workingTimeId: wt.id,
    };
  });
}

/**
 * Calculate total hours between two dates
 */
function calculateTotalHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const diffMs = new Date(endTime) - new Date(startTime);
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
}

/**
 * Set demo data for development/testing
 */
function setDemoData() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Demo users
  users.value = [
    {
      id: 1,
      name: "John Doe",
      email: "john@company.com",
      role: "employee",
      department: "Engineering",
      status: "online",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@company.com",
      role: "employee",
      department: "Design",
      status: "online",
    },
    {
      id: 3,
      name: "Bob Manager",
      email: "bob@company.com",
      role: "manager",
      department: "Management",
      status: "online",
    },
  ];

  // Demo time logs
  timeLogs.value = [
    {
      id: 1,
      userId: 1,
      date: today.toISOString().split("T")[0],
      clockIn: "09:00",
      clockOut: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00",
      status: "complete",
      totalHours: 7.0,
    },
    {
      id: 2,
      userId: 2,
      date: today.toISOString().split("T")[0],
      clockIn: "08:30",
      clockOut: "16:30",
      breakStart: "12:00",
      breakEnd: "12:30",
      status: "complete",
      totalHours: 7.5,
    },
    {
      id: 3,
      userId: 1,
      date: yesterday.toISOString().split("T")[0],
      clockIn: "09:15",
      clockOut: "17:15",
      breakStart: "12:30",
      breakEnd: "13:30",
      status: "complete",
      totalHours: 7.0,
    },
  ];

  console.log("⚠️ Using demo data for time store");
}

/**
 * Clock in
 */
export async function clockIn() {
  if (!currentUser.value) {
    throw new Error("No user logged in");
  }

  isLoading.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const response = await api.post("/working_times", {
      working_time: {
        user_id: currentUser.value.id,
        start_time: now,
        date: today,
      },
    });

    if (response.data?.data) {
      const newLog = transformWorkingTimes([response.data.data])[0];
      timeLogs.value.push(newLog);
    }

    await refreshWorkingTimes();
    return response.data;
  } catch (err) {
    console.error("Clock in failed:", err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Clock out
 */
export async function clockOut() {
  if (!currentUser.value) {
    throw new Error("No user logged in");
  }

  isLoading.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const activeLog = timeLogs.value.find(
      (log) =>
        log.userId === currentUser.value.id &&
        log.date === today &&
        log.status === "active"
    );

    if (!activeLog) {
      throw new Error("No active clock-in session found");
    }

    const now = new Date().toISOString();
    const response = await api.put(
      `/working_times/${activeLog.workingTimeId}`,
      {
        working_time: {
          end_time: now,
        },
      }
    );

    await refreshWorkingTimes();
    return response.data;
  } catch (err) {
    console.error("Clock out failed:", err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Start break
 */
export async function startBreak() {
  if (!currentUser.value) {
    throw new Error("No user logged in");
  }

  isLoading.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const activeLog = timeLogs.value.find(
      (log) =>
        log.userId === currentUser.value.id &&
        log.date === today &&
        log.status === "active" &&
        !log.breakStart
    );

    if (!activeLog) {
      throw new Error("No active session or break already started");
    }

    const now = new Date().toISOString();
    const response = await api.put(
      `/working_times/${activeLog.workingTimeId}`,
      {
        working_time: {
          break_start: now,
        },
      }
    );

    await refreshWorkingTimes();
    return response.data;
  } catch (err) {
    console.error("Start break failed:", err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

/**
 * End break
 */
export async function endBreak() {
  if (!currentUser.value) {
    throw new Error("No user logged in");
  }

  isLoading.value = true;
  try {
    const today = new Date().toISOString().split("T")[0];
    const activeLog = timeLogs.value.find(
      (log) =>
        log.userId === currentUser.value.id &&
        log.date === today &&
        log.status === "active" &&
        log.breakStart &&
        !log.breakEnd
    );

    if (!activeLog) {
      throw new Error("No active break found");
    }

    const now = new Date().toISOString();
    const response = await api.put(
      `/working_times/${activeLog.workingTimeId}`,
      {
        working_time: {
          break_end: now,
        },
      }
    );

    await refreshWorkingTimes();
    return response.data;
  } catch (err) {
    console.error("End break failed:", err);
    throw err;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Refresh working times from API
 */
export async function refreshWorkingTimes() {
  try {
    const response = await api.get("/working_times");
    if (response.data?.data) {
      timeLogs.value = transformWorkingTimes(response.data.data);
    }
  } catch (err) {
    console.error("Failed to refresh working times:", err);
  }
}

/**
 * Get working times for a specific user
 */
export async function getUserWorkingTimes(userId) {
  try {
    const response = await api.get(`/working_times/${userId}`);
    if (response.data?.data) {
      return transformWorkingTimes(response.data.data);
    }
    return [];
  } catch (err) {
    console.error("Failed to get user working times:", err);
    return [];
  }
}

// Computed properties
export const todaysLog = computed(() => {
  if (!currentUser.value) return null;

  const today = new Date().toISOString().split("T")[0];
  return timeLogs.value.find(
    (log) => log.userId === currentUser.value.id && log.date === today
  );
});

export const weeklyHours = computed(() => {
  if (!currentUser.value) return 0;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const logs = timeLogs.value.filter(
    (log) =>
      log.userId === currentUser.value.id && new Date(log.date) >= weekStart
  );

  return logs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(1);
});

export const monthlyHours = computed(() => {
  if (!currentUser.value) return 0;

  const monthStart = new Date();
  monthStart.setDate(1);

  const logs = timeLogs.value.filter(
    (log) =>
      log.userId === currentUser.value.id && new Date(log.date) >= monthStart
  );

  return logs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(1);
});

export const recentLogs = computed(() => {
  if (!currentUser.value) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return timeLogs.value
    .filter(
      (log) =>
        log.userId === currentUser.value.id &&
        new Date(log.date) >= sevenDaysAgo
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);
});

console.log("✅ Time store initialized");
