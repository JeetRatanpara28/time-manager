import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/components/Login.vue';
import GmOverview from '@/components/gm/GmOverview.vue';
import ManagerOverview from '@/components/manager/ManagerOverview.vue';
import EmployeeOverview from '@/components/employee/EmployeeOverview.vue';
import { isAuthenticated, currentUser, isAuthInitialized } from '@/composables/useAuthStore.js';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/gm',
    name: 'GM Dashboard',
    component: GmOverview,
    meta: { requiresAuth: true, roles: ['gm'] }
  },
  {
    path: '/gm/:view',
    name: 'GM Dashboard View',
    component: GmOverview,
    meta: { requiresAuth: true, roles: ['gm'] },
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
    name: 'Manager Dashboard',
    component: ManagerOverview,
    meta: { requiresAuth: true, roles: ['manager', 'gm'] }
  },
  {
    path: '/manager/:view',
    name: 'Manager Dashboard View',
    component: ManagerOverview,
    meta: { requiresAuth: true, roles: ['manager', 'gm'] },
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
    name: 'Employee Dashboard',
    component: EmployeeOverview,
    meta: { requiresAuth: true, roles: ['employee', 'manager', 'gm'] }
  },
  {
    path: '/employee/:view',
    name: 'Employee Dashboard View',
    component: EmployeeOverview,
    meta: { requiresAuth: true, roles: ['employee', 'manager', 'gm'] },
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
    requiresAuth: to.matched.some(record => record.meta.requiresAuth),
    isAuthInitialized: isAuthInitialized.value,
    isAuthenticated: isAuthenticated.value,
    hasUser: !!currentUser.value
  });

  // Wait for auth initialization to complete before checking guards
  if (!isAuthInitialized.value) {
    console.log('⏳ Waiting for auth initialization...');
    await new Promise(resolve => {
      const checkAuthInitialized = () => {
        if (isAuthInitialized.value) {
          console.log('✅ Auth initialization complete, proceeding with guard check');
          resolve();
        } else {
          setTimeout(checkAuthInitialized, 10);
        }
      };
      checkAuthInitialized();
    });
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiredRoles = to.meta?.roles;

  console.log('🔐 Auth check:', {
    requiresAuth,
    isAuthenticated: isAuthenticated.value,
    requiredRoles,
    userRole: currentUser.value?.role
  });

  if (requiresAuth && !isAuthenticated.value) {
    console.log('🚫 Not authenticated, redirecting to login');
    // Store the attempted route for redirect after login
    if (to.path !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', to.path);
    }
    // Redirect to login if not authenticated
    next('/login');
    return;
  }

  if (requiresAuth && requiredRoles && currentUser.value) {
    const userRole = currentUser.value.role;
    if (!requiredRoles.includes(userRole)) {
      console.log('🚫 Wrong role, redirecting to appropriate dashboard');
      // Redirect to appropriate dashboard based on user role
      const roleRoutes = {
        'gm': '/gm',
        'manager': '/manager',
        'employee': '/employee'
      };
      const redirectPath = roleRoutes[userRole] || '/login';
      next(redirectPath);
      return;
    }
  }

  console.log('✅ Allowing navigation to:', to.path);
  next();
});

export default router;
