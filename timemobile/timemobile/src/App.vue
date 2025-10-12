<script setup>
import { ref, onMounted, watch, computed } from "vue";
import Login from "@/components/auth/Login.vue";
import Register from "@/components/auth/Register.vue";
import Profile from "@/components/common/Profile.vue";
import TasksList from "@/components/common/TasksList.vue";
import TaskDetail from "@/components/common/TaskDetail.vue";
import ClockControl from "@/components/employee/ClockControl.vue";
import UserManagement from "@/components/manager/UserManagement.vue";
import UserDetail from "@/components/manager/UserDetail.vue";
import SkillsManagement from "@/components/manager/SkillsManagement.vue";
import { initializeTimeData } from "@/composables/useTimeStore.js";
import {
  isAuthenticated,
  user as currentUser,
  logout,
  initializeAuth,
  userRole,
} from "@/store/authStore.js";

// Navigation state
const activeView = ref("clock");
const showLogin = ref(true);

// Computed: Get role display name
const userRoleDisplay = computed(() => {
  if (!currentUser.value) return "";
  const role = userRole.value;
  const displayMap = {
    gm: "General Manager",
    manager: "Manager",
    employee: "Employee",
  };
  return displayMap[role] || "User";
});

// Navigation items based on role
const navItems = computed(() => {
  const role = userRole.value;
  
  if (role === "gm") {
    return [
      { id: "statistics", label: "Statistics", icon: "📊" },
      { id: "users", label: "User Management", icon: "👥" },
      { id: "tasks", label: "Tasks", icon: "📋" },
      { id: "profile", label: "Profile", icon: "👤" },
    ];
  } else if (role === "manager") {
    return [
      { id: "users", label: "Team Management", icon: "👥" },
      { id: "statistics", label: "Statistics", icon: "📊" },
      { id: "clock", label: "Clock", icon: "⏰" },
      { id: "tasks", label: "Tasks", icon: "📋" },
      { id: "profile", label: "Profile", icon: "👤" },
    ];
  } else {
    return [
      { id: "clock", label: "Time Clock", icon: "⏰" },
      { id: "tasks", label: "My Tasks", icon: "📋" },
      { id: "profile", label: "Profile", icon: "👤" },
    ];
  }
});

// Get default view based on role
const getDefaultView = (role) => {
  const defaults = {
    gm: "statistics",
    manager: "users",
    employee: "clock",
  };
  return defaults[role] || "clock";
};

// URL Routing System
const updateUrl = () => {
  const role = userRole.value;
  const view = activeView.value;
  const defaultView = getDefaultView(role);

  let path = `/${role}`;
  if (view !== defaultView) {
    path += `/${view}`;
  }

  window.history.replaceState(null, "", path);
};

// Load navigation state from URL
const loadFromUrl = () => {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);

  if (segments.length > 0) {
    const pathRole = segments[0];
    if (["gm", "manager", "employee"].includes(pathRole)) {
      if (segments.length > 1) {
        activeView.value = segments[1];
      } else {
        activeView.value = getDefaultView(pathRole);
      }
    }
  }
};

// Handle browser back/forward navigation
const handlePopState = () => {
  loadFromUrl();
};

// Save/Load state from localStorage
const saveState = () => {
  try {
    localStorage.setItem("activeView", activeView.value);
  } catch (error) {
    console.warn("Failed to save navigation state:", error);
  }
};

const loadSavedState = () => {
  try {
    const savedView = localStorage.getItem("activeView");
    if (savedView) {
      activeView.value = savedView;
    }
  } catch (error) {
    console.warn("Failed to load saved navigation state:", error);
  }
};

// Watch for navigation changes
watch(activeView, () => {
  saveState();
  if (isAuthenticated.value) {
    updateUrl();
  }
});

// Watch for authentication changes
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    showLogin.value = false;
    const role = userRole.value;
    activeView.value = getDefaultView(role);
    updateUrl();
  } else {
    showLogin.value = true;
  }
});

// Initialize app
onMounted(async () => {
  console.log("🚀 App.vue mounted");

  // Setup routing
  window.addEventListener("popstate", handlePopState);
  loadFromUrl();
  loadSavedState();

  // Initialize auth
  await initializeAuth();

  if (isAuthenticated.value && currentUser.value) {
    console.log("✅ User authenticated:", currentUser.value.email);
    showLogin.value = false;
    
    const role = userRole.value;
    activeView.value = getDefaultView(role);
    
    // Initialize time data
    await initializeTimeData();
    
    updateUrl();
  } else {
    console.log("⚠️ No authenticated user");
    showLogin.value = true;
  }
});

