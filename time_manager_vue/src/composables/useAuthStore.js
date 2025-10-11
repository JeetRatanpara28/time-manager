// JWT Authentication Store - Session persistence (survives page refresh)
import { ref, computed } from 'vue';

// Authentication state
export const isAuthenticated = ref(false);
export const currentUser = ref(null);
export const authToken = ref(null);
export const refreshToken = ref(null);
export const isLoading = ref(false);
export const error = ref(null);
export const isAuthInitialized = ref(false);

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
    const fiveMinutes = 5 * 60;
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

// Save auth state to sessionStorage (survives page refresh, NOT browser close)
const saveAuthState = () => {
  if (authToken.value && currentUser.value) {
    sessionStorage.setItem('authToken', authToken.value);
    sessionStorage.setItem('refreshToken', refreshToken.value);
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser.value));
    console.log('💾 Auth state saved to session');
  }
};

// Clear auth state from sessionStorage
const clearAuthState = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('currentUser');
  console.log('🧹 Auth state cleared from session');
};

// Restore auth state from sessionStorage
const restoreAuthState = () => {
  try {
    const savedToken = sessionStorage.getItem('authToken');
    const savedRefreshToken = sessionStorage.getItem('refreshToken');
    const savedUser = sessionStorage.getItem('currentUser');

    if (savedToken && savedRefreshToken && savedUser && !isTokenExpired(savedToken)) {
      authToken.value = savedToken;
      refreshToken.value = savedRefreshToken;
      currentUser.value = JSON.parse(savedUser);
      isAuthenticated.value = true;
      
      console.log('✅ Auth state restored from session');
      return true;
    }
  } catch (err) {
    console.error('❌ Failed to restore auth state:', err);
  }
  return false;
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

      // Store current user info
      currentUser.value = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: mapBackendRoleToFrontend(response.user.role),
        department: response.user.department,
        phone: response.user.phone,
        status: response.user.status
      };

      isAuthenticated.value = true;

      // Save to sessionStorage
      saveAuthState();

      // Set token in API service
      apiService.setAuthToken(authToken.value);
      console.log('🔑 Auth token set in API service');

      // Set up token refresh timer
      setupTokenRefresh();

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
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();
    apiService.clearAuthToken();

    authToken.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    isAuthenticated.value = false;

    clearAuthState();
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
    refreshTokenNow();
  }

  refreshTimer = setInterval(async () => {
    if (authToken.value && shouldRefreshToken(authToken.value)) {
      await refreshTokenNow();
    }
  }, 60000);
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
    
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();

    const response = await apiService.refreshTokenWithToken(refreshToken.value);

    if (response.token && response.refreshToken) {
      console.log('✅ Token refresh successful');
      authToken.value = response.token;
      refreshToken.value = response.refreshToken;
      
      saveAuthState();
      apiService.setAuthToken(authToken.value);
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (err) {
    console.error('❌ Token refresh failed:', err.message);

    // Clear auth state on refresh failure
    authToken.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    isAuthenticated.value = false;

    clearAuthState();

    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();
    apiService.clearAuthToken();
  }
};

// Initialize auth state (restore from session if exists)
export const initializeAuth = async () => {
  console.log('🔄 Initializing auth state...');
  
  // Try to restore from sessionStorage first
  const restored = restoreAuthState();
  
  if (restored) {
    // Set token in API service
    const { getApiService } = await import('@/services/apiService.js');
    const apiService = getApiService();
    apiService.setAuthToken(authToken.value);
    
    // Setup token refresh
    setupTokenRefresh();
  }
  
  isAuthInitialized.value = true;
  
  console.log('✅ Auth initialization complete:', {
    isAuthenticated: isAuthenticated.value,
    hasUser: !!currentUser.value,
    isAuthInitialized: isAuthInitialized.value
  });
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
  
  const roleDisplayMap = {
    'gm': 'General Manager',
    'manager': 'Manager',
    'employee': 'Employee'
  };
  
  return roleDisplayMap[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Cleanup on app unmount
export const cleanupAuth = () => {
  clearTokenRefresh();
};