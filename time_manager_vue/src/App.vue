<script setup>
import { ref, onMounted, watch } from 'vue';
import GmOverview from '@/components/gm/GmOverview.vue';
import ClockControl from '@/components/gm/ClockControl.vue';
import ClockAnalytics from '@/components/gm/ClockAnalytics.vue';
import UserManagement from '@/components/gm/UserManagement.vue';
import StatusMonitor from '@/components/gm/StatusMonitor.vue';
import DailyLogs from '@/components/gm/DailyLogs.vue';
import ProfileManagement from '@/components/gm/ProfileManagement.vue';
import TimeAnalysis from '@/components/gm/TimeAnalysis.vue';
import ManagerOverview from '@/components/manager/ManagerOverview.vue';
import ManagerClockControl from '@/components/manager/ManagerClockControl.vue';
import ManagerMonitoring from '@/components/manager/ManagerMonitoring.vue';
import ManagerAnalytics from '@/components/manager/ManagerAnalytics.vue';
import ManagerProfile from '@/components/manager/ManagerProfile.vue';
import ManagerLogs from '@/components/manager/ManagerLogs.vue';
import TeamManagement from '@/components/manager/TeamManagement.vue';
import EmployeeOverview from '@/components/employee/EmployeeOverview.vue';
import EmployeeClock from '@/components/employee/EmployeeClock.vue';
import EmployeeLogs from '@/components/employee/EmployeeLogs.vue';
import Login from '@/components/Login.vue';
import { initializeData } from '@/composables/useGmStore.js';
import { initializeManagerData } from '@/composables/useManagerStore.js';
import { initializeEmployeeData } from '@/composables/useEmployeeStore.js';
import {
  isAuthenticated,
  currentUser,
  logout,
  initializeAuth,
  getUserRoleDisplay,
  isAuthInitialized
} from '@/composables/useAuthStore.js';

// Navigation state with persistence
const activePanel = ref('gm');
const activeGmView = ref('overview');
const activeManagerView = ref('monitoring'); // Default to monitoring for manager
const activeEmployeeView = ref('overview');

// URL Routing System
const updateUrl = () => {
  const panel = activePanel.value;
  const gmView = activeGmView.value;
  const managerView = activeManagerView.value;
  const employeeView = activeEmployeeView.value;

  let path = `/${panel}`;

  if (panel === 'gm' && gmView !== 'overview') {
    path += `/${gmView}`;
  } else if (panel === 'manager' && managerView !== 'monitoring') {
    path += `/${managerView}`;
  } else if (panel === 'employee' && employeeView !== 'overview') {
    path += `/${employeeView}`;
  }

  // Update URL without triggering navigation
  window.history.replaceState(null, '', path);
};

// Load navigation state from URL
const loadFromUrl = () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  if (segments.length > 0) {
    const panel = segments[0];
    if (['gm', 'manager', 'employee'].includes(panel)) {
      activePanel.value = panel;

      if (segments.length > 1) {
        const view = segments[1];
        if (panel === 'gm' && ['overview', 'clock', 'analytics', 'users', 'status', 'logs', 'profile', 'analysis'].includes(view)) {
          activeGmView.value = view;
        } else if (panel === 'manager' && ['monitoring', 'team', 'logs', 'analytics', 'clock', 'profile'].includes(view)) {
          activeManagerView.value = view;
        } else if (panel === 'employee' && ['overview', 'clock', 'logs'].includes(view)) {
          activeEmployeeView.value = view;
        }
      } else {
        // Default views when no specific view is specified
        if (panel === 'gm') {
          activeGmView.value = 'overview';
        } else if (panel === 'manager') {
          activeManagerView.value = 'monitoring';
        } else if (panel === 'employee') {
          activeEmployeeView.value = 'overview';
        }
      }
    }
  }
};

// Handle browser back/forward navigation
const handlePopState = () => {
  loadFromUrl();
};

// Initialize routing
const initializeRouting = () => {
  // Load initial state from URL
  loadFromUrl();

  // Listen for browser navigation
  window.addEventListener('popstate', handlePopState);
};

