<template>
  <div class="manager-profile">
    <div class="header">
      <h2>My Profile</h2>
      <p>Update your personal details and credentials</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingData" class="loading-state">
      <p>Loading your profile...</p>
    </div>

    <!-- Profile Form -->
    <div v-else class="profile-form">
      <div class="form-section">
        <h3>Personal Information</h3>

        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="profileForm.name" type="text" placeholder="Enter your full name">
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input v-model="profileForm.email" type="email" placeholder="Enter your email">
          </div>

          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="profileForm.phone" type="tel" placeholder="Enter your phone number">
          </div>

          <div class="form-group">
            <label>Department</label>
            <input v-model="profileForm.department" type="text" placeholder="Enter your department">
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Professional Details</h3>

        <div class="form-grid">
          <div class="form-group">
            <label>Job Title</label>
            <input v-model="profileForm.jobTitle" type="text" placeholder="Enter your job title">
          </div>

          <div class="form-group">
            <label>Employee ID</label>
            <input v-model="profileForm.employeeId" type="text" placeholder="Enter your employee ID">
          </div>

          <div class="form-group">
            <label>Manager Since</label>
            <input v-model="profileForm.managerSince" type="date">
          </div>

          <div class="form-group">
            <label>Team Size</label>
            <input v-model="profileForm.teamSize" type="number" min="0" placeholder="Number of team members">
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Security Settings</h3>

        <div class="form-grid">
          <div class="form-group">
            <label>Current Password</label>
            <input v-model="profileForm.currentPassword" type="password" placeholder="Enter current password">
          </div>

          <div class="form-group">
            <label>New Password</label>
            <input v-model="profileForm.newPassword" type="password" placeholder="Enter new password">
          </div>

          <div class="form-group">
            <label>Confirm New Password</label>
            <input v-model="profileForm.confirmPassword" type="password" placeholder="Confirm new password">
          </div>
        </div>

        <div class="password-requirements">
          <p><strong>Password Requirements:</strong></p>
          <ul>
            <li>At least 8 characters long</li>
            <li>Contains at least one uppercase letter</li>
            <li>Contains at least one lowercase letter</li>
            <li>Contains at least one number</li>
            <li>Contains at least one special character</li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button class="cancel-btn" @click="resetForm" :disabled="isLoading">
          Reset Changes
        </button>
        <button class="save-btn" @click="saveProfile" :disabled="isLoading || !hasChanges">
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </div>

    <!-- Profile Summary -->
    <div v-if="!isLoadingData" class="profile-summary">
      <h3>Profile Summary</h3>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">👤</div>
          <div class="card-content">
            <h4>{{ profileForm.name || 'Not set' }}</h4>
            <p>Full Name</p>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📧</div>
          <div class="card-content">
            <h4>{{ profileForm.email || 'Not set' }}</h4>
            <p>Email Address</p>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">📱</div>
          <div class="card-content">
            <h4>{{ profileForm.phone || 'Not set' }}</h4>
            <p>Phone Number</p>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon">👥</div>
          <div class="card-content">
            <h4>{{ profileForm.teamSize || 0 }}</h4>
            <p>Team Members</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/composables/useAuthStore.js';

// Initialize auth store
const authStore = useAuthStore();

// Reactive data
const isLoading = ref(false);
const isLoadingData = ref(true);

