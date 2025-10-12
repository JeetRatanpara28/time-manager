<template>
  <div class="tasks-list">
    <div class="list-header">
      <h2>📋 Working Times</h2>
      <select v-model="filterPeriod" class="filter-select">
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading working times...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadWorkingTimes" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="filteredTimes.length === 0" class="empty-state">
      <span class="empty-icon">📭</span>
      <p>No working times found</p>
      <p class="empty-hint">Clock in to start tracking your time</p>
    </div>

    <div v-else class="times-list">
      <!-- Group by user (for managers/GM) -->
      <div
        v-for="userGroup in groupedTimes"
        :key="userGroup.userId"
        class="user-group"
      >
        <div v-if="showUserHeaders" class="user-header">
          <img :src="userGroup.avatar" class="user-avatar" alt="Avatar" />
          <div class="user-info">
            <h3>{{ userGroup.userName }}</h3>
            <small>{{ userGroup.email }}</small>
          </div>
          <div class="user-stats">
            <strong>{{ userGroup.totalHours }}h</strong>
            <small>total</small>
          </div>
        </div>

        <!-- Time entries -->
        <div
          v-for="time in userGroup.times"
          :key="time.id"
          class="time-card"
          :class="{ active: !time.end && !time.clock_out }"
          @click="onTimeClick(time)"
        >
          <div class="time-header">
            <div class="time-date">
              <span class="date-icon">📅</span>
              <span>{{ formatDate(time.start || time.clock_in) }}</span>
            </div>
            <span v-if="!time.end && !time.clock_out" class="active-badge"
              >Active</span
            >
          </div>

          <div class="time-content">
            <div class="time-range">
              <div class="time-item">
                <span class="time-label">Start</span>
                <span class="time-value">{{
                  formatTime(time.start || time.clock_in)
                }}</span>
              </div>
              <span class="time-arrow">→</span>
              <div class="time-item">
                <span class="time-label">End</span>
                <span v-if="time.end || time.clock_out" class="time-value">
                  {{ formatTime(time.end || time.clock_out) }}
                </span>
                <span v-else class="time-value ongoing">Ongoing</span>
              </div>
            </div>

            <div class="time-duration">
              <span class="duration-label">Duration:</span>
              <span class="duration-value">{{ calculateDuration(time) }}</span>
            </div>
          </div>

          <div v-if="canEdit" class="time-actions">
            <button @click.stop="editTime(time)" class="btn-edit">
              ✏️ Edit
            </button>
            <button
              v-if="canDelete"
              @click.stop="deleteTime(time)"
              class="btn-delete"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import apiClient from "@/utils/api";
import db from "@/db/database";
import { user as currentUser } from "@/store/authStore";

const router = useRouter();
const emit = defineEmits(["time-selected"]);

const workingTimes = ref([]);
const users = ref([]);
const loading = ref(true);
const error = ref("");
const filterPeriod = ref("week");

// Role-based permissions
const userRole = computed(() => currentUser.value?.role || "employee");
const isManager = computed(() => ["manager", "gm"].includes(userRole.value));
const isGM = computed(() => userRole.value === "gm");
const canEdit = computed(() => isManager.value);
const canDelete = computed(() => isGM.value);
const showUserHeaders = computed(() => isManager.value);

// Filter times by period
const filteredTimes = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return workingTimes.value.filter((time) => {
    const timeDate = new Date(time.start || time.clock_in || time.date);

    switch (filterPeriod.value) {
      case "today":
        return timeDate >= today;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return timeDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return timeDate >= monthAgo;
      default:
        return true;
    }
  });
});