// Load saved navigation state on app start
const loadSavedState = () => {
  try {
    const savedPanel = localStorage.getItem('activePanel');
    const savedGmView = localStorage.getItem('activeGmView');
    const savedManagerView = localStorage.getItem('activeManagerView');
    const savedEmployeeView = localStorage.getItem('activeEmployeeView');

    if (savedPanel && ['gm', 'manager', 'employee'].includes(savedPanel)) {
      activePanel.value = savedPanel;
    }

    if (savedGmView && ['overview', 'clock', 'analytics', 'users', 'status', 'logs', 'profile', 'analysis'].includes(savedGmView)) {
      activeGmView.value = savedGmView;
    }

    if (savedManagerView && ['monitoring', 'team', 'logs', 'analytics', 'clock', 'profile'].includes(savedManagerView)) {
      activeManagerView.value = savedManagerView;
    }

    if (savedEmployeeView && ['overview', 'clock', 'logs'].includes(savedEmployeeView)) {
      activeEmployeeView.value = savedEmployeeView;
    }
  } catch (error) {
    console.warn('Failed to load saved navigation state:', error);
  }
};

// Save navigation state to localStorage
const saveState = () => {
  try {
    localStorage.setItem('activePanel', activePanel.value);
    localStorage.setItem('activeGmView', activeGmView.value);
    localStorage.setItem('activeManagerView', activeManagerView.value);
    localStorage.setItem('activeEmployeeView', activeEmployeeView.value);
  } catch (error) {
    console.warn('Failed to save navigation state:', error);
  }
};

// Watch for navigation changes and save state + update URL
watch(activePanel, () => {
  saveState();
  updateUrl();
});
watch(activeGmView, () => {
  saveState();
  updateUrl();
});
watch(activeManagerView, () => {
  saveState();
  updateUrl();
});
watch(activeEmployeeView, () => {
  saveState();
  updateUrl();
});

// Initialize auth state and load saved navigation state when app starts
onMounted(async () => {
  // Initialize authentication state first
  initializeAuth();

  // Initialize routing first
  initializeRouting();

  // Then load from localStorage as fallback
  loadSavedState();

  // If user is authenticated, set the correct dashboard based on their role
  if (isAuthenticated.value && currentUser.value) {
    const userRole = currentUser.value.role;

    // Define allowed panels for each role
    const allowedPanels = {
      'gm': ['gm'],
      'manager': ['manager'],
      'employee': ['employee']
    };

    // Check if current activePanel is allowed for this user's role
    const userAllowedPanels = allowedPanels[userRole] || [];
    if (!userAllowedPanels.includes(activePanel.value)) {
      // Set to the first allowed panel for this role
      activePanel.value = userAllowedPanels[0] || 'gm';
    }

    // Set the appropriate panel based on user role
    if (userRole === 'gm' && activePanel.value !== 'gm') {
      activePanel.value = 'gm';
      activeGmView.value = 'overview';
    } else if (userRole === 'manager' && activePanel.value !== 'manager') {
      activePanel.value = 'manager';
      activeManagerView.value = 'monitoring';
    } else if (userRole === 'employee' && activePanel.value !== 'employee') {
      activePanel.value = 'employee';
      activeEmployeeView.value = 'overview';
    }

    // Initialize data for their role
    if (userRole === 'gm') {
      await initializeData();
    } else if (userRole === 'manager') {
      await initializeManagerData();
    } else if (userRole === 'employee') {
      await initializeEmployeeData();
    }
  }
});

// Navigation items for GM dashboard
const gmNavItems = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'clock', label: 'Clock Control', icon: '⏰' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'status', label: 'Status Monitor', icon: '📍' },
  { id: 'logs', label: 'Daily Logs', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'analysis', label: 'Time Analysis', icon: '📈' }
];

// Navigation items for Manager dashboard
const managerNavItems = [
  { id: 'monitoring', label: 'Employee Monitoring', icon: '👁️' },
  { id: 'team', label: 'Employee Management', icon: '👥' },
  { id: 'logs', label: 'Activity Logs', icon: '📋' },
  { id: 'analytics', label: 'My Analytics', icon: '📊' },
  { id: 'clock', label: 'Clock Controls', icon: '⏰' },
  { id: 'profile', label: 'My Profile', icon: '👤' }
];

// Navigation items for Employee dashboard
const employeeNavItems = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'clock', label: 'Time Clock', icon: '⏰' },
  { id: 'logs', label: 'My Logs', icon: '📋' }
];