// Form data
const profileForm = ref({
  name: '',
  email: '',
  phone: '',
  department: '',
  jobTitle: '',
  employeeId: '',
  managerSince: '',
  teamSize: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// Original data for change detection
const originalForm = ref({});

// Computed properties
const hasChanges = computed(() => {
  const current = { ...profileForm.value };
  const original = { ...originalForm.value };
  
  // Don't consider password fields in change detection if they're empty
  if (!current.currentPassword && !current.newPassword && !current.confirmPassword) {
    delete current.currentPassword;
    delete current.newPassword;
    delete current.confirmPassword;
    delete original.currentPassword;
    delete original.newPassword;
    delete original.confirmPassword;
  }
  
  return JSON.stringify(current) !== JSON.stringify(original);
});

// Methods
const loadUserData = () => {
  try {
    console.log('🔄 Loading user data...');
    console.log('Auth Store currentUser:', authStore.currentUser.value);
    console.log('Auth Store isAuthenticated:', authStore.isAuthenticated.value);
    
    // Get user from currentUser ref (not .user)
    const user = authStore.currentUser.value;
    
    if (user) {
      console.log('✅ User data found:', user);
      
      // Populate form with user data
      profileForm.value = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        jobTitle: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Manager',
        employeeId: user.id?.toString() || '',
        managerSince: user.managerSince || new Date().toISOString().split('T')[0],
        teamSize: user.teamSize?.toString() || '0',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      
      // Store original data for change detection
      originalForm.value = { 
        ...profileForm.value,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      
      console.log('✅ Profile form populated successfully:', profileForm.value);
    } else {
      console.warn('⚠️ No user data available in auth store');
      
      // Try to get from sessionStorage as fallback
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('✅ Found user in sessionStorage:', parsedUser);
          
          profileForm.value = {
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            department: parsedUser.department || '',
            jobTitle: parsedUser.role ? parsedUser.role.charAt(0).toUpperCase() + parsedUser.role.slice(1) : 'Manager',
            employeeId: parsedUser.id?.toString() || '',
            managerSince: parsedUser.managerSince || new Date().toISOString().split('T')[0],
            teamSize: parsedUser.teamSize?.toString() || '0',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
          
          originalForm.value = { ...profileForm.value };
          console.log('✅ Profile loaded from sessionStorage');
        } catch (e) {
          console.error('❌ Failed to parse stored user:', e);
        }
      } else {
        console.error('❌ No user data in sessionStorage either');
        alert('Unable to load profile data. Please try logging out and logging back in.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to load user data:', error);
    alert('Failed to load profile data. Please refresh the page or try logging in again.');
  } finally {
    isLoadingData.value = false;
  }
};

const resetForm = () => {
  if (originalForm.value && Object.keys(originalForm.value).length > 0) {
    profileForm.value = { 
      ...originalForm.value,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
};

const saveProfile = async () => {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    // Create update data
    const updateData = {
      name: profileForm.value.name,
      email: profileForm.value.email,
      phone: profileForm.value.phone,
      department: profileForm.value.department,
      role: profileForm.value.jobTitle.toLowerCase(),
      managerSince: profileForm.value.managerSince,
      teamSize: parseInt(profileForm.value.teamSize) || 0
    };
    
    // Add password fields if they're filled
    if (profileForm.value.currentPassword && profileForm.value.newPassword) {
      updateData.currentPassword = profileForm.value.currentPassword;
      updateData.newPassword = profileForm.value.newPassword;
    }

    console.log('💾 Saving profile data:', updateData);

    // Update currentUser directly in the store
    if (authStore.currentUser.value) {
      Object.assign(authStore.currentUser.value, {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        department: updateData.department,
        role: updateData.role
      });
      
      // Update sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(authStore.currentUser.value));
      
      console.log('✅ User updated in store:', authStore.currentUser.value);
    }

    // Update original form data
    originalForm.value = { 
      ...profileForm.value,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    // Clear password fields
    profileForm.value.currentPassword = '';
    profileForm.value.newPassword = '';
    profileForm.value.confirmPassword = '';

    alert('Profile updated successfully!');

  } catch (error) {
    console.error('❌ Failed to save profile:', error);
    alert('Failed to save profile. Please try again.');
  } finally {
    isLoading.value = false;
  }
};

const validateForm = () => {
  // Basic validation
  if (!profileForm.value.name?.trim()) {
    alert('Please enter your full name');
    return false;
  }

  if (!profileForm.value.email?.trim()) {
    alert('Please enter your email address');
    return false;
  }

  if (!profileForm.value.email.includes('@')) {
    alert('Please enter a valid email address');
    return false;
  }

  // Password validation
  if (profileForm.value.newPassword || profileForm.value.confirmPassword) {
    if (!profileForm.value.currentPassword) {
      alert('Please enter your current password');
      return false;
    }

    if (profileForm.value.newPassword !== profileForm.value.confirmPassword) {
      alert('New passwords do not match');
      return false;
    }

    if (profileForm.value.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return false;
    }

    // Basic password strength check
    const hasUpperCase = /[A-Z]/.test(profileForm.value.newPassword);
    const hasLowerCase = /[a-z]/.test(profileForm.value.newPassword);
    const hasNumbers = /\d/.test(profileForm.value.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(profileForm.value.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      alert('New password does not meet requirements');
      return false;
    }
  }

  return true;
};

// Watch for changes in currentUser
watch(() => authStore.currentUser.value, (newUser) => {
  console.log('👀 CurrentUser changed:', newUser);
  if (newUser && !profileForm.value.name) {
    loadUserData();
  }
}, { immediate: true, deep: true });

// Initialize component
onMounted(() => {
  console.log('🚀 ManagerProfile component mounted');
  console.log('📊 Auth Store State:', {
    isAuthenticated: authStore.isAuthenticated.value,
    currentUser: authStore.currentUser.value,
    isAuthInitialized: authStore.isAuthInitialized.value
  });
  
  // Load data immediately
  loadUserData();
});
</script>

<style scoped>
.manager-profile {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.header p {
  color: #64748b;
  font-size: 1.1rem;
}

.loading-state {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-bottom: 2rem;
}

.loading-state p {
  font-size: 1.1rem;
  color: #64748b;
}

.profile-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.password-requirements {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.password-requirements p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #374151;
}

.password-requirements ul {
  margin: 0;
  padding-left: 1.5rem;
}

.password-requirements li {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-summary {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.profile-summary h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.card-content h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.card-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .manager-profile {
    padding: 1rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>