<template>
  <div class="task-detail-page">
    <div class="detail-container">
      <div class="detail-header">
        <button @click="goBack" class="btn-back">← Back</button>
        <h1>Working Time Details</h1>
        <button
          v-if="canEdit && !isEditing"
          @click="startEdit"
          class="btn-edit"
        >
          ✏️ Edit
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadWorkingTime" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="workingTime" class="detail-content">
        <!-- View Mode -->
        <div v-if="!isEditing" class="view-mode">
          <div class="info-card">
            <div class="info-section">
              <h3>📅 Date</h3>
              <p class="info-value">
                {{ formatFullDate(workingTime.start || workingTime.clock_in) }}
              </p>
            </div>

            <div class="info-section">
              <h3>⏰ Time Range</h3>
              <div class="time-range-display">
                <div class="time-point">
                  <span class="time-label">Start</span>
                  <span class="time-value">{{
                    formatTime(workingTime.start || workingTime.clock_in)
                  }}</span>
                </div>
                <span class="time-separator">→</span>
                <div class="time-point">
                  <span class="time-label">End</span>
                  <span
                    v-if="workingTime.end || workingTime.clock_out"
                    class="time-value"
                  >
                    {{ formatTime(workingTime.end || workingTime.clock_out) }}
                  </span>
                  <span v-else class="time-value ongoing">Ongoing</span>
                </div>
              </div>
            </div>

            <div class="info-section">
              <h3>⏱ Duration</h3>
              <p class="info-value duration">{{ calculateDuration() }}</p>
            </div>

            <div v-if="workingTime.status" class="info-section">
              <h3>📊 Status</h3>
              <span class="status-badge" :class="workingTime.status">
                {{ workingTime.status }}
              </span>
            </div>

            <div v-if="userInfo" class="info-section">
              <h3>👤 User</h3>
              <div class="user-display">
                <img
                  :src="userInfo.avatar"
                  class="user-avatar-small"
                  alt="User"
                />
                <div>
                  <p class="user-name-small">{{ userInfo.name }}</p>
                  <p class="user-email-small">{{ userInfo.email }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="canDelete" class="danger-zone">
            <button @click="deleteWorkingTime" class="btn-delete-full">
              🗑️ Delete This Record
            </button>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="edit-mode">
          <form @submit.prevent="saveChanges" class="edit-form">
            <div class="form-group">
              <label for="start-date">Start Date</label>
              <input
                id="start-date"
                v-model="editForm.startDate"
                type="date"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="start-time">Start Time</label>
              <input
                id="start-time"
                v-model="editForm.startTime"
                type="time"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="end-date">End Date</label>
              <input
                id="end-date"
                v-model="editForm.endDate"
                type="date"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="end-time">End Time</label>
              <input
                id="end-time"
                v-model="editForm.endTime"
                type="time"
                class="form-input"
              />
            </div>

            <div v-if="editError" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ editError }}
            </div>

            <div class="form-actions">
              <button type="button" @click="cancelEdit" class="btn-cancel">
                Cancel
              </button>
              <button type="submit" class="btn-save" :disabled="saving">
                <span v-if="saving" class="loading-spinner-small"></span>
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import apiClient from "@/utils/api";
import db from "@/db/database";
import { user as currentUser } from "@/store/authStore";

const router = useRouter();
const route = useRoute();

const workingTime = ref(null);
const userInfo = ref(null);
const loading = ref(true);
const error = ref("");
const isEditing = ref(false);
const saving = ref(false);
const editError = ref("");

const editForm = ref({
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
});

const userRole = computed(() => currentUser.value?.role || "employee");
const isEmployee = computed(() => userRole.value === "employee");
const isManager = computed(() => userRole.value === "manager");
const isGM = computed(() => userRole.value === "gm");
const canEdit = computed(() => isManager.value || isGM.value); // Managers and GMs can edit
const canDelete = computed(() => isGM.value); // Only GMs can delete

function formatFullDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function calculateDuration() {
  if (!workingTime.value) return "0h 0m";

  const start = workingTime.value.start || workingTime.value.clock_in;
  const end = workingTime.value.end || workingTime.value.clock_out;

  if (!start) return "0h 0m";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = endDate - startDate;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

function startEdit() {
  if (!workingTime.value) return;

  const start = new Date(workingTime.value.start || workingTime.value.clock_in);
  const end =
    workingTime.value.end || workingTime.value.clock_out
      ? new Date(workingTime.value.end || workingTime.value.clock_out)
      : null;

  editForm.value = {
    startDate: start.toISOString().split("T")[0],
    startTime: start.toTimeString().slice(0, 5),
    endDate: end ? end.toISOString().split("T")[0] : "",
    endTime: end ? end.toTimeString().slice(0, 5) : "",
  };

  isEditing.value = true;
  editError.value = "";
}

function cancelEdit() {
  isEditing.value = false;
  editError.value = "";
}

async function saveChanges() {
  editError.value = "";
  saving.value = true;

  try {
    // Combine date and time
    const startDateTime = new Date(
      `${editForm.value.startDate}T${editForm.value.startTime}`
    );
    let endDateTime = null;

    if (editForm.value.endDate && editForm.value.endTime) {
      endDateTime = new Date(
        `${editForm.value.endDate}T${editForm.value.endTime}`
      );

      // Validate end is after start
      if (endDateTime <= startDateTime) {
        editError.value = "End time must be after start time";
        saving.value = false;
        return;
      }
    }

    const updateData = {
      working_time: {
        start: startDateTime.toISOString(),
        clock_in: startDateTime.toISOString(),
        end: endDateTime ? endDateTime.toISOString() : null,
        clock_out: endDateTime ? endDateTime.toISOString() : null,
        status: endDateTime ? "complete" : "active",
      },
    };

    console.log("💾 Saving changes:", updateData);

    const response = await apiClient.put(
      `/workingtimes/${workingTime.value.id}`,
      updateData
    );

    const updated = response.data?.data || response.data;
    db.upsertWorkingTime(updated);
    workingTime.value = updated;

    isEditing.value = false;
    console.log("✅ Changes saved");
  } catch (err) {
    console.error("❌ Save failed:", err);
    editError.value = err.response?.data?.error || "Failed to save changes";
  } finally {
    saving.value = false;
  }
}

async function deleteWorkingTime() {
  if (!canDelete.value) {
    alert("Only GMs can delete working time records");
    return;
  }

  const confirmed = confirm(
    "Are you sure you want to delete this working time record?\n\nThis action cannot be undone."
  );

  if (!confirmed) return;

  try {
    await apiClient.delete(`/workingtimes/${workingTime.value.id}`);
    db.deleteWorkingTime(workingTime.value.id);

    alert("Working time deleted successfully");
    goBack();
  } catch (err) {
    console.error("Delete failed:", err);
    error.value = err.response?.data?.error || "Failed to delete working time";
  }
}

async function loadWorkingTime() {
  loading.value = true;
  error.value = "";

  try {
    const id = route.params.id;
    if (!id) {
      error.value = "No working time ID provided";
      loading.value = false;
      return;
    }

    // Try local storage first
    const localTime = db.getWorkingTimeById(id);
    if (localTime) {
      workingTime.value = localTime;
      await loadUserInfo(localTime.user_id || localTime.userId);
    }

    // Fetch from server if online
    if (navigator.onLine) {
      const response = await apiClient.get(`/workingtimes/${id}`);
      const serverTime = response.data?.data || response.data;

      db.upsertWorkingTime(serverTime);
      workingTime.value = serverTime;
      await loadUserInfo(serverTime.user_id || serverTime.userId);
    }
  } catch (err) {
    console.error("Failed to load working time:", err);
    error.value = err.response?.data?.error || "Failed to load working time";
  } finally {
    loading.value = false;
  }
}

async function loadUserInfo(userId) {
  if (!userId) return;

  try {
    // Check local storage
    const localUser = db.getUserById(userId);
    if (localUser) {
      userInfo.value = {
        ...localUser,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          localUser.name || localUser.username || localUser.email
        )}&background=667eea&color=fff&size=128`,
      };
    }

    // Fetch from server if online
    if (navigator.onLine) {
      const response = await apiClient.get(`/users/${userId}`);
      const user = response.data?.data || response.data;

      db.upsertUser(user);
      userInfo.value = {
        ...user,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name || user.username || user.email
        )}&background=667eea&color=fff&size=128`,
      };
    }
  } catch (err) {
    console.error("Failed to load user info:", err);
  }
}

function goBack() {
  router.back();
}

onMounted(() => {
  loadWorkingTime();
});
</script>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  padding-bottom: 100px;
}

.detail-container {
  max-width: 600px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  color: white;
}

.detail-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-edit {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.loading-state,
.error-state {
  background: white;
  border-radius: 16px;
  padding: 3rem;
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
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.info-value.duration {
  color: #667eea;
  font-size: 1.5rem;
}

.time-range-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 12px;
}

.time-point {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.time-value.ongoing {
  color: #10b981;
}

.time-separator {
  font-size: 1.5rem;
  color: #cbd5e1;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.complete {
  background: #dbeafe;
  color: #1e40af;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.user-avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
}

.user-name-small {
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.user-email-small {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.danger-zone {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #fee2e2;
}

.btn-delete-full {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.edit-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 768px) {
  .detail-header {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .detail-header h1 {
    width: 100%;
    order: -1;
  }

  .time-range-display {
    flex-direction: column;
    gap: 0.75rem;
  }

  .time-separator {
    transform: rotate(90deg);
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