// Handle panel switching
const switchToPanel = async (panel) => {
  // If user is not authenticated, redirect to login
  if (!isAuthenticated.value) {
    return;
  }

  // Check if user has permission to access this panel
  const userRole = currentUser.value?.role;
  const allowedPanels = {
    'gm': ['gm'],
    'manager': ['manager'],
    'employee': ['employee']
  };

  if (!allowedPanels[userRole]?.includes(panel)) {
    console.warn(`User with role ${userRole} attempted to access ${panel} dashboard`);
    return;
  }

  activePanel.value = panel;

  if (panel === 'manager') {
    // Only set default view if no saved state exists
    if (!localStorage.getItem('activeManagerView')) {
      activeManagerView.value = 'monitoring';
    }
    // Load manager data when switching to manager panel
    await initializeManagerData();
  } else if (panel === 'employee') {
    // Only set default view if no saved state exists
    if (!localStorage.getItem('activeEmployeeView')) {
      activeEmployeeView.value = 'overview';
    }
    // Load employee data when switching to employee panel
    await initializeEmployeeData();
  } else if (panel === 'gm') {
    // Only set default view if no saved state exists
    if (!localStorage.getItem('activeGmView')) {
      activeGmView.value = 'overview';
    }
    await initializeData();
  }

  // URL and state are automatically updated via watchers
};

// Handle logout
const handleLogout = async () => {
  try {
    await logout();

    // Reset navigation state based on role permissions
    const userRole = currentUser.value?.role;
    if (userRole === 'gm') {
      activePanel.value = 'gm';
      activeGmView.value = 'overview';
    } else if (userRole === 'manager') {
      activePanel.value = 'manager';
      activeManagerView.value = 'monitoring';
    } else if (userRole === 'employee') {
      activePanel.value = 'employee';
      activeEmployeeView.value = 'overview';
    } else {
      // Fallback for unknown roles
      activePanel.value = 'gm';
      activeGmView.value = 'overview';
    }
  } catch (err) {
    console.error('Logout failed:', err);
  }
};

// Clear localStorage for testing
const clearStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <h1>Time Manager Pro</h1>
        <div v-if="isAuthenticated && currentUser" class="user-info">
          <span class="user-name">{{ currentUser.name }}</span>
          <span class="user-role">({{ getUserRoleDisplay }})</span>
        </div>
      </div>

      <div class="header-right">
        <nav v-if="isAuthenticated" class="tabs">
          <button
            v-if="currentUser?.role === 'gm'"
            :class="['tab', { active: activePanel === 'gm' }]"
            @click="switchToPanel('gm')"
            :disabled="!isAuthenticated"
          >
            GM Dashboard
          </button>
          <button
            v-if="currentUser?.role === 'manager'"
            :class="['tab', { active: activePanel === 'manager' }]"
            @click="switchToPanel('manager')"
            :disabled="!isAuthenticated"
          >
            Manager Dashboard
          </button>
          <button
            v-if="currentUser?.role === 'employee'"
            :class="['tab', { active: activePanel === 'employee' }]"
            @click="switchToPanel('employee')"
            :disabled="!isAuthenticated"
          >
            Employee Dashboard
          </button>
        </nav>

        <div class="auth-controls">
          <div v-if="!isAuthenticated" class="debug-info">
            <small>Auth State: {{ isAuthenticated ? '✅' : '❌' }} | Init: {{ isAuthInitialized ? '✅' : '⏳' }}</small>
            <button @click="clearStorage" class="clear-btn">Clear Storage</button>
          </div>
          <button v-if="!isAuthenticated" class="login-btn" @click="$router.push('/login')">
            Login
          </button>
          <button v-else class="logout-btn" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="app-content">
      <!-- Show login page if not authenticated -->
      <Login v-if="!isAuthenticated" />

      <!-- Show dashboard if authenticated -->
      <section v-else-if="isAuthenticated && currentUser?.role === 'gm'" class="panel gm-panel">
        <!-- GM Navigation -->
        <nav class="gm-nav">
          <button
            v-for="item in gmNavItems"
            :key="item.id"
            :class="['gm-nav-item', { active: activeGmView === item.id }]"
            @click="activeGmView = item.id"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <!-- GM Content -->
        <div class="gm-content">
          <GmOverview
            v-if="activeGmView === 'overview'"
            :activeGmView="activeGmView"
            @update:activeGmView="activeGmView = $event"
          />
          <ClockControl v-if="activeGmView === 'clock'" />
          <ClockAnalytics v-if="activeGmView === 'analytics'" />
          <UserManagement v-if="activeGmView === 'users'" />
          <StatusMonitor v-if="activeGmView === 'status'" />
          <DailyLogs v-if="activeGmView === 'logs'" />
          <ProfileManagement v-if="activeGmView === 'profile'" />
          <TimeAnalysis v-if="activeGmView === 'analysis'" />
        </div>
      </section>

      <section v-else-if="isAuthenticated && currentUser?.role === 'manager'" class="panel manager-panel">
        <!-- Manager Navigation -->
        <nav class="manager-nav">
          <button
            v-for="item in managerNavItems"
            :key="item.id"
            :class="['manager-nav-item', { active: activeManagerView === item.id }]"
            @click="activeManagerView = item.id"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <!-- Manager Content -->
        <div class="manager-content">
          <ManagerMonitoring v-if="activeManagerView === 'monitoring'" />
          <TeamManagement v-if="activeManagerView === 'team'" />
          <ManagerLogs v-if="activeManagerView === 'logs'" />
          <ManagerAnalytics v-if="activeManagerView === 'analytics'" />
          <ManagerClockControl v-if="activeManagerView === 'clock'" />
          <ManagerProfile v-if="activeManagerView === 'profile'" />
        </div>
      </section>

      <section v-else-if="isAuthenticated && currentUser?.role === 'employee'" class="panel employee-panel">
        <!-- Employee Navigation -->
        <nav class="employee-nav">
          <button
            v-for="item in employeeNavItems"
            :key="item.id"
            :class="['employee-nav-item', { active: activeEmployeeView === item.id }]"
            @click="activeEmployeeView = item.id"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <!-- Employee Content -->
        <div class="employee-content">
          <EmployeeOverview v-if="activeEmployeeView === 'overview'" @navigate="activeEmployeeView = $event" />
          <EmployeeClock v-if="activeEmployeeView === 'clock'" />
          <EmployeeLogs v-if="activeEmployeeView === 'logs'" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Inter", system-ui, sans-serif;
  background: #f1f5f9;
  color: #0f172a;
}

