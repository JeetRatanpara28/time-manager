<template>
  <div class="user-management">
    <div class="management-header">
      <h2>User Management</h2>
      <button class="add-user-btn" @click="showAddUserModal = true">
        <span>+</span>
        Add New User
      </button>
    </div>

    <!-- User Statistics -->
    <div class="user-stats">
      <div class="stat-card">
        <h4>{{ employees?.length || 0 }}</h4>
        <p>Employees</p>
      </div>
      <div class="stat-card">
        <h4>{{ managers?.length || 0 }}</h4>
        <p>Managers</p>
      </div>
      <div class="stat-card">
        <h4>{{ generalManagers?.length || 0 }}</h4>
        <p>General Managers</p>
      </div>
      <div class="stat-card">
        <h4>{{ onlineUsers?.length || 0 }}</h4>
        <p>Online</p>
      </div>
    </div>

    <!-- Users Table -->
    <div class="users-section">
      <div class="section-header">
        <h3>All Users</h3>
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="search-input"
          />
        </div>
      </div>

      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Password</th>
              <th>Status</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span :class="['role-badge', user.role]">
                  {{ user.role.replace('_', ' ') }}
                </span>
              </td>
              <td>{{ user.department }}</td>
              <td>
                <span class="password-display">{{ user.password || 'No Password Set' }}</span>
              </td>
              <td>
                <span :class="['status-indicator', user.status]">
                  <span class="status-dot"></span>
                  {{ user.status }}
                </span>
              </td>
              <td>{{ formatDate(user.joinDate) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="editUser(user)" title="Edit">
                    ✏️
                  </button>
                  <button class="btn-icon" @click="deleteUserConfirm(user)" title="Delete">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div v-if="showAddUserModal || showEditUserModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingUser ? 'Edit User' : 'Add New User' }}</h3>
          <button class="close-btn" @click="closeModals">×</button>
        </div>

        <form @submit.prevent="saveUser" class="user-form">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input
              id="name"
              v-model="userForm.name"
              type="text"
              required
              class="form-input"
              placeholder="Enter full name"
            />
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input
              id="email"
              v-model="userForm.email"
              type="email"
              required
              class="form-input"
              placeholder="Enter email address"
            />
          </div>

          <div class="form-group">
            <label for="password">Password *</label>
            <input
              id="password"
              v-model="userForm.password"
              type="text"
              :required="!editingUser"
              class="form-input"
              :placeholder="editingUser ? 'Leave blank to keep current password' : 'Enter password'"
              minlength="6"
            />
          </div>

          <div v-if="!editingUser" class="form-group">
            <label for="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              v-model="userForm.confirmPassword"
              type="text"
              required
              class="form-input"
              placeholder="Confirm password"
              minlength="6"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role">Role *</label>
              <select
                id="role"
                v-model="userForm.role"
                required
                class="form-select"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="general_manager">General Manager</option>
              </select>
            </div>

            <div class="form-group">
              <label for="department">Department</label>
              <input
                id="department"
                v-model="userForm.department"
                type="text"
                class="form-input"
                placeholder="Enter department"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input
              id="phone"
              v-model="userForm.phone"
              type="tel"
              class="form-input"
              placeholder="Enter phone number"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModals">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingUser ? 'Update User' : 'Add User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal delete-modal" @click.stop>
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
          <button class="close-btn" @click="closeDeleteModal">×</button>
        </div>

        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <h4>Are you sure?</h4>
            <p>You are about to delete <strong>{{ userToDelete?.name }}</strong>.</p>
            <p class="warning-text">This action cannot be undone. All associated data will be permanently removed.</p>
          </div>

          <div class="delete-actions">
            <button class="btn-secondary" @click="closeDeleteModal">
              Cancel
            </button>
            <button class="btn-danger" @click="confirmDelete">
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { users, employees, managers, generalManagers, onlineUsers, addUser, updateUser, deleteUser } from '@/composables/useGmStore.js';

const showAddUserModal = ref(false);
const showEditUserModal = ref(false);
const showDeleteModal = ref(false);
const editingUser = ref(null);
const userToDelete = ref(null);
const searchQuery = ref('');
const userForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'employee',
  department: '',
  phone: ''
});

// Computed properties
const filteredUsers = computed(() => {
  if (!users.value || !users.value.length) return [];

  let filtered = users.value;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (user.password && user.password.toLowerCase().includes(query))
    );
  }

  // Sort alphabetically by name
  return filtered.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const closeModals = () => {
  showAddUserModal.value = false;
  showEditUserModal.value = false;
  editingUser.value = null;

  // Reset form
  userForm.name = '';
  userForm.email = '';
  userForm.password = '';
  userForm.confirmPassword = '';
  userForm.role = 'employee';
  userForm.department = '';
  userForm.phone = '';
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.name = user.name;
  userForm.email = user.email;
  userForm.password = ''; // Don't show existing password for security
  userForm.role = user.role;
  userForm.department = user.department;
  userForm.phone = user.phone;
  showEditUserModal.value = true;
};

const saveUser = () => {
  // Validate passwords match for new users
  if (!editingUser.value && userForm.password !== userForm.confirmPassword) {
    alert('Passwords do not match!');
    return;
  }

  if (editingUser.value) {
    // Update existing user - only include password if provided
    const updateData = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      department: userForm.department,
      phone: userForm.phone
    };

    // Only include password if it's not empty (user wants to change password)
    if (userForm.password.trim()) {
      updateData.password = userForm.password;
    }

    updateUser(editingUser.value.id, updateData);
  } else {
    // Add new user - include all fields including password
    const baseUsername = userForm.email.split('@')[0];
    const timestamp = Date.now();
    const username = `${baseUsername}_${timestamp}`;

    addUser({
      username: username,
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      department: userForm.department,
      phone: userForm.phone
    });
  }

  closeModals();
};

const deleteUserConfirm = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  if (userToDelete.value) {
    deleteUser(userToDelete.value.id);
    closeDeleteModal();
  }
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  userToDelete.value = null;
};
</script>

<style scoped>
.user-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.management-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.add-user-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s ease;
}

.add-user-btn:hover {
  transform: translateY(-1px);
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stat-card h4 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.stat-card p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.users-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-box {
  position: relative;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 250px;
  font-size: 0.9rem;
}

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.role-badge.employee {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.manager {
  background: #fef3c7;
  color: #d97706;
}

.role-badge.general_manager {
  background: #fee2e2;
  color: #dc2626;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.status-indicator.online .status-dot {
  background: #10b981;
}

.password-display {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85rem;
  color: #6b7280;
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

/* Column classes for mobile responsive layout */
.col-date,
.col-times,
.col-hours,
.col-status,
.col-password {
  padding: 0.5rem 0;
}

.col-times {
  order: 2;
}

.col-hours {
  order: 3;
}

.col-status {
  order: 4;
}

.col-password {
  order: 5;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  transition: background 0.2s ease;
}

.btn-icon:hover {
  background: #f3f4f6;
}

/* Modal Styles */
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
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
}

.user-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.delete-modal .modal-body {
  padding: 2rem;
}
.delete-warning {
  text-align: center;
  margin-bottom: 2rem;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.delete-warning h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.delete-warning p {
  color: #6b7280;
  margin: 0.5rem 0;
}

.warning-text {
  color: #dc2626 !important;
  font-weight: 500;
}

.delete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

@media (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }

  .management-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .user-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }

  .col-times {
    order: 2;
  }

  .col-hours {
    order: 3;
  }

  .col-status {
    order: 4;
  }

  .col-password {
    order: 5;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
