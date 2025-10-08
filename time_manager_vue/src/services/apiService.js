// API service for communicating with Phoenix backend
const API_BASE_URL = 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);

      // Check if we're in development mode and backend is not available
      if (import.meta.env.DEV && !await this.isBackendAvailable()) {
        console.warn('🚨 Backend not available, using fallback mode');
        return this.getFallbackResponse(endpoint, options.method);
      }

      const response = await fetch(url, config);

      // Log response status for debugging
      console.log(`📡 API Response: ${response.status} ${response.statusText} for ${url}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);

        // If it's a CORS or network error, provide fallback
        if (response.status === 0 || response.type === 'opaque') {
          console.warn('🚨 CORS/Network error detected, using fallback');
          return this.getFallbackResponse(endpoint, options.method);
        }

        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Handle empty responses (like 204 No Content for DELETE, OPTIONS, etc.)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log(`✅ API Success: ${response.status} (No Content) for ${url}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ API Success: ${response.status} for ${url}`, data);
      return data;
    } catch (error) {
      console.error('🚨 API request failed:', error);

      // For development, provide fallback responses
      if (import.meta.env.DEV) {
        console.warn('🚨 Using fallback response for development');
        return this.getFallbackResponse(endpoint, options.method);
      }

      throw error;
    }
  }

  // Check if backend is available
  async isBackendAvailable() {
    try {
      // Simple check - if we can reach the base URL, assume backend is available
      // This avoids CORS complications for availability checks
      const response = await fetch(`${this.baseURL.replace('/api', '')}/`, {
        method: 'HEAD',
        mode: 'no-cors'
      });

      // If we get here, the request didn't fail completely
      return true;
    } catch (error) {
      console.warn('Backend availability check failed:', error.message);
      return false;
    }
  }

  // Fallback responses for development when backend is not available
  getFallbackResponse(endpoint, method) {
    console.log(`🔄 Fallback response for: ${method || 'GET'} ${endpoint}`);

    // Auth endpoints
    if (endpoint === '/auth/login') {
      return {
        token: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        user: {
          id: 1,
          name: 'Demo User',
          email: 'demo@gm.com',
          role: 'gm'
        }
      };
    }

    if (endpoint === '/auth/refresh') {
      return {
        token: 'demo-jwt-token-refreshed-' + Date.now(),
        refreshToken: 'demo-refresh-token-refreshed-' + Date.now()
      };
    }

    if (endpoint === '/auth/me') {
      return {
        id: 1,
        name: 'Demo User',
        email: 'demo@gm.com',
        role: 'gm'
      };
    }

    // User management endpoints
    if (endpoint.startsWith('/users')) {
      if (method === 'GET') {
        return {
          data: [
            {
              id: 1,
              name: 'Demo GM',
              email: 'demo@gm.com',
              role: 'gm',
              department: 'Management',
              status: 'online',
              password: 'password'
            },
            {
              id: 2,
              name: 'Demo Manager',
              email: 'demo@manager.com',
              role: 'manager',
              department: 'Operations',
              status: 'online',
              password: 'password'
            },
            {
              id: 3,
              name: 'Demo Employee',
              email: 'demo@employee.com',
              role: 'employee',
              department: 'Development',
              status: 'online',
              password: 'password'
            }
          ]
        };
      }

      if (method === 'POST') {
        return {
          data: {
            id: Math.floor(Math.random() * 1000) + 10,
            name: 'New User',
            email: 'newuser@example.com',
            role: 'employee',
            department: 'General',
            status: 'online',
            password: 'password123'
          }
        };
      }

      if (method === 'PUT') {
        return {
          data: {
            id: 1,
            name: 'Updated User',
            email: 'updated@example.com',
            role: 'employee',
            department: 'General',
            status: 'online',
            password: 'newpassword123'
          }
        };
      }

      if (method === 'DELETE') {
        return null;
      }
    }

    // Dashboard stats
    if (endpoint === '/dashboard/stats') {
      return {
        totalUsers: 3,
        totalEmployees: 1,
        totalManagers: 1,
        totalGMs: 1,
        onlineUsers: 3,
        offlineUsers: 0
      };
    }

    // Working times
    if (endpoint.startsWith('/workingtimes')) {
      if (method === 'GET') {
        return {
          data: [
            {
              id: 1,
              user_id: 1,
              date: new Date().toISOString().split('T')[0],
              start_time: new Date().toISOString(),
              end_time: null,
              break_start: null,
              break_end: null,
              total_hours: 0
            }
          ]
        };
      }

      if (method === 'POST') {
        return {
          id: Math.floor(Math.random() * 1000) + 10,
          user_id: 1,
          date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          end_time: null,
          break_start: null,
          break_end: null,
          total_hours: 0
        };
      }

      if (method === 'PUT') {
        return {
          id: 1,
          user_id: 1,
          date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          break_start: null,
          break_end: null,
          total_hours: 8.0
        };
      }
    }

    // Default fallback
    return { success: true, message: 'Fallback response' };
  }

  // Authentication
  async authenticateUser(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logoutUser() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async refreshTokenWithToken(refreshTokenValue) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: refreshTokenValue
      }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User Management
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ user: userData }),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user: userData }),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Working Time Management
  async getWorkingTimes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/workingtimes${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getWorkingTime(id) {
    return this.request(`/workingtimes/${id}`);
  }

  async createWorkingTime(workingTimeData) {
    return this.request('/workingtimes', {
      method: 'POST',
      body: JSON.stringify({ working_time: workingTimeData }),
    });
  }

  async updateWorkingTime(id, workingTimeData) {
    return this.request(`/workingtimes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ working_time: workingTimeData }),
    });
  }

  async deleteWorkingTime(id) {
    return this.request(`/workingtimes/${id}`, {
      method: 'DELETE',
    });
  }

  async getTodayWorkingTimes(userId) {
    return this.request(`/workingtimes/today/${userId}`);
  }

  async getWorkingTimeStats(userId) {
    return this.request(`/workingtimes/stats/${userId}`);
  }
}

// Create a singleton instance
const apiService = new ApiService();

// Export both default and named export for compatibility
export default apiService;
export const getApiService = () => apiService;