// Group times by user
const groupedTimes = computed(() => {
  const grouped = {};

  filteredTimes.value.forEach((time) => {
    const userId = time.user_id || time.userId || currentUser.value?.id;

    if (!grouped[userId]) {
      const user = users.value.find((u) => u.id === userId) ||
        currentUser.value || {
          id: userId,
          name: `User ${userId}`,
          email: "",
        };

      grouped[userId] = {
        userId,
        userName: user.name || user.username || user.email,
        email: user.email || "",
        avatar: getAvatarUrl(user.name || user.username || user.email),
        times: [],
        totalHours: 0,
      };
    }

    grouped[userId].times.push(time);

    // Calculate total hours
    const start = time.start || time.clock_in;
    const end = time.end || time.clock_out;
    if (start && end) {
      const hours = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
      grouped[userId].totalHours += hours;
    }
  });

  // Sort and format
  Object.values(grouped).forEach((group) => {
    group.times.sort((a, b) => {
      const dateA = new Date(a.start || a.clock_in || 0);
      const dateB = new Date(b.start || b.clock_in || 0);
      return dateB - dateA;
    });
    group.totalHours = Math.round(group.totalHours * 10) / 10;
  });

  return Object.values(grouped);
});

function getAvatarUrl(name) {
  const displayName = name || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=667eea&color=fff&size=128`;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

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

function calculateDuration(time) {
  const start = time.start || time.clock_in;
  const end = time.end || time.clock_out;

  if (!start) return "0h 0m";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate - startDate;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

function onTimeClick(time) {
  emit("time-selected", time);
  if (canEdit.value) {
    router.push(`/workingtime/${time.id}`);
  }
}

function editTime(time) {
  router.push(`/workingtime/${time.id}`);
}

async function deleteTime(time) {
  if (!confirm(`Delete this working time entry?`)) return;

  try {
    await apiClient.delete(`/workingtimes/${time.id}`);
    db.deleteWorkingTime(time.id);
    await loadWorkingTimes();
  } catch (err) {
    console.error("Delete failed:", err);
    error.value = "Failed to delete working time";
  }
}

async function loadWorkingTimes() {
  loading.value = true;
  error.value = "";

  try {
    // Load from local storage first
    workingTimes.value = db.getWorkingTimes();

    // Fetch from server if online
    if (navigator.onLine) {
      const params = {};
      if (!isManager.value) {
        params.user_id = currentUser.value?.id;
      }

      const response = await apiClient.get("/workingtimes", { params });
      const serverTimes = response.data?.data || response.data || [];

      db.upsertWorkingTimes(serverTimes);
      workingTimes.value = db.getWorkingTimes();

      // Load users if manager
      if (isManager.value) {
        const usersResponse = await apiClient.get("/users");
        const serverUsers =
          usersResponse.data?.data || usersResponse.data || [];
        db.saveUsers(serverUsers);
        users.value = serverUsers;
      } else {
        users.value = [currentUser.value];
      }
    } else {
      users.value = db.getUsers();
    }
  } catch (err) {
    console.error("Failed to load working times:", err);
    error.value = err.response?.data?.error || "Failed to load working times";

    // Fallback to local storage
    workingTimes.value = db.getWorkingTimes();
    users.value = db.getUsers();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWorkingTimes();
});

defineExpose({
  loadWorkingTimes,
});
</script>

<style scoped>
.tasks-list {
  padding: 1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #475569;
  cursor: pointer;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.empty-hint {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.times-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid white;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.user-info small {
  opacity: 0.9;
  font-size: 0.85rem;
}

.user-stats {
  text-align: right;
}

.user-stats strong {
  display: block;
  font-size: 1.2rem;
}

.user-stats small {
  opacity: 0.9;
  font-size: 0.75rem;
}

.time-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.time-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.time-card.active {
  border-left: 4px solid #10b981;
}

.time-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.time-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1e293b;
}

.date-icon {
  font-size: 1.1rem;
}

.active-badge {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.time-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.time-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.time-value.ongoing {
  color: #10b981;
}

.time-arrow {
  color: #cbd5e1;
  font-size: 1.5rem;
}

.time-duration {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-radius: 8px;
}

.duration-label {
  font-size: 0.85rem;
  color: #64748b;
}

.duration-value {
  font-weight: 700;
  color: #667eea;
  font-size: 1rem;
}

.time-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.btn-edit,
.btn-delete {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}
</style>
