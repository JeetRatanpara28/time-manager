<template>
  <div class="clock-control">
    <div class="clock-status" :class="{ 'is-active': isClockedIn }">
      <div class="status-indicator">
        <div class="status-dot" :class="{ active: isClockedIn }"></div>
        <div class="status-info">
          <div class="status-label">
            {{ isClockedIn ? "Clocked In" : "Clocked Out" }}
          </div>
          <div v-if="isClockedIn && currentSession" class="session-info">
            Started at
            {{ formatTime(currentSession.start || currentSession.clock_in) }}
          </div>
        </div>
      </div>

      <div v-if="isClockedIn" class="timer-display">
        <div class="timer">{{ elapsedTime }}</div>
        <div class="timer-label">Elapsed Time</div>
      </div>
    </div>

    <button
      class="clock-button"
      :class="{ 'clock-out': isClockedIn }"
      @click="toggleClock"
      :disabled="loading"
    >
      <span v-if="loading" class="loading-spinner"></span>
      <span v-else class="button-content">
        <span class="button-icon">{{ isClockedIn ? "⏹" : "▶" }}</span>
        <span class="button-text">{{
          isClockedIn ? "Clock Out" : "Clock In"
        }}</span>
      </span>
    </button>

    <div v-if="error" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>{{ error }}</span>
    </div>

    <div v-if="successMessage" class="success-message">
      <span class="success-icon">✅</span>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Today's Summary -->
    <div v-if="todaySummary" class="today-summary">
      <h3>📊 Today's Summary</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">{{ todaySummary.sessions }}</div>
          <div class="summary-label">Sessions</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ todaySummary.totalHours }}</div>
          <div class="summary-label">Total Hours</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ todaySummary.avgSession }}</div>
          <div class="summary-label">Avg Session</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import apiClient from "@/utils/api";
import db from "@/db/database";
import { user as currentUser } from "@/store/authStore";

const emit = defineEmits(["clock-changed"]);

const isClockedIn = ref(false);
const currentSession = ref(null);
const loading = ref(false);
const error = ref("");
const successMessage = ref("");
const currentTime = ref(new Date());
const workingTimes = ref([]);

let timerInterval = null;

// This component is only for employees
const userRole = computed(() => currentUser.value?.role || "employee");

const elapsedTime = computed(() => {
  if (!currentSession.value) return "00:00:00";

  const start = new Date(
    currentSession.value.start || currentSession.value.clock_in
  );
  const diff = currentTime.value - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
});

