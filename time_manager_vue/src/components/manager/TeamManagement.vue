<template>
  <div class="team-management">
    <!-- Header Section -->
    <div class="management-header">
      <div class="header-icon">👥</div>
      <div class="header-content">
        <h2>Team Management</h2>
        <p>Manage your team members, monitor performance, and oversee operations</p>
      </div>
    </div>

    <!-- Team Statistics Overview -->
    <div class="team-stats-section">
      <div class="stats-header">
        <div class="header-icon">📊</div>
        <div class="header-content">
          <h3>Team Overview</h3>
          <p>Quick insights into your team's current status</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h4>{{ totalTeamMembers }}</h4>
            <p>Total Members</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🟢</div>
          <div class="stat-content">
            <h4>{{ activeMembers }}</h4>
            <p>Active Now</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">☕</div>
          <div class="stat-content">
            <h4>{{ onBreakMembers }}</h4>
            <p>On Break</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h4>{{ averageProductivity }}%</h4>
            <p>Avg Productivity</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="filters-section">
      <div class="filters-header">
        <div class="header-icon">🔍</div>
        <div class="header-content">
          <h3>Find Team Members</h3>
          <p>Search and filter your team</p>
        </div>
      </div>

      <div class="filters-container">
        <div class="search-wrapper">
          <div class="search-icon">🔍</div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or department..."
            class="search-input"
          >
          <button 
            v-if="searchQuery" 
            @click="searchQuery = ''" 
            class="clear-search"
            title="Clear search"
          >
            ✕
          </button>
        </div>

        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">Role</label>
            <select v-model="roleFilter" class="filter-select">
              <option value="">All Roles</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select v-model="statusFilter" class="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button 
            v-if="hasActiveFilters" 
            @click="clearAllFilters" 
            class="clear-filters-btn"
          >
            <span>🔄</span>
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Team Members Cards -->
    <div class="team-members-section">
      <div class="members-header">
        <div class="header-left">
          <div class="header-icon">👥</div>
          <div class="header-content">
            <h3>Team Members</h3>
            <p>{{ filteredUsers.length }} member{{ filteredUsers.length !== 1 ? 's' : '' }} found</p>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading team members...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="no-members">
        <div class="no-members-icon">👤</div>
        <h4>No Team Members Found</h4>
        <p v-if="hasActiveFilters">Try adjusting your search or filter criteria</p>
        <p v-else>No team members available</p>
        <button v-if="hasActiveFilters" @click="clearAllFilters" class="reset-btn">
          Reset Filters
        </button>
      </div>

      <div v-else class="members-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="member-card">
          <div class="member-header">
            <div class="member-avatar">
              <span>{{ getInitials(user.name) }}</span>
            </div>
            <div class="member-status" :class="getUserStatus(user)">
              <span class="status-dot"></span>
              <span>{{ formatStatus(getUserStatus(user)) }}</span>
            </div>
          </div>

          <div class="member-info">
            <h4 class="member-name">{{ user.name }}</h4>
            <p class="member-email">{{ user.email }}</p>
            <div class="member-details">
              <span class="member-role" :class="user.role">
                <span class="role-icon">{{ getRoleIcon(user.role) }}</span>
                {{ formatRole(user.role) }}
              </span>
              <span v-if="user.department" class="member-dept">
                <span class="dept-icon">🏢</span>
                {{ user.department }}
              </span>
            </div>
          </div>

          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-icon">⏰</span>
              <div class="stat-info">
                <span class="stat-value">{{ getTodaysHours(user.id) }}h</span>
                <span class="stat-label">Today</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📅</span>
              <div class="stat-info">
                <span class="stat-value">{{ getWeeklyHours(user.id) }}h</span>
                <span class="stat-label">This Week</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📊</span>
              <div class="stat-info">
                <span class="stat-value">{{ getProductivity(user.id) }}%</span>
                <span class="stat-label">Productivity</span>
              </div>
            </div>
          </div>

          <div class="member-actions">
            <button 
              class="action-btn primary" 
              @click.stop="editUser(user)" 
              title="Edit Member"
            >
              <span>✏️</span>
              <span class="btn-text">Edit</span>
            </button>
            <button 
              class="action-btn secondary" 
              @click.stop="viewDetails(user)" 
              title="View Details"
            >
              <span>👁️</span>
              <span class="btn-text">Details</span>
            </button>
            <button 
              class="action-btn tertiary" 
              @click.stop="exportUserLogs(user.id)" 
              title="Export Logs"
            >
              <span>📊</span>
              <span class="btn-text">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <transition name="modal-fade">
      <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="modal-icon">👤</div>
            <div class="modal-title">
              <h3>Edit Team Member</h3>
              <p>Update member information and settings</p>
            </div>
            <button class="close-btn" @click="closeModal">✕</button>
          </div>

          <form @submit.prevent="saveUser" class="edit-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input v-model="userForm.name" type="text" class="form-input" required>
              </div>

              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input v-model="userForm.email" type="email" class="form-input" required>
              </div>

              <div class="form-group">
                <label class="form-label">Role *</label>
                <select v-model="userForm.role" class="form-select" required>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Department</label>
                <input v-model="userForm.department" type="text" class="form-input" placeholder="e.g., Sales, IT, HR">
              </div>

              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input v-model="userForm.phone" type="tel" class="form-input" placeholder="e.g., +1234567890">
              </div>

              <div class="form-group">
                <label class="form-label">Status *</label>
                <select v-model="userForm.status" class="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeModal">
                <span>✕</span>
                Cancel
              </button>
              <button type="submit" class="save-btn" :disabled="isSaving">
                <span v-if="isSaving">⏳</span>
                <span v-else>💾</span>
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { users, timeLogs, updateUser, exportTeamLogsToCSV } from '@/composables/useManagerStore.js';

