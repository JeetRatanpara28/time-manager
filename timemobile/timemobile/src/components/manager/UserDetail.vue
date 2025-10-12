<template>
  <div class="user-detail-page">
    <div class="detail-container">
      <div class="detail-header">
        <button @click="goBack" class="btn-back">← Back</button>
        <h1>User Details</h1>
        <button
          v-if="!isEditing && canEdit"
          @click="startEdit"
          class="btn-edit"
        >
          ✏️ Edit
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading user...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadUser" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="user" class="detail-content">
        <!-- View Mode -->
        <div v-if="!isEditing" class="view-mode">
          <div class="user-card">
            <div class="user-header-section">
              <img
                :src="userAvatar"
                :alt="user.name"
                class="user-avatar-large"
              />
              <div class="user-basic-info">
                <h2>{{ user.name || user.username }}</h2>
                <p class="user-email">{{ user.email }}</p>
                <span class="role-badge" :class="user.role">
                  {{ getRoleLabel(user.role) }}
                </span>
              </div>
            </div>

            <div class="info-sections">
              <div class="info-section">
                <h3>📧 Contact Information</h3>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{ user.email }}</span>
                </div>
              </div>

              <div class="info-section">
                <h3>💼 Work Information</h3>
                <div class="info-row">
                  <span class="info-label">Role:</span>
                  <span class="info-value">{{ getRoleLabel(user.role) }}</span>
                </div>
                <div v-if="user.department" class="info-row">
                  <span class="info-label">Department:</span>
                  <span class="info-value">{{ user.department }}</span>
                </div>
              </div>

              <div class="info-section">
                <h3>📊 Account Status</h3>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span
                    class="status-indicator"
                    :class="user.status || 'offline'"
                  >
                    {{ user.status || "offline" }}
                  </span>
                </div>
                <div v-if="user.inserted_at" class="info-row">
                  <span class="info-label">Member Since:</span>
                  <span class="info-value">{{
                    formatDate(user.inserted_at)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="canDelete && user.id !== currentUser?.id"
            class="danger-zone"
          >
            <h3>⚠️ Danger Zone</h3>
            <p class="danger-warning">
              Deleting this user will also delete all their working time
              records. This action cannot be undone.
            </p>
            <button @click="deleteUser" class="btn-delete-full">
              🗑️ Delete User
            </button>
          </div>
        </div>

        <!-- Edit Mode -->
        <div v-else class="edit-mode">
          <form @submit.prevent="saveChanges" class="edit-form">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input
                id="name"
                v-model="editForm.name"
                type="text"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                v-model="editForm.email"
                type="email"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="role">Role</label>
              <select
                id="role"
                v-model="editForm.role"
                required
                class="form-input"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="gm">General Manager</option>
              </select>
            </div>

            <div class="form-group">
              <label for="department">Department</label>
              <input
                id="department"
                v-model="editForm.department"
                type="text"
                class="form-input"
                placeholder="e.g., Engineering, Sales, HR"
              />
            </div>

            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" v-model="editForm.status" class="form-input">
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
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

const user = ref(null);
const loading = ref(true);
const error = ref("");
const isEditing = ref(false);
const saving = ref(false);
const editError = ref("");

const editForm = ref({
  name: "",
  email: "",
  role: "",
  department: "",
  status: "offline",
});

const userRole = computed(() => currentUser.value?.role || "employee");
const isGM = computed(() => userRole.value === "gm");
const canEdit = computed(() => isGM.value);
const canDelete = computed(() => isGM.value);

const userAvatar = computed(() => {
  if (!user.value) return "";
  const name =
    user.value.name || user.value.username || user.value.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=667eea&color=fff&size=256`;
});

function getRoleLabel(role) {
  const labels = {
    employee: "Employee",
    manager: "Manager",
    gm: "General Manager",
    general_manager: "General Manager",
  };
  return labels[role] || role;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function startEdit() {
  if (!canEdit.value) {
    alert("Only GMs can edit users");
    return;
  }

  editForm.value = {
    name: user.value.name || user.value.username || "",
    email: user.value.email || "",
    role: user.value.role || "employee",
    department: user.value.department || "",
    status: user.value.status || "offline",
  };

  isEditing.value = true;
  editError.value = "";
}

function cancelEdit() {
  isEditing.value = false;
  editError.value = "";
}

async function saveChanges() {
  if (!canEdit.value) {
    editError.value = "Only GMs can edit users";
    return;
  }

  editError.value = "";
  saving.value = true;

  try {
    const updateData = {
      user: {
        name: editForm.value.name,
        email: editForm.value.email,
        role: editForm.value.role,
        department: editForm.value.department || null,
        status: editForm.value.status,
      },
    };

    console.log("💾 Saving user changes:", updateData);

    const response = await apiClient.put(`/users/${user.value.id}`, updateData);

    const updated = response.data?.data || response.data;
    db.upsertUser(updated);
    user.value = updated;

    isEditing.value = false;
    console.log("✅ User updated successfully");
  } catch (err) {
    console.error("❌ Save failed:", err);
    editError.value = err.response?.data?.error || "Failed to save changes";
  } finally {
    saving.value = false;
  }
}

async function deleteUser() {
  if (!canDelete.value) {
    alert("Only GMs can delete users");
    return;
  }

  if (user.value.id === currentUser.value?.id) {
    alert("You cannot delete yourself");
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete ${
      user.value.name || user.value.email
    }?\n\nThis will delete:\n- The user account\n- All their working time records\n\nThis action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await apiClient.delete(`/users/${user.value.id}`);
    db.deleteUser(user.value.id);

    alert("User deleted successfully");
    router.push("/manager/users");
  } catch (err) {
    console.error("Delete failed:", err);
    error.value = err.response?.data?.error || "Failed to delete user";
  }
}

async function loadUser() {
  loading.value = true;
  error.value = "";

  try {
    const id = route.params.id;
    if (!id) {
      error.value = "No user ID provided";
      loading.value = false;
      return;
    }

    // Try local storage first
    const localUser = db.getUserById(id);
    if (localUser) {
      user.value = localUser;
    }

    // Fetch from server if online
    if (navigator.onLine) {
      const response = await apiClient.get(`/users/${id}`);
      const serverUser = response.data?.data || response.data;

      db.upsertUser(serverUser);
      user.value = serverUser;
    }

    if (!user.value) {
      error.value = "User not found";
    }
  } catch (err) {
    console.error("Failed to load user:", err);
    error.value = err.response?.data?.error || "Failed to load user";
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push("/manager/users");
}

onMounted(() => {
  if (!canEdit.value) {
    alert("Only GMs can access user details");
    router.push("/manager/users");
    return;
  }
  loadUser();
});
</script>

<style scoped>
.user-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  padding-bottom: 100px;
}

.detail-container {
  max-width: 700px;
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

.user-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-header-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #f1f5f9;
}

.user-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-basic-info h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.user-email {
  color: #64748b;
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
}

.role-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.employee {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.manager {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.gm,
.role-badge.general_manager {
  background: #fce7f3;
  color: #9f1239;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.info-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: #1e293b;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-indicator.online {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.offline {
  background: #f1f5f9;
  color: #64748b;
}

.danger-zone {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid #fee2e2;
}

.danger-zone h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #dc2626;
  margin: 0 0 0.75rem 0;
}

.danger-warning {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.5;
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
  padding: 2rem;
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
  .user-header-section {
    flex-direction: column;
    text-align: center;
  }

  .detail-header {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .detail-header h1 {
    width: 100%;
    order: -1;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
