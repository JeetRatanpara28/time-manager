<script setup>
import { ref, onMounted, watch } from 'vue';
import GmOverview from '@/components/gm/GmOverview.vue';
import ClockAnalytics from '@/components/gm/ClockAnalytics.vue';
import UserManagement from '@/components/gm/UserManagement.vue';
import StatusMonitor from '@/components/gm/StatusMonitor.vue';
import DailyLogs from '@/components/gm/DailyLogs.vue';
import ProfileManagement from '@/components/gm/ProfileManagement.vue';
import TimeAnalysis from '@/components/gm/TimeAnalysis.vue';
import ManagerOverview from '@/components/manager/ManagerOverview.vue';
import ManagerMonitoring from '@/components/manager/ManagerMonitoring.vue';
import ManagerAnalytics from '@/components/manager/ManagerAnalytics.vue';
import ManagerProfile from '@/components/manager/ManagerProfile.vue';
import ManagerLogs from '@/components/manager/ManagerLogs.vue';
import TeamManagement from '@/components/manager/TeamManagement.vue';
import EmployeeOverview from '@/components/employee/EmployeeOverview.vue';
import EmployeeClock from '@/components/employee/EmployeeClock.vue';
import EmployeeLogs from '@/components/employee/EmployeeLogs.vue';
import Login from '@/components/Login.vue';
// Universal ClockControl for all roles
import ClockControl from '@/components/shared/ClockControl.vue';
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

// Navigation state
const activePanel = ref('gm');
const activeGmView = ref('overview');
const activeManagerView = ref('monitoring');
const activeEmployeeView = ref('overview');

// Helper function to normalize role names
const normalizeRole = (role) => {
  const roleMap = {
    'general_manager': 'gm',
    'gm': 'gm',
    'manager': 'manager',
    'employee': 'employee'
  };
  return roleMap[role] || role;
};

// Update URL
const updateUrl = () => {
  const panel = activePanel.value;
  let path = `/${panel}`;

  if (panel === 'gm' && activeGmView.value !== 'overview') {
    path += `/${activeGmView.value}`;
  } else if (panel === 'manager' && activeManagerView.value !== 'monitoring') {
    path += `/${activeManagerView.value}`;
  } else if (panel === 'employee' && activeEmployeeView.value !== 'overview') {
    path += `/${activeEmployeeView.value}`;
  }

  window.history.replaceState(null, '', path);
};

// Watch for navigation changes
watch(activePanel, () => updateUrl());
watch(activeGmView, () => updateUrl());
watch(activeManagerView, () => updateUrl());
watch(activeEmployeeView, () => updateUrl());

// Initialize on mount
onMounted(async () => {
  await initializeAuth();

  if (isAuthenticated.value && currentUser.value) {
    const userRole = normalizeRole(currentUser.value.role);

    // Set appropriate panel based on role
    if (userRole === 'gm') {
      activePanel.value = 'gm';
      await initializeData();
    } else if (userRole === 'manager') {
      activePanel.value = 'manager';
      await initializeManagerData();
    } else if (userRole === 'employee') {
      activePanel.value = 'employee';
      await initializeEmployeeData();
    }
  }
});

// Navigation items
const gmNavItems = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'clock', label: 'Clock Control', icon: '⏰' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'status', label: 'Status Monitor', icon: '📡' },
  { id: 'logs', label: 'Daily Logs', icon: '📋' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'analysis', label: 'Time Analysis', icon: '📈' }
];

const managerNavItems = [
  { id: 'monitoring', label: 'Employee Monitoring', icon: '👁️' },
  { id: 'team', label: 'Employee Management', icon: '👥' },
  { id: 'logs', label: 'Activity Logs', icon: '📋' },
  { id: 'analytics', label: 'My Analytics', icon: '📊' },
  { id: 'clock', label: 'Clock Controls', icon: '⏰' },
  { id: 'profile', label: 'My Profile', icon: '👤' }
];

const employeeNavItems = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'clock', label: 'Time Clock', icon: '⏰' },
  { id: 'logs', label: 'My Logs', icon: '📋' }
];

