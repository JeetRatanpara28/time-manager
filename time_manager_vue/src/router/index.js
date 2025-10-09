import { createRouter, createWebHistory } from 'vue-router';

// Use dynamic imports for components to avoid circular dependencies
const Login = () => import('@/components/Login.vue');
const GmOverview = () => import('@/components/gm/GmOverview.vue');
const ManagerOverview = () => import('@/components/manager/ManagerOverview.vue');
const EmployeeOverview = () => import('@/components/employee/EmployeeOverview.vue');

// Lazy load the auth store to avoid circular dependencies
let authStore = null;
const getAuthStore = async () => {
  if (!authStore) {
    authStore = await import('@/composables/useAuthStore.js');
  }
  return authStore;
};

// Initialize auth state when router is created
let isAuthInitialized = false;
const initializeAuth = async () => {
  if (!isAuthInitialized) {
    const store = await getAuthStore();
    await store.initializeAuth();
    isAuthInitialized = true;
  }
};

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/gm',
    name: 'gm',
    component: GmOverview,
    meta: { requiresAuth: true, roles: ['gm', 'general_manager'] }
  },
  {
    path: '/gm/:view',
    name: 'gm-view',
    component: GmOverview,
    meta: { requiresAuth: true, roles: ['gm', 'general_manager'] },
    beforeEnter: (to, from, next) => {
      const validViews = ['overview', 'clock', 'analytics', 'users', 'status', 'logs', 'profile', 'analysis'];
      if (validViews.includes(to.params.view)) {
        next();
      } else {
        next('/gm');
      }
    }
  },
  {
    path: '/manager',
    name: 'manager',
    component: ManagerOverview,
    meta: { requiresAuth: true, roles: ['manager', 'gm', 'general_manager'] }
  },
  {
    path: '/manager/:view',
    name: 'manager-view',
    component: ManagerOverview,
    meta: { requiresAuth: true, roles: ['manager', 'gm', 'general_manager'] },
    beforeEnter: (to, from, next) => {
      const validViews = ['monitoring', 'team', 'logs', 'analytics', 'clock', 'profile'];
      if (validViews.includes(to.params.view)) {
        next();
      } else {
        next('/manager');
      }
    }
  },
  {
    path: '/employee',
    name: 'employee',
    component: EmployeeOverview,
    meta: { requiresAuth: true, roles: ['employee', 'manager', 'gm', 'general_manager'] }
  },
  {
    path: '/employee/:view',
    name: 'employee-view',
    component: EmployeeOverview,
    meta: { requiresAuth: true, roles: ['employee', 'manager', 'gm', 'general_manager'] },
    beforeEnter: (to, from, next) => {
      const validViews = ['overview', 'clock', 'logs'];
      if (validViews.includes(to.params.view)) {
        next();
      } else {
        next('/employee');
      }
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard for authentication and role-based access control
router.beforeEach(async (to, from, next) => {
  console.log('🛣️ Router guard triggered:', {
    to: to.path,
    requiresAuth: to.meta?.requiresAuth,
    isAuthInitialized,
    isAuthenticated: null,
    hasUser: null
  });

  // Ensure auth is initialized
  if (!isAuthInitialized) {
    await initializeAuth();
  }

  // Get the auth store
  const store = await getAuthStore();
  const { isAuthenticated, currentUser, isAuthInitialized: authInitialized } = store;

  // Wait for auth to be initialized
  if (!authInitialized.value) {
    console.log('⏳ Waiting for auth initialization...');
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (authInitialized.value) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  console.log('🔐 Auth check:', {
    requiresAuth: to.meta?.requiresAuth,
    isAuthenticated: isAuthenticated?.value,
    requiredRoles: to.meta?.roles,
    userRole: currentUser?.value?.role
  });

  // Handle login route
  if (to.name === 'login') {
    if (isAuthenticated?.value) {
      // Map roles for redirect
      const roleRoutes = {
        'gm': '/gm',
        'general_manager': '/gm',
        'manager': '/manager',
        'employee': '/employee'
      };
      const redirectPath = roleRoutes[currentUser?.value?.role] || '/';
      console.log(`🔄 Already authenticated, redirecting from login to ${redirectPath}`);
      return next(redirectPath);
    }
    return next();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRoles = to.meta?.roles;

  // Check authentication
  if (requiresAuth && !isAuthenticated?.value) {
    console.log('🚫 Not authenticated, redirecting to login');
    if (to.path !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', to.fullPath);
    }
    return next('/login');
  }

  // Check roles if required
  if (requiresAuth && requiredRoles && currentUser?.value) {
    const userRole = currentUser.value.role;
    if (!requiredRoles.includes(userRole)) {
      console.log('🚫 Insufficient permissions, redirecting to appropriate dashboard');
      // Redirect to appropriate dashboard based on user role
      const roleRoutes = {
        'gm': '/gm',
        'general_manager': '/gm',
        'manager': '/manager',
        'employee': '/employee'
      };
      const redirectPath = roleRoutes[userRole] || '/';
      return next(redirectPath);
    }
  }

  console.log('✅ Allowing navigation to:', to.path);
  next();
});

export default router;