const todaySummary = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTimes = workingTimes.value.filter((wt) => {
    const wtDate = new Date(wt.start || wt.clock_in || wt.date);
    wtDate.setHours(0, 0, 0, 0);
    return wtDate.getTime() === today.getTime();
  });

  if (todayTimes.length === 0) {
    return null;
  }

  let totalMinutes = 0;
  todayTimes.forEach((wt) => {
    const start = wt.start || wt.clock_in;
    const end = wt.end || wt.clock_out;

    if (start) {
      const startTime = new Date(start);
      const endTime = end ? new Date(end) : new Date();
      const diff = endTime - startTime;
      totalMinutes += diff / (1000 * 60);
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  const avgMinutes = Math.round(totalMinutes / todayTimes.length);
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;

  return {
    sessions: todayTimes.length,
    totalHours: `${hours}h ${minutes}m`,
    avgSession: `${avgHours}h ${avgMins}m`,
  };
});

function formatTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

async function toggleClock() {
  if (isClockedIn.value) {
    await clockOut();
  } else {
    await clockIn();
  }
}

async function clockIn() {
  loading.value = true;
  error.value = "";
  successMessage.value = "";

  try {
    const userId = currentUser.value?.id;
    if (!userId) {
      throw new Error("User not found");
    }

    const clockInData = {
      working_time: {
        user_id: userId,
        start: new Date().toISOString(),
        clock_in: new Date().toISOString(),
        end: null,
        clock_out: null,
        status: "active",
        date: new Date().toISOString().split("T")[0],
      },
    };

    console.log("⏱ Clocking in...", clockInData);

    if (navigator.onLine) {
      const response = await apiClient.post("/workingtimes", clockInData);
      const sessionData = response.data?.data || response.data;

      db.upsertWorkingTime(sessionData);
      currentSession.value = sessionData;
      isClockedIn.value = true;

      console.log("✅ Clocked in:", sessionData);
    } else {
      // Offline mode
      const entry = db.clockIn(userId);
      currentSession.value = entry;
      isClockedIn.value = true;
      await db.queueOperation("clock_in", entry);

      console.log("📴 Clocked in offline:", entry);
    }

    successMessage.value = "Successfully clocked in!";
    await loadWorkingTimes();
    emit("clock-changed", { type: "clock_in", session: currentSession.value });

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (err) {
    console.error("❌ Clock in failed:", err);
    error.value =
      err.response?.data?.error || err.message || "Failed to clock in";

    setTimeout(() => {
      error.value = "";
    }, 5000);
  } finally {
    loading.value = false;
  }
}

async function clockOut() {
  loading.value = true;
  error.value = "";
  successMessage.value = "";

  try {
    if (!currentSession.value) {
      throw new Error("No active session");
    }

    const clockOutData = {
      working_time: {
        end: new Date().toISOString(),
        clock_out: new Date().toISOString(),
        status: "complete",
      },
    };

    console.log("⏱ Clocking out...", clockOutData);

    if (navigator.onLine) {
      const response = await apiClient.put(
        `/workingtimes/${currentSession.value.id}`,
        clockOutData
      );
      const sessionData = response.data?.data || response.data;

      db.upsertWorkingTime(sessionData);

      console.log("✅ Clocked out:", sessionData);
    } else {
      // Offline mode
      db.clockOut(currentSession.value.id);
      await db.queueOperation("clock_out", {
        id: currentSession.value.id,
        ...clockOutData.working_time,
      });

      console.log("📴 Clocked out offline");
    }

    const completedSession = currentSession.value;
    currentSession.value = null;
    isClockedIn.value = false;

    successMessage.value = "Successfully clocked out!";
    await loadWorkingTimes();
    emit("clock-changed", { type: "clock_out", session: completedSession });

    setTimeout(() => {
      successMessage.value = "";
    }, 3000);
  } catch (err) {
    console.error("❌ Clock out failed:", err);
    error.value =
      err.response?.data?.error || err.message || "Failed to clock out";

    setTimeout(() => {
      error.value = "";
    }, 5000);
  } finally {
    loading.value = false;
  }
}

async function checkCurrentSession() {
  try {
    const userId = currentUser.value?.id;
    if (!userId) return;

    // Check local database first
    const activeSession = db.getCurrentClockIn(userId);

    if (activeSession) {
      currentSession.value = activeSession;
      isClockedIn.value = true;
      console.log("🟢 Found active session:", activeSession);
      return;
    }

    // Check server if online
    if (navigator.onLine) {
      const response = await apiClient.get("/workingtimes", {
        params: { user_id: userId },
      });

      const times = response.data?.data || response.data || [];
      const active = times.find((wt) => !wt.end && !wt.clock_out);

      if (active) {
        currentSession.value = active;
        isClockedIn.value = true;
        db.upsertWorkingTime(active);
        console.log("🟢 Found active session from server:", active);
      }
    }
  } catch (err) {
    console.error("Failed to check current session:", err);
  }
}

async function loadWorkingTimes() {
  try {
    const userId = currentUser.value?.id;
    if (!userId) return;

    // Load from local storage
    workingTimes.value = db
      .getWorkingTimes()
      .filter((wt) => wt.user_id === userId || wt.userId === userId);

    // Sync with server if online
    if (navigator.onLine) {
      const response = await apiClient.get("/workingtimes", {
        params: { user_id: userId },
      });

      const serverTimes = response.data?.data || response.data || [];
      db.upsertWorkingTimes(serverTimes);
      workingTimes.value = db
        .getWorkingTimes()
        .filter((wt) => wt.user_id === userId || wt.userId === userId);
    }
  } catch (err) {
    console.error("Failed to load working times:", err);
  }
}

onMounted(async () => {
  await checkCurrentSession();
  await loadWorkingTimes();

  // Start timer for elapsed time
  timerInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

defineExpose({
  clockIn,
  clockOut,
  checkCurrentSession,
  loadWorkingTimes,
});
</script>

<style scoped>
.clock-control {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.clock-status {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #fee2e2;
  transition: all 0.3s ease;
}

.clock-status.is-active {
  border-color: #d1fae5;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
  animation: pulse-red 2s ease-in-out infinite;
}

.status-dot.active {
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  animation: pulse-green 2s ease-in-out infinite;
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.1);
  }
}

@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
  }
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.session-info {
  font-size: 0.9rem;
  color: #64748b;
}

.timer-display {
  text-align: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 2px solid #10b981;
}

.timer {
  font-size: 3rem;
  font-weight: 700;
  color: #10b981;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}

.timer-label {
  font-size: 0.85rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}

.clock-button {
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.clock-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.clock-button:active:not(:disabled) {
  transform: translateY(0);
}

.clock-button.clock-out {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.clock-button.clock-out:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.clock-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.button-icon {
  font-size: 1.5rem;
}

.button-text {
  font-size: 1.25rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message,
.success-message {
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.error-icon,
.success-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.today-summary {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.today-summary h3 {
  margin: 0 0 1.25rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 768px) {
  .timer {
    font-size: 2.5rem;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .summary-item {
    padding: 0.75rem;
  }

  .summary-value {
    font-size: 1.25rem;
  }
}
</style>
