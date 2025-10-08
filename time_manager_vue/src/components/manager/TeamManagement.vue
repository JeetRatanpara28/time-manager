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
            <h4>{{ filteredUsers.length }}</h4>
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

      <div class="filters-grid">
        <div class="search-card">
          <div class="search-icon">🔍</div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, or department..."
            class="search-input"
          >
        </div>

        <div class="filter-card">
          <label class="filter-label">Role</label>
          <select v-model="roleFilter" class="filter-select">
            <option value="">All Roles</option>
            <option value="manager">Managers</option>
            <option value="employee">Employees</option>
          </select>
        </div>

        <div class="filter-card">
          <label class="filter-label">Status</label>
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Team Members Cards -->
    <div class="team-members-section">
      <div class="members-header">
        <div class="header-icon">👥</div>
        <div class="header-content">
          <h3>Team Members</h3>
          <p>{{ filteredUsers.length }} member{{ filteredUsers.length !== 1 ? 's' : '' }} found</p>
        </div>
      </div>

      <div v-if="filteredUsers.length === 0" class="no-members">
        <div class="no-members-icon">👤</div>
        <h4>No Team Members Found</h4>
        <p>Try adjusting your search or filter criteria</p>
      </div>

      <div v-else class="members-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="member-card">
          <div class="member-header">
            <div class="member-avatar">
              <span>{{ getInitials(user.name) }}</span>
            </div>
            <div class="member-status" :class="user.status || 'active'">
              <span>{{ user.status || 'Active' }}</span>
            </div>
          </div>

          <div class="member-info">
            <h4 class="member-name">{{ user.name }}</h4>
            <p class="member-email">{{ user.email }}</p>
            <div class="member-details">
              <span class="member-role" :class="user.role">
                {{ formatRole(user.role) }}
              </span>
              <span v-if="user.department" class="member-dept">
                {{ user.department }}
              </span>
            </div>
          </div>

          <div class="member-stats">
            <div class="stat-item">
              <span class="stat-value">{{ getTodaysHours(user.id) }}h</span>
              <span class="stat-label">Today</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getWeeklyHours(user.id) }}h</span>
              <span class="stat-label">This Week</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getProductivity(user.id) }}%</span>
              <span class="stat-label">Productivity</span>
            </div>
          </div>

          <div class="member-actions">
            <button class="action-btn primary" @click="editUser(user)" title="Edit Member">
              <span>✏️</span>
              Edit
            </button>
            <button class="action-btn secondary" @click="viewDetails(user)" title="View Details">
              <span>👁️</span>
              Details
            </button>
            <button class="action-btn tertiary" @click="exportUserLogs(user.id)" title="Export Logs">
              <span>📊</span>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-icon">👤</div>
          <div class="modal-title">
            <h3>Edit Team Member</h3>
            <p>Update member information and settings</p>
          </div>
          <button class="close-btn" @click="closeModal">×</button>
        </div>

        <form @submit.prevent="saveUser" class="edit-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input v-model="userForm.name" type="text" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input v-model="userForm.email" type="email" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">Role</label>
              <select v-model="userForm.role" class="form-select" required>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Department</label>
              <input v-model="userForm.department" type="text" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input v-model="userForm.phone" type="tel" class="form-input">
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select v-model="userForm.status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              <span>❌</span>
              Cancel
            </button>
            <button type="submit" class="save-btn">
              <span>💾</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { users, teamStats, timeLogs, updateUser, exportTeamLogsToCSV } from '@/composables/useManagerStore.js';

const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const showEditModal = ref(false);
const editingUser = ref(null);

const userForm = ref({
  name: '',
  email: '',
  role: 'employee',
  department: '',
  phone: '',
  status: 'active'
});

const currentTime = ref('');
let timeInterval = null;

