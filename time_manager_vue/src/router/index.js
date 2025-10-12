import { createRouter, createWebHistory } from 'vue-router';

// Lazy load components
const Login = () => import('@/components/Login.vue');
const EmployeeDashboard = () => import('@/components/employee/EmployeeClock.vue');
const ManagerDashboard = () => import('@/components/manager/ManagerOverview.vue');
const GMDashboard = () => import('@/components/gm/GmOverview.vue');

// Helper to normalize roles
const normalizeRole = (role) => {
  const roleMap = {
    'general_manager': 'gm',
    'gm': 'gm',
    'manager': 'manager',
    'employee': 'employee'
  };
  return roleMap[role?.toLowerCase()] || role;
};

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/gm/:view?',
    name: 'gm',
    component: GMDashboard,
    meta: { requiresAuth: true, roles: ['gm'] }
  },
  {
    path: '/manager/:view?',
    name: 'manager',
    component: ManagerDashboard,
    meta: { requiresAuth: true, roles: ['manager'] }
  },
  {
    path: '/employee/:view?',
    name: 'employee',
    component: EmployeeDashboard,
    meta: { requiresAuth: true, roles: ['employee'] }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  // Lazy load auth store
  const authStore = await import('@/composables/useAuthStore.js');
  const { isAuthenticated, currentUser, isAuthInitialized } = authStore;

  // Wait for auth initialization
  if (!isAuthInitialized.value) {
    await authStore.initializeAuth();
  }

  console.log('🛣️ Router guard:', {
    to: to.path,
    isAuthenticated: isAuthenticated.value,
    userRole: currentUser.value?.role
  });

  // Allow login page
  if (to.path === '/login') {
    if (isAuthenticated.value && currentUser.value) {
      const role = normalizeRole(currentUser.value.role);
      return next(`/${role}`);
    }
    return next();
  }

  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    console.log('🚫 Not authenticated, redirecting to login');
    return next('/login');
  }

  // Check roles
  if (to.meta.roles && currentUser.value) {
    const userRole = normalizeRole(currentUser.value.role);
    const allowedRoles = to.meta.roles.map(r => normalizeRole(r));
    
    if (!allowedRoles.includes(userRole)) {
      console.log('🚫 Wrong role, redirecting to correct dashboard');
      return next(`/${userRole}`);
    }
  }

  next();
});

export default router;