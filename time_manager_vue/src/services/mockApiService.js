// Mock API service that mirrors the real API but uses local data
// Note: No mock data - everything should come from PostgreSQL database

// Simple data storage - starts empty, should be populated from database
let usersData = [];
let timeLogsData = [];

class MockApiService {
  constructor() {
    this.delay = 300; // Simulate network delay
  }

  async simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  async request(endpoint, options = {}) {
    await this.simulateDelay();

    console.log(`🔄 Mock API Request: ${options.method || 'GET'} ${endpoint}`);

    // Simulate different HTTP status codes randomly
    if (Math.random() < 0.05) { // 5% chance of error
      const error = new Error(`Mock API error: ${endpoint}`);
      console.error('🚨 Mock API Error:', error);
      throw error;
    }

    const result = this.handleRequest(endpoint, options);
    console.log(`✅ Mock API Success for ${endpoint}`, result);
    return result;
  }

  handleRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // Route the request based on endpoint and method
    if (endpoint.startsWith('/users')) {
      return this.handleUserRequest(endpoint, method, body);
    } else if (endpoint.startsWith('/workingtimes')) {
      return this.handleWorkingTimeRequest(endpoint, method, body);
    } else if (endpoint.startsWith('/dashboard')) {
      return this.handleDashboardRequest(endpoint, method, body);
    }

    throw new Error(`Unknown endpoint: ${endpoint}`);
  }

  handleUserRequest(endpoint, method, body) {
    if (method === 'GET' && endpoint === '/users') {
      // Get all users with optional filtering
      return { data: usersData };
    }

    if (method === 'GET' && endpoint.startsWith('/users/')) {
      const id = endpoint.split('/')[2];
      const user = usersData.find(u => u.id === parseInt(id));
      if (!user) throw new Error('User not found');
      return { data: user };
    }

    if (method === 'POST' && endpoint === '/users') {
      const newUser = { ...body.user, id: Math.max(...usersData.map(u => u.id)) + 1 };
      usersData.push(newUser);
      return { data: newUser };
    }

    if (method === 'PUT' && endpoint.startsWith('/users/')) {
      const id = parseInt(endpoint.split('/')[2]);
      const userIndex = usersData.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        usersData[userIndex] = { ...usersData[userIndex], ...body.user };
      }
      return { data: usersData.find(u => u.id === id) };
    }

    if (method === 'DELETE' && endpoint.startsWith('/users/')) {
      const id = parseInt(endpoint.split('/')[2]);
      const index = usersData.findIndex(u => u.id === id);
      if (index !== -1) {
        usersData.splice(index, 1);
      }
      return { data: { id } };
    }

    throw new Error(`Unsupported method ${method} for ${endpoint}`);
  }

  handleWorkingTimeRequest(endpoint, method, body) {
    if (method === 'GET' && endpoint === '/workingtimes') {
      // Get working times with optional filtering
      const queryParams = this.parseQueryString(endpoint);
      let filteredLogs = [...timeLogsData];

      if (queryParams.user_id) {
        filteredLogs = filteredLogs.filter(log => log.userId === parseInt(queryParams.user_id));
      }

      if (queryParams.start_date) {
        filteredLogs = filteredLogs.filter(log => log.date >= queryParams.start_date);
      }

      if (queryParams.end_date) {
        filteredLogs = filteredLogs.filter(log => log.date <= queryParams.end_date);
      }

      return { data: filteredLogs };
    }

    if (method === 'GET' && endpoint.startsWith('/workingtimes/today/')) {
      const userId = parseInt(endpoint.split('/')[3]);
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = timeLogsData.filter(log =>
        log.userId === userId && log.date === today
      );
      return { data: todayLogs };
    }

    if (method === 'GET' && endpoint.startsWith('/workingtimes/stats/')) {
      const userId = parseInt(endpoint.split('/')[3]);
      const userLogs = timeLogsData.filter(log => log.userId === userId);

      const stats = {
        total_logs: userLogs.length,
        total_hours: userLogs
          .filter(log => log.totalHours)
          .reduce((sum, log) => sum + log.totalHours, 0),
        active_sessions: userLogs.filter(log => log.status === 'active').length,
        completed_sessions: userLogs.filter(log => log.status === 'complete').length
      };

      return { data: stats };
    }

    if (method === 'POST' && endpoint === '/workingtimes') {
      // Create new working time entry
      const newLog = {
        id: Math.max(...timeLogsData.map(l => l.id)) + 1,
        ...body.working_time,
        status: 'active'
      };
      timeLogsData.push(newLog);
      return { data: newLog };
    }

    if (method === 'PUT' && endpoint.startsWith('/workingtimes/')) {
      const id = parseInt(endpoint.split('/')[2]);
      const logIndex = timeLogsData.findIndex(log => log.id === id);
      if (logIndex !== -1) {
        timeLogsData[logIndex] = { ...timeLogsData[logIndex], ...body.working_time };
      }
      return { data: timeLogsData.find(log => log.id === id) };
    }

    if (method === 'DELETE' && endpoint.startsWith('/workingtimes/')) {
      const id = parseInt(endpoint.split('/')[2]);
      // Remove from timeLogs array
      const index = timeLogsData.findIndex(log => log.id === id);
      if (index !== -1) {
        timeLogsData.splice(index, 1);
      }
      return { data: { id } };
    }

    throw new Error(`Unsupported method ${method} for ${endpoint}`);
  }

  handleDashboardRequest(endpoint, method, body) {
    if (method === 'GET' && endpoint === '/dashboard/stats') {
      const stats = {
        total_users: usersData.length,
        online_users: usersData.filter(u => u.status === 'online').length,
        offline_users: usersData.filter(u => u.status === 'offline').length,
        employees: usersData.filter(u => u.role === 'employee').length,
        managers: usersData.filter(u => u.role === 'manager').length,
        general_managers: usersData.filter(u => u.role === 'general_manager').length,
        departments: [...new Set(usersData.map(u => u.department).filter(Boolean))].length
      };

      return { data: stats };
    }

    throw new Error(`Unsupported method ${method} for ${endpoint}`);
  }

  parseQueryString(endpoint) {
    const queryIndex = endpoint.indexOf('?');
    if (queryIndex === -1) return {};

    const queryString = endpoint.substring(queryIndex + 1);
    return queryString.split('&').reduce((params, param) => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
      return params;
    }, {});
  }

  // User Management
  async getUsers(params = {}) {
    return this.request('/users');
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
    return this.request('/workingtimes');
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

  // Clock Management
  async getClocks(userId) {
    return this.request(`/clocks/${userId}`);
  }

  async createClock(userId, clockData) {
    return this.request(`/clocks/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ clock: clockData }),
    });
  }
}

// Create a singleton instance
export const mockApiService = new MockApiService();
