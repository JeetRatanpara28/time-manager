<template>
  <div class="user-management">
    <div class="page-header">
      <h1>👥 Team Management</h1>
      <button v-if="canEditUsers" @click="goToRegister" class="btn-add-user">
        ➕ Add User
      </button>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or email..."
        class="search-input"
      />
      <select v-model="roleFilter" class="filter-select">
        <option value="">All Roles</option>
        <option value="employee">Employees</option>
        <option value="manager">Managers</option>
        <option value="gm">General Managers</option>
      </select>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💼</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.employees }}</div>
          <div class="stat-label">Employees</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.managers }}</div>
          <div class="stat-label">Managers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.online }}</div>
          <div class="stat-label">Online</div>
        </div>
      </div>
    </div>

    <!-- Debug Info (remove in production) -->
    <div v-if="currentUser" class="debug-info">
      Current user: {{ currentUser.email }} | Role: {{ currentUser.role }} | Can
      Edit: {{ canEditUsers }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
      <button @click="loadUsers" class="retry-btn">Retry</button>
    </div>

    <!-- Users List -->
    <div v-else-if="filteredUsers.length > 0" class="users-list">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="user-card"
        @click="viewUserDetail(user)"
      >
        <div class="user-avatar-container">
          <img
            :src="getUserAvatar(user)"
            :alt="user.name"
            class="user-avatar"
          />
          <div class="status-dot" :class="user.status || 'offline'"></div>
        </div>

        <div class="user-info">
          <div class="user-name">{{ user.name || user.username }}</div>
          <div class="user-email">{{ user.email }}</div>
          <div class="user-meta">
            <span class="user-role" :class="user.role">
              {{ getRoleLabel(user.role) }}
            </span>
            <span v-if="user.department" class="user-department">
              🏢 {{ user.department }}
            </span>
          </div>
        </div>

        <div class="user-actions">
          <button
            v-if="canEditUsers"
            @click.stop="openEditModal(user)"
            class="btn-icon"
            title="Edit user"
          >
            ✏️
          </button>
          <button
            v-if="canDeleteUsers && user.id !== currentUser?.id"
            @click.stop="deleteUser(user)"
            class="btn-icon delete"
            title="Delete user"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <span class="empty-icon">👥</span>
      <p>No users found</p>
      <button v-if="canEditUsers" @click="goToRegister" class="btn-add-first">
        Add your first user
      </button>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>✏️ Edit User</h2>
          <button @click="closeEditModal" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="saveUser" class="edit-form">
          <div class="form-group">
            <label>Username</label>
            <input
              v-model="editingUser.username"
              type="text"
              required
              placeholder="username"
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
              v-model="editingUser.email"
              type="email"
              required
              placeholder="email@example.com"
            />
          </div>

          <div class="form-group">
            <label>Role</label>
            <select v-model="editingUser.role" required>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="gm">General Manager</option>
            </select>
          </div>

          <div class="form-group">
            <label>Department</label>
            <input
              v-model="editingUser.department"
              type="text"
              placeholder="Engineering, Sales, HR..."
            />
          </div>

          <div class="form-group">
            <label>New Password (leave empty to keep current)</label>
            <input
              v-model="editingUser.password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div v-if="editError" class="error-message">⚠️ {{ editError }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeEditModal" class="btn-cancel">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="btn-save">
              {{ saving ? "Saving..." : "Save Changes" }}
            </button>
          </div>
        </form>
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

const users = ref([]);
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");
const roleFilter = ref("");

const showEditModal = ref(false);
const editingUser = ref({});
const editError = ref("");
const saving = ref(false);

const userRole = computed(() => currentUser.value?.role || "employee");
const isGM = computed(() => userRole.value === "gm");
const canEditUsers = computed(() => isGM.value);
const canDeleteUsers = computed(() => isGM.value);

const stats = computed(() => {
  return {
    total: users.value.length,
    employees: users.value.filter((u) => u.role === "employee").length,
    managers: users.value.filter((u) => u.role === "manager" || u.role === "gm")
      .length,
    online: users.value.filter((u) => u.status === "online").length,
  };
});

const filteredUsers = computed(() => {
  let filtered = users.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((user) => {
      const name = (user.name || user.username || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }

  if (roleFilter.value) {
    filtered = filtered.filter((user) => user.role === roleFilter.value);
  }

  return filtered;
});

function getUserAvatar(user) {
  const name = user.name || user.username || user.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=667eea&color=fff&size=128`;
}

function getRoleLabel(role) {
  const labels = {
    employee: "Employee",
    manager: "Manager",
    gm: "GM",
    general_manager: "GM",
  };
  return labels[role] || role;
}

function viewUserDetail(user) {
  router.push(`/user/${user.id}`);
}

function openEditModal(user) {
  if (!canEditUsers.value) {
    alert("Only GMs can edit users");
    return;
  }
  editingUser.value = { ...user, password: "" };
  editError.value = "";
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  editingUser.value = {};
  editError.value = "";
}

async function saveUser() {
  if (!canEditUsers.value) {
    editError.value = "Only GMs can edit users";
    return;
  }

  saving.value = true;
  editError.value = "";

  try {
    const updateData = {
      username: editingUser.value.username,
      email: editingUser.value.email,
      role: editingUser.value.role,
      department: editingUser.value.department,
    };

    if (editingUser.value.password) {
      updateData.password = editingUser.value.password;
    }

    const response = await apiClient.put(`/users/${editingUser.value.id}`, {
      user: updateData,
    });

    const updatedUser =
      response.data?.data || response.data?.user || response.data;
    const index = users.value.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users.value[index] = updatedUser;
    }

    db.saveUserData(updatedUser.id, updatedUser);

    closeEditModal();
    alert("User updated successfully!");
  } catch (err) {
    console.error("Update user failed:", err);
    editError.value = err.response?.data?.error || "Failed to update user";
  } finally {
    saving.value = false;
  }
}

async function deleteUser(user) {
  if (!canDeleteUsers.value) {
    error.value = "Only GMs can delete users";
    return;
  }

  if (user.id === currentUser.value?.id) {
    error.value = "You cannot delete yourself";
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete ${
      user.name || user.email
    }?\n\nThis will also delete all their working time records. This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    await apiClient.delete(`/users/${user.id}`);
    db.deleteUser(user.id);
    await loadUsers();
    alert("User deleted successfully");
  } catch (err) {
    console.error("Delete user failed:", err);
    error.value = err.response?.data?.error || "Failed to delete user";
    setTimeout(() => {
      error.value = "";
    }, 5000);
  }
}

function goToRegister() {
  router.push("/register");
}

async function loadUsers() {
  loading.value = true;
  error.value = "";

  try {
    users.value = db.getUsers();

    if (navigator.onLine) {
      const response = await apiClient.get("/users");
      const serverUsers = response.data?.data || response.data || [];
      db.saveUsers(serverUsers);
      users.value = serverUsers;
      console.log("✅ Loaded users:", users.value.length);
    }
  } catch (err) {
    console.error("Failed to load users:", err);
    error.value = err.response?.data?.error || "Failed to load users";
    users.value = db.getUsers();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadUsers();
});

defineExpose({
  loadUsers,
});
</script>

<style scoped>
.user-management {
  padding: 1.5rem;
  padding-bottom: 100px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.btn-add-user {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-add-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.debug-info {
  background: #fef3c7;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #92400e;
  font-family: monospace;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.retry-btn,
.btn-add-first {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.user-avatar-container {
  position: relative;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid #f8fafc;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: #94a3b8;
}

.status-dot.online {
  background: #10b981;
}

.status-dot.offline {
  background: #94a3b8;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.user-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.user-role {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.user-role.employee {
  background: #dbeafe;
  color: #1e40af;
}

.user-role.manager {
  background: #fef3c7;
  color: #92400e;
}

.user-role.gm,
.user-role.general_manager {
  background: #fce7f3;
  color: #9f1239;
}

.user-department {
  font-size: 0.75rem;
  color: #64748b;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: #f8fafc;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e2e8f0;
}

.btn-icon.delete:hover {
  background: #fee2e2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #1e293b;
}

.edit-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel,
.btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-save {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .user-card {
    flex-wrap: wrap;
  }

  .user-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .modal-content {
    max-height: 80vh;
  }
}
</style>