// Update current time every second
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Computed properties for team statistics
const activeMembers = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const activeUsers = new Set();

  timeLogs.value.forEach(log => {
    if (log.date === today && log.status === 'active' && log.clockIn && !log.clockOut) {
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
  const totalMembers = filteredUsers.value.length;
  if (totalMembers === 0) return 0;

  const activeCount = activeMembers.value;
  return Math.round((activeCount / totalMembers) * 100);
});

const filteredUsers = computed(() => {
  let filtered = users.value.filter(user => user.role !== 'general_manager'); // Managers see everyone except GMs

  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.department && user.department.toLowerCase().includes(query))
    );
  }

  // Role filtering - only filter if a specific role is selected
  if (roleFilter.value && roleFilter.value !== '') {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }

  // Status filtering - only filter if a specific status is selected
  if (statusFilter.value && statusFilter.value !== '') {
    filtered = filtered.filter(user => (user.status || 'active') === statusFilter.value);
  }

  return filtered.sort((a, b) => a.name.localeCompare(b.name));
});

// Helper functions
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatRole = (role) => {
  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get today's hours for a user
const getTodaysHours = (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysLog = timeLogs.value.find(log =>
    log.userId === userId && log.date === today && log.totalHours
  );
  return todaysLog?.totalHours || 0;
};

// Get weekly hours for a user
const getWeeklyHours = (userId) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weeklyLogs = timeLogs.value.filter(log =>
    log.userId === userId && log.date >= weekStart && log.totalHours
  );

  return weeklyLogs.reduce((total, log) => total + (log.totalHours || 0), 0).toFixed(1);
};

// Calculate productivity (hours worked vs expected hours)
const getProductivity = (userId) => {
  const weeklyHours = parseFloat(getWeeklyHours(userId));
  const expectedWeeklyHours = 40; // Assuming 40 hours per week
  return expectedWeeklyHours > 0 ? Math.round((weeklyHours / expectedWeeklyHours) * 100) : 0;
};

const editUser = (user) => {
  editingUser.value = user;
  userForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || '',
    phone: user.phone || '',
    status: user.status || 'active'
  };
  showEditModal.value = true;
};

const viewDetails = (user) => {
  // Navigate to user details view
  console.log('Viewing details for user:', user.id);
  // In a real app, this would navigate to a detailed user view
};

const saveUser = async () => {
  if (editingUser.value) {
    try {
      await updateUser(editingUser.value.id, userForm.value);
      closeModal();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  }
};

const exportUserLogs = (userId) => {
  exportTeamLogsToCSV(userId);
};

const closeModal = () => {
  showEditModal.value = false;
  editingUser.value = null;
};

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.team-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Section */
.management-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}

.management-header .header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.management-header .header-content h2 {
  font-size: 2.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.management-header .header-content p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
  font-weight: 500;
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
}

.header-content h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-content p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

/* Team Statistics Section */
.team-stats-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.team-stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981, #059669, #047857);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-content {
  flex: 1;
}

.stat-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.stat-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

/* Filters Section */
.filters-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.filters-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filters-header .header-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1.5rem;
  align-items: end;
}

.search-card {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  font-size: 1.2rem;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-card {
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
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Team Members Section */
.team-members-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.team-members-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8, #1e3a8a);
}

.members-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: space-between;
}

.members-header .header-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.member-card {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.member-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(29, 78, 216, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.member-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
}

.member-card:hover::before {
  opacity: 1;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.member-avatar {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.member-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.member-status.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.member-status.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.member-info {
  margin-bottom: 1rem;
}

.member-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.member-email {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.member-details {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.member-role {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.member-role.manager {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.member-role.employee {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.member-dept {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
}

.member-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.member-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #374151;
  border: 1px solid #e2e8f0;
}

.action-btn.secondary:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.action-btn.tertiary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.action-btn.tertiary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.no-members {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-members-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-members h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.no-members p {
  margin: 0;
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.modal-icon {
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
}

.modal-title h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.modal-title p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.edit-form {
  padding: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
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
}

.cancel-btn,
.save-btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.save-btn {
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .team-management {
    padding: 1rem;
  }

  .management-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .management-header .header-content h2 {
    font-size: 2.2rem;
  }

  .stats-grid,
  .members-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .member-stats {
    flex-direction: column;
    gap: 0.75rem;
  }

  .member-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-header {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .close-btn {
    position: static;
    align-self: flex-end;
  }
}
</style>