// Handle panel switching
const switchToPanel = async (panel) => {
  if (!isAuthenticated.value) return;

  const userRole = normalizeRole(currentUser.value?.role);
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
    await initializeManagerData();
  } else if (panel === 'employee') {
    await initializeEmployeeData();
  } else if (panel === 'gm') {
    await initializeData();
  }
};

// Handle logout
const handleLogout = async () => {
  try {
    await logout();
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
    }
  } catch (err) {
    console.error('Logout failed:', err);
  }
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
            v-if="normalizeRole(currentUser?.role) === 'gm'"
            :class="['tab', { active: activePanel === 'gm' }]"
            @click="switchToPanel('gm')"
          >
            GM Dashboard
          </button>
          <button
            v-if="normalizeRole(currentUser?.role) === 'manager'"
            :class="['tab', { active: activePanel === 'manager' }]"
            @click="switchToPanel('manager')"
          >
            Manager Dashboard
          </button>
          <button
            v-if="normalizeRole(currentUser?.role) === 'employee'"
            :class="['tab', { active: activePanel === 'employee' }]"
            @click="switchToPanel('employee')"
          >
            Employee Dashboard
          </button>
        </nav>

        <div class="auth-controls">
          <button v-if="isAuthenticated" class="logout-btn" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="app-content">
      <!-- Login Page -->
      <Login v-if="!isAuthenticated" />

      <!-- GM Dashboard -->
      <section v-else-if="isAuthenticated && normalizeRole(currentUser?.role) === 'gm'" class="panel gm-panel">
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

        <div class="gm-content">
          <GmOverview v-if="activeGmView === 'overview'" :activeGmView="activeGmView" @update:activeGmView="activeGmView = $event" />
          <ClockControl v-if="activeGmView === 'clock'" user-role="gm" />
          <ClockAnalytics v-if="activeGmView === 'analytics'" />
          <UserManagement v-if="activeGmView === 'users'" />
          <StatusMonitor v-if="activeGmView === 'status'" />
          <DailyLogs v-if="activeGmView === 'logs'" />
          <ProfileManagement v-if="activeGmView === 'profile'" />
          <TimeAnalysis v-if="activeGmView === 'analysis'" />
        </div>
      </section>

      <!-- Manager Dashboard -->
      <section v-else-if="isAuthenticated && normalizeRole(currentUser?.role) === 'manager'" class="panel manager-panel">
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

        <div class="manager-content">
          <ManagerMonitoring v-if="activeManagerView === 'monitoring'" />
          <TeamManagement v-if="activeManagerView === 'team'" />
          <ManagerLogs v-if="activeManagerView === 'logs'" />
          <ManagerAnalytics v-if="activeManagerView === 'analytics'" />
          <ClockControl v-if="activeManagerView === 'clock'" user-role="manager" />
          <ManagerProfile v-if="activeManagerView === 'profile'" />
        </div>
      </section>

      <!-- Employee Dashboard -->
      <section v-else-if="isAuthenticated && normalizeRole(currentUser?.role) === 'employee'" class="panel employee-panel">
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

.logout-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #dc2626;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #b91c1c;
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
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gm-nav, .manager-nav, .employee-nav {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
}

.gm-nav-item, .manager-nav-item, .employee-nav-item {
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

.gm-nav-item:hover, .manager-nav-item:hover, .employee-nav-item:hover {
  background: #e2e8f0;
  color: #475569;
}

.gm-nav-item.active {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.manager-nav-item.active {
  background: linear-gradient(135deg, #059669, #0f766e);
  color: white;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.employee-nav-item.active {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-weight: 500;
}

.gm-content, .manager-content, .employee-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1.5rem 1rem 1rem;
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

  .gm-nav, .manager-nav, .employee-nav {
    padding: 0.25rem;
    gap: 0.125rem;
  }

  .gm-nav-item, .manager-nav-item, .employee-nav-item {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .nav-icon {
    font-size: 1rem;
  }
}
</style>