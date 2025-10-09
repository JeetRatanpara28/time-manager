// JWT Authentication Store - Handles JWT tokens, login, logout, and user session management
import { ref, computed } from 'vue';
import router from '@/router';

// Authentication state
export const isAuthenticated = ref(false);
export const currentUser = ref(null);
export const authToken = ref(localStorage.getItem('authToken') || null);
export const refreshToken = ref(localStorage.getItem('refreshToken') || null);
export const isLoading = ref(false);
export const error = ref(null);
export const isAuthInitialized = ref(false); // Track if auth initialization is complete

// Token expiration check
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (err) {
    return true;
  }
};

// Check if token needs refresh (within 5 minutes of expiry)
const shouldRefreshToken = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const fiveMinutes = 5 * 60; // 5 minutes in seconds
    return (payload.exp - currentTime) < fiveMinutes;
  } catch (err) {
    return false;
  }
};

// Map backend role names to frontend role names
const mapBackendRoleToFrontend = (backendRole) => {
  const roleMap = {
    'general_manager': 'gm',
    'manager': 'manager',
    'employee': 'employee'
  };
  return roleMap[backendRole] || backendRole;
};

// Authentication functions
export const login = async (email, password) => {
  isLoading.value = true;
  error.value = null;

  try {
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();

    const response = await apiService.authenticateUser({
      email: email,
      password: password
    });

    console.log('🔑 Login response:', response);

    if (response.token && response.refreshToken) {
      console.log('✅ Login successful, saving auth state');

      // Store tokens
      authToken.value = response.token;
      refreshToken.value = response.refreshToken;

      // Store current user info - map backend role to frontend role
      currentUser.value = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: mapBackendRoleToFrontend(response.user.role),
        department: response.user.department
      };

      isAuthenticated.value = true;

      // Store in localStorage for persistence
      localStorage.setItem('authToken', authToken.value);
      localStorage.setItem('refreshToken', refreshToken.value);
      localStorage.setItem('currentUser', JSON.stringify(currentUser.value));

      console.log('💾 Auth state saved to localStorage:', {
        hasToken: !!localStorage.getItem('authToken'),
        hasUser: !!localStorage.getItem('currentUser')
      });

      // Set up token refresh timer
      setupTokenRefresh();

      // Update API service with the new token
      const { getApiService } = await import('@/services/apiService.js');
      const apiServiceInstance = getApiService();
      apiServiceInstance.setAuthToken(authToken.value);

      return { success: true, user: currentUser.value };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    console.error('❌ Login failed:', err);
    error.value = err.message || 'Login failed. Please check your credentials.';
    return { success: false, error: error.value };
  } finally {
    isLoading.value = false;
  }
};

export const logout = async () => {
  console.log('🚪 Logging out user...');
  isLoading.value = true;

  try {
    // Get API service and clear token
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();
    apiService.clearAuthToken();

    // Clear tokens and user data
    authToken.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    isAuthenticated.value = false;

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');

    // Clear any stored redirect path
    sessionStorage.removeItem('redirectAfterLogin');

    // Clear token refresh timer
    clearTokenRefresh();

    console.log('✅ Logout completed successfully');
    return { success: true };
  } catch (err) {
    console.error('❌ Logout failed:', err);
    return { success: false, error: err.message };
  } finally {
    isLoading.value = false;
  }
};

// Token refresh logic
let refreshTimer = null;

const setupTokenRefresh = () => {
  clearTokenRefresh();

  if (authToken.value && shouldRefreshToken(authToken.value)) {
    // Refresh token if it's close to expiry
    refreshTokenNow();
  }

  // Set up periodic check for token refresh
  refreshTimer = setInterval(async () => {
    if (authToken.value && shouldRefreshToken(authToken.value)) {
      await refreshTokenNow();
    }
  }, 60000); // Check every minute
};

const clearTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const refreshTokenNow = async () => {
  try {
    console.log('🔄 Attempting token refresh...');
    console.log('🔑 Current refresh token:', refreshToken.value ? 'present' : 'missing');

    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();

    const response = await apiService.refreshTokenWithToken(refreshToken.value);

    if (response.token && response.refreshToken) {
      console.log('✅ Token refresh successful');
      authToken.value = response.token;
      refreshToken.value = response.refreshToken;

      localStorage.setItem('authToken', authToken.value);
      localStorage.setItem('refreshToken', refreshToken.value);

      // Update API service with the new token
      apiService.setAuthToken(authToken.value);

      console.log('💾 New tokens saved to localStorage');
    } else {
      console.warn('⚠️ Refresh response missing tokens:', response);
      throw new Error('Invalid refresh response');
    }
  } catch (err) {
    console.error('❌ Token refresh failed:', err.message);

    // Clear invalid tokens and logout
    console.log('🧹 Clearing invalid tokens...');
    authToken.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    isAuthenticated.value = false;

    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');

    // Clear token from API service
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();
    apiService.clearAuthToken();

    // Don't redirect here, let the router guard handle it
    console.log('🚪 User will be redirected to login');
  }
};

// Initialize auth state from localStorage on app start
export const initializeAuth = async () => {
  console.log('🔄 Initializing auth state...');
  try {
    const savedToken = localStorage.getItem('authToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('currentUser');

    console.log('🔍 Found in localStorage:', {
      hasToken: !!savedToken,
      hasRefreshToken: !!savedRefreshToken,
      hasUser: !!savedUser
    });

    if (savedToken && savedRefreshToken && savedUser) {
      // Check if token is still valid
      if (!isTokenExpired(savedToken)) {
        console.log('✅ Token is valid, restoring auth state');
        authToken.value = savedToken;
        refreshToken.value = savedRefreshToken;
        currentUser.value = JSON.parse(savedUser);
        isAuthenticated.value = true;

        // Set token in API service
        const { getApiService } = await import('@/services/apiService.js');
        const apiService = getApiService();
        apiService.setAuthToken(authToken.value);

        // Set up token refresh
        setupTokenRefresh();
      } else {
        console.log('❌ Token expired, trying to refresh...');
        try {
          await refreshTokenNow();
          // Check if refresh was successful
          if (isAuthenticated.value) {
            console.log('✅ Refresh successful, user authenticated');
          } else {
            console.log('❌ Refresh failed, user will be redirected to login');
            // Redirect to login if refresh fails
            router.push({ name: 'login' });
          }
        } catch (refreshErr) {
          console.warn('❌ Token refresh failed during initialization:', refreshErr.message);
          // Clear expired tokens
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          console.log('🧹 Cleared expired tokens from localStorage');
          // Redirect to login if refresh fails
          router.push({ name: 'login' });
        }
      }
    } else {
      console.log('⚠️ No complete auth data found in localStorage');
    }
  } catch (err) {
    console.error('❌ Failed to restore authentication state:', err);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  } finally {
    // Mark auth initialization as complete
    isAuthInitialized.value = true;
    console.log('✅ Auth initialization complete:', {
      isAuthenticated: isAuthenticated.value,
      hasUser: !!currentUser.value,
      isAuthInitialized: isAuthInitialized.value
    });
  }
};

// Check if user has specific role
export const hasRole = (role) => {
  return computed(() => {
    return currentUser.value?.role === role;
  });
};

// Get user display name
export const getUserDisplayName = computed(() => {
  return currentUser.value?.name || 'User';
});

// Get user role display name
export const getUserRoleDisplay = computed(() => {
  const role = currentUser.value?.role;
  if (!role) return 'Unknown';

  return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Cleanup on app unmount
export const cleanupAuth = () => {
  clearTokenRefresh();
};