const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const showEditModal = ref(false);
const editingUser = ref(null);
const isLoading = ref(false);
const isSaving = ref(false);

const userForm = ref({
  name: '',
  email: '',
  role: 'employee',
  department: '',
  phone: '',
  status: 'active'
});

// Computed properties
const totalTeamMembers = computed(() => {
  return users.value.filter(user => user.role !== 'general_manager').length;
});

const activeMembers = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const activeUsers = new Set();

  timeLogs.value.forEach(log => {
    if (log.date === today && log.clockIn && !log.clockOut) {
      activeUsers.add(log.userId);
    }
  });

  return activeUsers.size;
});

const onBreakMembers = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const breakUsers = new Set();

  timeLogs.value.forEach(log => {
    if (log.date === today && log.breakStart && !log.breakEnd) {
      breakUsers.add(log.userId);
    }
  });

  return breakUsers.size;
});

const averageProductivity = computed(() => {
  if (totalTeamMembers.value === 0) return 0;
  const activeCount = activeMembers.value;
  return Math.round((activeCount / totalTeamMembers.value) * 100);
});

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || roleFilter.value || statusFilter.value);
});

const filteredUsers = computed(() => {
  let filtered = users.value.filter(user => user.role !== 'general_manager');

  // Search filter
  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(user =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      (user.department && user.department.toLowerCase().includes(query))
    );
  }

  // Role filter
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(user => {
      const userStatus = getUserStatus(user);
      return userStatus === statusFilter.value;
    });
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
});

// Helper functions
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatRole = (role) => {
  if (!role) return 'Unknown';
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getRoleIcon = (role) => {
  const icons = {
    'manager': '👔',
    'employee': '👨‍💼',
    'general_manager': '👑'
  };
  return icons[role] || '👤';
};

const getUserStatus = (user) => {
  return user.status || 'active';
};

const getTodaysHours = (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysLog = timeLogs.value.find(log =>
    log.userId === userId && log.date === today
  );
  
  if (!todaysLog || !todaysLog.clockIn) return '0.0';
  
  const totalHours = todaysLog.totalHours || 0;
  return totalHours.toFixed(1);
};

const getWeeklyHours = (userId) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weeklyLogs = timeLogs.value.filter(log =>
    log.userId === userId && log.date >= weekStart && log.totalHours
  );

  const total = weeklyLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  return total.toFixed(1);
};

const getProductivity = (userId) => {
  const weeklyHours = parseFloat(getWeeklyHours(userId));
  const expectedWeeklyHours = 40;
  if (expectedWeeklyHours === 0) return 0;
  const productivity = Math.round((weeklyHours / expectedWeeklyHours) * 100);
  return Math.min(productivity, 100);
};

const clearAllFilters = () => {
  searchQuery.value = '';
  roleFilter.value = '';
  statusFilter.value = '';
};

const editUser = (user) => {
  console.log('Editing user:', user);
  editingUser.value = user;
  userForm.value = {
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'employee',
    department: user.department || '',
    phone: user.phone || '',
    status: user.status || 'active'
  };
  showEditModal.value = true;
};