.app-header {
  padding: 2rem 1.5rem 1rem;
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.user-name {
  font-weight: 600;
  color: #1e293b;
}

.debug-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
}

.clear-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ef4444;
  border-radius: 4px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.clear-btn:hover {
  background: #fecaca;
  border-color: #b91c1c;
}

.auth-controls {
  display: flex;
  align-items: center;
}

.logout-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.logout-btn {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.logout-btn:hover {
  background: #b91c1c;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tab {
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: white;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1d4ed8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
}

.tab.active {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  border-color: transparent;
}

.app-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem 1.5rem 3rem;
}

.panel {
  width: min(1400px, 100%);
  background: white;
  border-radius: 24px;
  padding: 0;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.25);
  overflow: hidden;
}

.gm-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gm-nav {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
}

.gm-nav-item {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

.gm-nav-item:hover {
  background: #e2e8f0;
  color: #475569;
}

.gm-nav-item.active {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-weight: 500;
}

.gm-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.manager-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.manager-nav {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
}

.manager-nav-item {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

.manager-nav-item:hover {
  background: #e2e8f0;
  color: #475569;
}

.manager-nav-item.active {
  background: linear-gradient(135deg, #059669, #0f766e);
  color: white;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.employee-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.employee-nav {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
}

.employee-nav-item {
  flex: 1;
  padding: 0.75rem 0.5rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

.employee-nav-item:hover {
  background: #e2e8f0;
  color: #475569;
}

.employee-nav-item.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.employee-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-header {
    padding: 1.5rem 1rem 1rem;
  }

  .app-header h1 {
    font-size: 1.5rem;
  }

  .tabs {
    gap: 0.5rem;
  }

  .tab {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .app-content {
    padding: 1rem;
  }

  .gm-nav,
  .manager-nav,
  .employee-nav {
    padding: 0.25rem;
    gap: 0.125rem;
  }

  .gm-nav-item,
  .manager-nav-item,
  .employee-nav-item {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .nav-icon {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .gm-nav,
  .manager-nav,
  .employee-nav {
    flex-wrap: wrap;
  }

  .gm-nav-item,
  .manager-nav-item,
  .employee-nav-item {
    min-width: calc(50% - 0.125rem);
  }
}
</style>