// Handle logout
const handleLogout = async () => {
  console.log("🚪 Logging out...");
  await logout();
  showLogin.value = true;
  activeView.value = "clock";
  window.history.replaceState(null, "", "/");
};

// Clear storage for debugging
const clearStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.reload();
};

// Toggle between login and register
const showRegister = ref(false);
const toggleAuthView = () => {
  showRegister.value = !showRegister.value;
};
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-left">
        <h1>⏰ Time Manager Pro</h1>
        <div v-if="isAuthenticated && currentUser" class="user-info">
          <span class="user-name">{{ currentUser.name || currentUser.email }}</span>
          <span class="user-role">({{ userRoleDisplay }})</span>
        </div>
      </div>

      <div class="header-right">
        <div class="auth-controls">
          <div v-if="!isAuthenticated" class="debug-info">
            <small>
              Auth: {{ isAuthenticated ? "✅" : "❌" }}
            </small>
            <button @click="clearStorage" class="clear-btn">
              Clear Storage
            </button>
          </div>
          <button v-else class="logout-btn" @click="handleLogout">
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="app-content">
      <!-- Show login/register if not authenticated -->
      <div v-if="!isAuthenticated" class="auth-container">
        <Login v-if="!showRegister" />
        <Register v-else />
        <div class="auth-toggle">
          <button @click="toggleAuthView" class="toggle-btn">
            {{ showRegister ? "Already have an account? Login" : "Don't have an account? Register" }}
          </button>
        </div>
      </div>

      <!-- Show dashboard if authenticated -->
      <section v-else class="panel dashboard-panel">
        <!-- Navigation -->
        <nav class="dashboard-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            :class="['nav-item', { active: activeView === item.id }]"
            @click="activeView = item.id"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>

        <!-- Content Area -->
        <div class="dashboard-content">
          <!-- Clock Control for Employee/Manager -->
          <ClockControl
            v-if="activeView === 'clock' && (userRole === 'employee' || userRole === 'manager')"
          />

          <!-- User Management for GM/Manager -->
          <UserManagement
            v-if="activeView === 'users' && (userRole === 'gm' || userRole === 'manager')"
          />

          <!-- Statistics/Charts for all roles -->
          <SkillsManagement v-if="activeView === 'statistics'" />

          <!-- Tasks List -->
          <TasksList v-if="activeView === 'tasks'" />

          <!-- Profile -->
          <Profile v-if="activeView === 'profile'" />

          <!-- User Detail (modal/overlay view) -->
          <UserDetail v-if="activeView === 'user-detail'" />

          <!-- Task Detail (modal/overlay view) -->
          <TaskDetail v-if="activeView === 'task-detail'" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #f1f5f9;
  color: #0f172a;
}

.app-header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.header-left h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
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

.user-role {
  color: #64748b;
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
  gap: 1rem;
}

.logout-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

.app-content {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem 1.5rem 3rem;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-toggle {
  text-align: center;
}

.toggle-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f8fafc;
}

.panel {
  width: min(1400px, 100%);
  background: white;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.dashboard-panel {
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.dashboard-nav {
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.5rem;
  gap: 0.25rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.dashboard-nav::-webkit-scrollbar {
  height: 6px;
}

.dashboard-nav::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.dashboard-nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.nav-item {
  flex: 1;
  min-width: 80px;
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
  font-weight: 500;
}

.nav-item:hover {
  background: #e2e8f0;
  color: #475569;
}

.nav-item.active {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.nav-icon {
  font-size: 1.3rem;
}

.nav-label {
  font-weight: 500;
  font-size: 0.75rem;
}

.dashboard-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: #fafbfc;
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-header {
    padding: 1.25rem 1rem;
  }

  .header-left h1 {
    font-size: 1.5rem;
  }

  .app-content {
    padding: 1.5rem 1rem;
  }

  .dashboard-nav {
    padding: 0.25rem;
    gap: 0.125rem;
  }

  .nav-item {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    min-width: 70px;
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  .nav-label {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 1rem;
  }

  .header-left h1 {
    font-size: 1.25rem;
  }

  .dashboard-nav {
    flex-wrap: wrap;
  }

  .nav-item {
    min-width: calc(33.333% - 0.125rem);
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .user-info {
    font-size: 0.8rem;
  }
}
</style>