const viewDetails = (user) => {
  console.log('Viewing details for user:', user);
  alert(`Viewing details for ${user.name}\n\nThis would navigate to a detailed user view in a full application.`);
};

const saveUser = async () => {
  if (!editingUser.value) return;
  
  isSaving.value = true;
  
  try {
    console.log('Saving user:', editingUser.value.id, userForm.value);
    await updateUser(editingUser.value.id, userForm.value);
    alert('User updated successfully!');
    closeModal();
  } catch (err) {
    console.error('Failed to update user:', err);
    alert('Failed to update user. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const exportUserLogs = (userId) => {
  try {
    console.log('Exporting logs for user:', userId);
    exportTeamLogsToCSV(userId);
  } catch (err) {
    console.error('Failed to export logs:', err);
    alert('Failed to export logs. Please try again.');
  }
};

const closeModal = () => {
  showEditModal.value = false;
  editingUser.value = null;
  userForm.value = {
    name: '',
    email: '',
    role: 'employee',
    department: '',
    phone: '',
    status: 'active'
  };
};

onMounted(() => {
  console.log('TeamManagement mounted');
  console.log('Total users:', users.value.length);
  console.log('Total time logs:', timeLogs.value.length);
});
</script>

<style scoped>
.team-management {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Section */
.management-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
}

.management-header .header-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.management-header .header-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.management-header .header-content p {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.95;
}

/* Section Headers */
.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.header-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-content p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

/* Team Statistics Section */
.team-stats-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-content h4 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.stat-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* Filters Section */
.filters-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 1rem 3.5rem 1rem 3.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.clear-search {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  font-size: 1rem;
  line-height: 1;
  z-index: 2;
}

.clear-search:hover {
  background: #cbd5e1;
  color: #1e293b;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.filter-select {
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.clear-filters-btn {
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: fit-content;
}

.clear-filters-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* Team Members Section */
.team-members-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-members {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-members-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-members h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.no-members p {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.member-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.member-avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.member-status {
  padding: 0.5rem 0.85rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: capitalize;
  letter-spacing: 0.5px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.member-status.active {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.member-status.active .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.member-status.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.member-status.inactive .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.member-info {
  margin-bottom: 1.25rem;
  flex: 1;
}

.member-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.member-email {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0 0 0.85rem 0;
  word-break: break-word;
}

.member-details {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.member-role {
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.role-icon {
  font-size: 1.1rem;
}

.member-role.manager {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.member-role.employee {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.member-dept {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.dept-icon {
  font-size: 0.95rem;
}

.member-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.stat-icon {
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: auto;
}

.action-btn {
  padding: 0.85rem 0.5rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn span:first-child {
  font-size: 1.1rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.action-btn.secondary {
  background: white;
  color: #374151;
  border: 2px solid #e2e8f0;
}

.action-btn.secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn.tertiary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.action-btn.tertiary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.action-btn:active {
  transform: translateY(0);
}

/* Modal Styles */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 650px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    transform: translateY(40px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 2rem;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
}

.modal-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  flex-shrink: 0;
}

.modal-title {
  flex: 1;
}

.modal-title h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  line-height: 1.2;
}

.modal-title p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
}

.close-btn {
  background: #f1f5f9;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
  transform: rotate(90deg);
}

.edit-form {
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-input,
.form-select {
  padding: 0.95rem 1.1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  color: #1e293b;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.cancel-btn,
.save-btn {
  padding: 0.95rem 1.75rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: all 0.2s ease;
}

.cancel-btn {
  border: 2px solid #e2e8f0;
  background: white;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.save-btn {
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .team-management {
    padding: 1rem;
  }

  .management-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1.5rem;
  }

  .management-header .header-content h2 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .clear-filters-btn {
    width: 100%;
    justify-content: center;
  }

  .members-grid {
    grid-template-columns: 1fr;
  }

  .member-actions {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-height: 95vh;
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .close-btn {
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }

  .btn-text {
    display: inline;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .member-stats {
    grid-template-columns: 1fr;
  }

  .management-header .header-content h2 {
    font-size: 1.75rem;
  }

  .management-header .header-content p {
    font-size: 0.95rem;
  }

  .member-avatar {
    width: 56px;
    height: 56px;
    font-size: 1.3rem;
  }

  .member-name {
    font-size: 1.2rem;
  }

  .action-btn {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  .btn-text {
    display: none;
  }

  .action-btn span:first-child {
    font-size: 1.3rem;
  }
}
</style>