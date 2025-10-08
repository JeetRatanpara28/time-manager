<template>
  <div class="profile-management">
    <div class="profile-header">
      <h2>Profile Management</h2>
      <p>Manage your personal information and preferences</p>
    </div>

    <div class="profile-content">
      <!-- Profile Overview -->
      <div class="profile-overview" v-if="currentUser">
        <div class="profile-avatar">
          <div class="avatar-circle">
            {{ currentUser?.name?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="avatar-info">
            <h3>{{ currentUser?.name || 'Loading...' }}</h3>
            <p>{{ currentUser?.role?.replace('_', ' ') || 'Loading...' }}</p>
            <span class="status-badge online">Online</span>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-label">Member Since</span>
            <span class="stat-value">{{ currentUser?.joinDate ? formatDate(currentUser.joinDate) : 'Loading...' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Department</span>
            <span class="stat-value">{{ currentUser?.department || 'Not set' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Hours This Month</span>
            <span class="stat-value">{{ monthlyHours }}h</span>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>

      <!-- Profile Form -->
      <div class="profile-form-section" v-if="currentUser">
        <h3>Personal Information</h3>
        <form @submit.prevent="saveProfile" class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Full Name *</label>
              <input
                id="name"
                v-model="profileForm.name"
                type="text"
                required
                class="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address *</label>
              <input
                id="email"
                v-model="profileForm.email"
                type="email"
                required
                class="form-input"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                v-model="profileForm.phone"
                type="tel"
                class="form-input"
                placeholder="Enter your phone number"
              />
            </div>

            <div class="form-group">
              <label for="department">Department</label>
              <select
                id="department"
                v-model="profileForm.department"
                class="form-select"
              >
                <option value="Management">Management</option>
                <option value="Sales">Sales</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea
              id="bio"
              v-model="profileForm.bio"
              class="form-textarea"
              placeholder="Tell us about yourself..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="resetForm">
              Reset
            </button>
            <button type="submit" class="btn-primary" :disabled="!hasChanges">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <!-- Account Settings -->
      <div class="account-settings" v-if="currentUser">
        <h3>Account Settings</h3>

        <div class="settings-group">
          <h4>Notifications</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" v-model="settings.emailNotifications" />
              Email Notifications
            </label>
            <p class="setting-description">Receive email updates about your account activity</p>
          </div>

          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" v-model="settings.pushNotifications" />
              Push Notifications
            </label>
            <p class="setting-description">Receive push notifications in your browser</p>
          </div>
        </div>

        <div class="settings-group">
          <h4>Privacy</h4>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" v-model="settings.profileVisibility" />
              Make Profile Public
            </label>
            <p class="setting-description">Allow other team members to view your profile</p>
          </div>
        </div>

        <div class="settings-group danger-zone">
          <h4>Danger Zone</h4>
          <div class="setting-item">
            <button class="btn-danger" @click="confirmDeleteAccount">
              Delete Account
            </button>
            <p class="setting-description">Permanently delete your account and all associated data</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { currentUser, timeLogs, updateUser } from '@/composables/useGmStore.js';

const profileForm = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  bio: ''
});

const settings = reactive({
  emailNotifications: true,
  pushNotifications: true,
  profileVisibility: false
});

// Computed properties
const hasChanges = computed(() => {
  if (!currentUser.value) return false;

  return (
    profileForm.name !== currentUser.value.name ||
    profileForm.email !== currentUser.value.email ||
    profileForm.phone !== currentUser.value.phone ||
    profileForm.department !== currentUser.value.department ||
    profileForm.bio !== (currentUser.value.bio || '')
  );
});

const monthlyHours = computed(() => {
  if (!currentUser.value || !timeLogs.value) return '0.0';

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return timeLogs.value
    .filter(log => {
      const logDate = new Date(log.date);
      return log.userId === currentUser.value.id &&
             logDate.getMonth() === currentMonth &&
             logDate.getFullYear() === currentYear &&
             log.totalHours;
    })
    .reduce((sum, log) => sum + log.totalHours, 0)
    .toFixed(1);
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const resetForm = () => {
  if (!currentUser.value) return;

  profileForm.name = currentUser.value.name;
  profileForm.email = currentUser.value.email;
  profileForm.phone = currentUser.value.phone || '';
  profileForm.department = currentUser.value.department;
  profileForm.bio = currentUser.value.bio || '';
};

const saveProfile = () => {
  if (!currentUser.value) return;

  updateUser(currentUser.value.id, {
    name: profileForm.name,
    email: profileForm.email,
    phone: profileForm.phone,
    department: profileForm.department,
    bio: profileForm.bio
  });

  // Update currentUser ref as well
  Object.assign(currentUser.value, {
    name: profileForm.name,
    email: profileForm.email,
    phone: profileForm.phone,
    department: profileForm.department,
    bio: profileForm.bio
  });

  alert('Profile updated successfully!');
};

const confirmDeleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    alert('Account deletion would be handled by the backend service.');
  }
};

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.profile-management {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 3rem;
}

.profile-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.profile-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-overview {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.profile-avatar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
}

.avatar-info h3 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.avatar-info p {
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  text-transform: capitalize;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #dcfce7;
  color: #166534;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-label {
  display: block;
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.profile-form-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.profile-form-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.account-settings {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.account-settings h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.settings-group {
  margin-bottom: 2rem;
}

.settings-group h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}

.setting-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: #667eea;
}

.setting-description {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0.5rem 0 0 1.75rem;
}

.danger-zone h4 {
  color: #dc2626;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-danger:hover {
  background: #b91c1c;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
