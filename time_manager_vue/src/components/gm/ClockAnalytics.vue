<template>
  <div class="clock-analytics">
    <!-- Header -->
    <div class="analytics-header">
      <div class="header-content">
        <h2>Clock Analytics</h2>
        <p>Comprehensive insights and performance metrics</p>
      </div>
      <div class="time-range-selector">
        <select v-model="selectedRange" class="range-select" @change="loadAnalyticsData">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Failed to Load Analytics</h3>
      <p>{{ error }}</p>
      <button @click="loadAnalyticsData" class="retry-btn">Try Again</button>
    </div>

    <!-- Main Content -->
    <div v-else class="analytics-content">
      <!-- KPI Cards -->
      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-icon">⏱️</div>
          <div class="kpi-content">
            <h3>{{ formatHours(totalHours) }}</h3>
            <p>Total Hours</p>
            <span class="kpi-trend" :class="hoursTrend > 0 ? 'positive' : 'negative'">
              {{ hoursTrend > 0 ? '↗' : '↘' }} {{ Math.abs(hoursTrend).toFixed(1) }}%
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⚡</div>
          <div class="kpi-content">
            <h3>{{ formatHours(overtimeHours) }}</h3>
            <p>Overtime Hours</p>
            <span class="kpi-trend" :class="overtimeTrend < 0 ? 'positive' : 'negative'">
              {{ overtimeTrend > 0 ? '↗' : '↘' }} {{ Math.abs(overtimeTrend).toFixed(1) }}%
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">☕</div>
          <div class="kpi-content">
            <h3>{{ totalBreaks }}m</h3>
            <p>Total Break Time</p>
            <span class="kpi-trend" :class="breakTrend > 0 ? 'positive' : 'negative'">
              {{ breakTrend > 0 ? '↗' : '↘' }} {{ Math.abs(breakTrend).toFixed(1) }}%
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-content">
            <h3>{{ formatHours(avgDailyHours) }}</h3>
            <p>Avg Daily Hours</p>
            <span class="kpi-trend info">Target: 8h/day</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Hours Worked Trend -->
        <div class="chart-container">
          <h3>Hours Worked Trend</h3>
          <div class="chart-placeholder">
            <div v-if="loading" class="chart-loading">
              <div class="loading-spinner-small"></div>
              <p>Loading chart...</p>
            </div>
            <div v-else-if="chartData.length > 0" class="chart-bars">
              <div
                v-for="(day, index) in chartData"
                :key="index"
                class="chart-bar-wrapper"
              >
                <div
                  class="chart-bar"
                  :style="{ height: `${(day.hours / maxHours) * 100}%` }"
                  :title="`${day.label}: ${formatHours(day.hours)}`"
                >
                  <span class="bar-value">{{ formatHours(day.hours) }}</span>
                </div>
                <span class="bar-label">{{ day.label }}</span>
              </div>
            </div>
            <div v-else class="no-chart-data">
              <div class="no-data-icon">📊</div>
              <h4>No Data Available</h4>
              <p>No hours recorded for this period</p>
            </div>
          </div>
        </div>

        <!-- Department Comparison -->
        <div class="chart-container">
          <h3>Department Comparison</h3>
          <div class="chart-placeholder">
            <div v-if="loading" class="chart-loading">
              <div class="loading-spinner-small"></div>
              <p>Loading departments...</p>
            </div>
            <div v-else-if="departmentStats.length > 0" class="dept-comparison">
              <div v-for="dept in departmentStats" :key="dept.name" class="dept-bar">
                <div class="dept-info">
                  <span class="dept-name">{{ dept.name }}</span>
                  <span class="dept-hours">{{ formatHours(dept.avgHours) }} avg</span>
                </div>
                <div class="dept-progress">
                  <div
                    class="progress-fill"
                    :style="{ width: `${(dept.avgHours / maxDeptHours) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            <div v-else class="no-chart-data">
              <div class="no-data-icon">🏢</div>
              <h4>No Department Data</h4>
              <p>No department activity found</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Activity Logs -->
      <div class="activity-logs-section">
        <div class="section-header">
          <h3>Employee Activity Logs</h3>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search employees..."
            class="search-input"
          />
        </div>
        
        <div class="activity-logs-table">
          <div class="table-header">
            <div class="col-employee">Employee</div>
            <div class="col-date">Date</div>
            <div class="col-times">Time Range</div>
            <div class="col-hours">Hours</div>
            <div class="col-status">Status</div>
          </div>
          
          <div 
            v-for="(log, index) in filteredActivityLogs" 
            :key="index" 
            class="table-row"
          >
            <div class="col-employee">
              <div class="employee-avatar">
                {{ getInitials(log.employeeName) }}
              </div>
              <div class="employee-details">
                <span class="employee-name">{{ log.employeeName }}</span>
                <span class="employee-dept">{{ log.department || 'N/A' }}</span>
              </div>
            </div>
            <div class="col-date">{{ formatDate(log.date) }}</div>
            <div class="col-times">
              <span class="time-in">{{ log.clockIn }}</span>
              <span class="time-separator">→</span>
              <span class="time-out">{{ log.clockOut || 'Active' }}</span>
            </div>
            <div class="col-hours">
              <span :class="getHoursClass(log.totalHours)">
                {{ formatHours(log.totalHours || 0) }}
              </span>
            </div>
            <div class="col-status">
              <span :class="['status-badge', log.status]">
                <span class="status-dot"></span>
                {{ log.status === 'active' ? 'Active' : 'Completed' }}
              </span>
            </div>
          </div>
          
          <div v-if="filteredActivityLogs.length === 0" class="no-data">
            <div class="no-data-icon">📋</div>
            <h4>{{ searchQuery ? 'No Matching Results' : 'No Activity Logs' }}</h4>
            <p>{{ searchQuery ? 'Try a different search term' : 'No activity logs found for the selected period' }}</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ← Previous
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              :class="['page-number', { active: page === currentPage }]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="top-performers">
        <h3>Top Performers</h3>
        <div v-if="loading" class="performers-loading">
          <div class="loading-spinner-small"></div>
          <p>Loading performers...</p>
        </div>
        <div v-else-if="topPerformers.length > 0" class="performers-grid">
          <div v-for="(performer, index) in topPerformers" :key="index" class="performer-card">
            <div class="performer-rank">#{{ index + 1 }}</div>
            <div class="performer-avatar">
              {{ getInitials(performer.name) }}
            </div>
            <div class="performer-info">
              <h4>{{ performer.name }}</h4>
              <p>{{ performer.role.replace('_', ' ') }}</p>
            </div>
            <div class="performer-stats">
              <span class="stat">{{ formatHours(performer.hours) }}</span>
              <span class="stat">{{ performer.days }} days</span>
            </div>
          </div>
        </div>
        <div v-else class="no-performers">
          <div class="no-performers-icon">👥</div>
          <h4>No Performance Data</h4>
          <p>No employee activity found for the selected period</p>
        </div>
      </div>

      <!-- Alerts & Notifications -->
      <div class="alerts-section">
        <h3>Alerts & Notifications</h3>
        <div v-if="loading" class="alerts-loading">
          <div class="loading-spinner-small"></div>
          <p>Loading alerts...</p>
        </div>
        <div v-else-if="alerts.length > 0" class="alerts-list">
          <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.type">
            <div class="alert-icon">{{ alert.icon }}</div>
            <div class="alert-content">
              <h4>{{ alert.title }}</h4>
              <p>{{ alert.message }}</p>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-alerts">
          <div class="no-alerts-icon">✅</div>
          <h4>All Clear!</h4>
          <p>No alerts or notifications at this time</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/composables/useAuthStore.js';
import { users, timeLogs } from '@/composables/useGmStore.js';

// Reactive state
const selectedRange = ref('month');
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

// Initialize stores
const authStore = useAuthStore();

// Analytics data
const totalHours = ref(0);
const overtimeHours = ref(0);
const totalBreaks = ref(0);
const avgDailyHours = ref(0);
const hoursTrend = ref(0);
const overtimeTrend = ref(0);
const breakTrend = ref(0);
const chartData = ref([]);
const departmentStats = ref([]);
const topPerformers = ref([]);
const alerts = ref([]);
const employeeActivityLogs = ref([]);

// Helper function to format hours
const formatHours = (hours) => {
  if (!hours) return '0h';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Helper function to get initials
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  }
};

// Helper function to get hours class
const getHoursClass = (hours) => {
  if (!hours) return 'no-hours';
  if (hours >= 8) return 'good';
  if (hours >= 6) return 'average';
  return 'low';
};

// Computed properties
const maxHours = computed(() => {
  if (!chartData.value.length) return 10;
  return Math.max(...chartData.value.map(d => d.hours), 8);
});

const maxDeptHours = computed(() => {
  if (!departmentStats.value.length) return 8;
  return Math.max(...departmentStats.value.map(d => d.avgHours), 8);
});

const filteredActivityLogs = computed(() => {
  let logs = employeeActivityLogs.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    logs = logs.filter(log => 
      log.employeeName.toLowerCase().includes(query) ||
      (log.department && log.department.toLowerCase().includes(query))
    );
  }
  
  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return logs.slice(start, end);
});

const totalPages = computed(() => {
  let logs = employeeActivityLogs.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    logs = logs.filter(log => 
      log.employeeName.toLowerCase().includes(query) ||
      (log.department && log.department.toLowerCase().includes(query))
    );
  }
  
  return Math.ceil(logs.length / itemsPerPage);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Load analytics data
const loadAnalyticsData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Wait a bit for stores to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if we have users and timeLogs data
    if (!users.value || users.value.length === 0) {
      console.log('Users not loaded yet. Users:', users.value);
      setTimeout(loadAnalyticsData, 500);
      return;
    }
    
    if (!timeLogs.value || timeLogs.value.length === 0) {
      console.log('TimeLogs not loaded yet. TimeLogs:', timeLogs.value);
      setTimeout(loadAnalyticsData, 500);
      return;
    }
    
    console.log('Data loaded successfully. Users:', users.value.length, 'TimeLogs:', timeLogs.value.length);
    console.log('Sample user:', users.value[0]);
    console.log('Sample timeLog:', timeLogs.value[0]);
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (selectedRange.value) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    
    // Filter logs for the selected period - use all logs, not filtered by userId
    const periodLogs = timeLogs.value.filter(log => log.date >= startDateStr);
    
    console.log('Period logs filtered:', periodLogs.length, 'logs from', startDateStr);
    
    if (periodLogs.length === 0) {
      console.warn('No logs found for the selected period. Start date:', startDateStr);
      console.log('All available logs dates:', timeLogs.value.map(l => l.date));
    }
    
    // Calculate KPIs
    totalHours.value = periodLogs
      .filter(log => log.totalHours)
      .reduce((sum, log) => sum + log.totalHours, 0);
    
    overtimeHours.value = periodLogs
      .filter(log => log.totalHours && log.totalHours > 8)
      .reduce((sum, log) => sum + (log.totalHours - 8), 0);
    
    totalBreaks.value = periodLogs
      .filter(log => log.breakStart && log.breakEnd)
      .reduce((sum, log) => {
        const breakStart = new Date(`2000-01-01T${log.breakStart}:00`);
        const breakEnd = new Date(`2000-01-01T${log.breakEnd}:00`);
        return sum + Math.floor((breakEnd - breakStart) / (1000 * 60));
      }, 0);
    
    const workDays = new Set(periodLogs.map(log => log.date)).size;
    avgDailyHours.value = workDays > 0 ? totalHours.value / workDays : 0;
    
    // Calculate trends (mock data - in real app compare with previous period)
    hoursTrend.value = 5.2;
    overtimeTrend.value = -2.1;
    breakTrend.value = 3.4;
    
    // Generate chart data (last 7 days)
    const chartDays = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLogs = periodLogs.filter(log => log.date === dateStr);
      const dayHours = dayLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
      
      chartDays.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours: dayHours
      });
    }
    chartData.value = chartDays;
    
    console.log('Chart data generated:', chartData.value.length, 'days');
    console.log('Chart data:', chartData.value);
    
    // Calculate department stats
    const deptMap = {};
    periodLogs.forEach(log => {
      // Use String comparison for UUID matching
      const user = users.value.find(u => String(u.id) === String(log.userId));
      if (user && user.department && log.totalHours) {
        if (!deptMap[user.department]) {
          deptMap[user.department] = { totalHours: 0, count: 0 };
        }
        deptMap[user.department].totalHours += log.totalHours;
        deptMap[user.department].count += 1;
      }
    });
    
    departmentStats.value = Object.entries(deptMap).map(([name, data]) => ({
      name,
      avgHours: data.count > 0 ? data.totalHours / data.count : 0
    }));
    
    console.log('Department stats calculated:', departmentStats.value.length, 'departments');
    console.log('Departments:', departmentStats.value);
    
    // Calculate top performers
    const userMap = {};
    periodLogs.forEach(log => {
      if (!userMap[log.userId]) {
        userMap[log.userId] = { hours: 0, days: new Set() };
      }
      if (log.totalHours) {
        userMap[log.userId].hours += log.totalHours;
        userMap[log.userId].days.add(log.date);
      }
    });
    
    topPerformers.value = Object.entries(userMap)
      .map(([userId, data]) => {
        // Try different comparison methods
        const user = users.value.find(u => {
          // Compare as strings since IDs might be UUIDs
          return String(u.id) === String(userId);
        });
        
        if (!user) {
          console.log('User not found for ID:', userId);
          console.log('Trying to find in users array...');
          console.log('First user ID type:', typeof users.value[0].id, users.value[0].id);
          console.log('Looking for ID type:', typeof userId, userId);
          return null;
        }
        return {
          name: user.name || 'Unknown User',
          role: user.role || 'employee',
          hours: data.hours,
          days: data.days.size
        };
      })
      .filter(performer => performer !== null) // Remove null entries
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
    
    console.log('Top performers calculated:', topPerformers.value.length);
    console.log('Top performers:', topPerformers.value);
    
    // Prepare activity logs
    employeeActivityLogs.value = periodLogs
      .map(log => {
        // Try different comparison methods for user ID
        const user = users.value.find(u => String(u.id) === String(log.userId));
        
        if (!user) {
          console.log('User not found for activity log, userId:', log.userId);
          return null;
        }
        return {
          employeeName: user.name || 'Unknown User',
          department: user.department || 'N/A',
          date: log.date,
          clockIn: log.clockIn || '--:--',
          clockOut: log.clockOut || null,
          totalHours: log.totalHours || 0,
          status: log.status || 'completed'
        };
      })
      .filter(log => log !== null) // Remove null entries
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log('Activity logs prepared:', employeeActivityLogs.value.length);
    console.log('Sample activity log:', employeeActivityLogs.value[0]);
    
    // Generate alerts (mock data)
    alerts.value = [
      {
        id: 1,
        type: 'warning',
        icon: '⚠️',
        title: 'High Overtime',
        message: 'Overtime hours increased by 15% this week',
        time: '2 hours ago'
      },
      {
        id: 2,
        type: 'info',
        icon: 'ℹ️',
        title: 'Team Performance',
        message: 'Team productivity is above target by 8%',
        time: '5 hours ago'
      }
    ];
    
    console.log('Analytics Summary:');
    console.log('- Total Hours:', totalHours.value);
    console.log('- Overtime Hours:', overtimeHours.value);
    console.log('- Total Breaks:', totalBreaks.value);
    console.log('- Avg Daily Hours:', avgDailyHours.value);
    console.log('- Chart Data Points:', chartData.value.length);
    console.log('- Departments:', departmentStats.value.length);
    console.log('- Top Performers:', topPerformers.value.length);
    console.log('- Activity Logs:', employeeActivityLogs.value.length);
    
    loading.value = false;
  } catch (err) {
    console.error('Failed to load analytics data:', err);
    error.value = err.message || 'Failed to load analytics data. Please try again.';
    loading.value = false;
  }
};

// Watch for changes to selected range
watch(selectedRange, () => {
  loadAnalyticsData();
});

// Watch search query to reset pagination
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Initialize data when component mounts
onMounted(async () => {
  // Give stores time to initialize
  await new Promise(resolve => setTimeout(resolve, 200));
  await loadAnalyticsData();
});
</script>
<style scoped>
/* Main Container */
.clock-analytics {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

/* Header */
.analytics-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.header-content p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.time-range-selector {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.range-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  font-weight: 500;
}

.range-select:hover {
  border-color: #667eea;
}

.range-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.error-state p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
}

.kpi-icon {
  font-size: 2.5rem;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.kpi-content {
  flex: 1;
}

.kpi-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.kpi-content p {
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.kpi-trend {
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi-trend.positive {
  color: #10b981;
}

.kpi-trend.negative {
  color: #ef4444;
}

.kpi-trend.info {
  color: #3b82f6;
}

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-container h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.chart-placeholder {
  min-height: 220px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 200px;
  gap: 0.5rem;
}

.chart-bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  max-width: 60px;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 6px 6px 0 0;
  position: relative;
  min-height: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.5rem;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: translateY(-4px);
}

.bar-value {
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.no-chart-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-style: italic;
}

/* Department Comparison */
.dept-comparison {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  padding: 1rem 0;
}

.dept-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dept-info {
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dept-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.dept-hours {
  color: #64748b;
  font-size: 0.75rem;
}

.dept-progress {
  flex: 1;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 12px;
  transition: width 0.5s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Activity Logs Section */
.activity-logs-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.2s ease;
  min-width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.activity-logs-table {
  width: 100%;
  overflow-x: auto;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  border-bottom: 2px solid #e2e8f0;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  align-items: center;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.col-employee {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.employee-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  line-height: 1;
}

.employee-dept {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1;
}

.col-date {
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 500;
}

.col-times {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.85rem;
}

.time-in {
  color: #10b981;
  font-weight: 600;
}

.time-separator {
  color: #94a3b8;
}

.time-out {
  color: #ef4444;
  font-weight: 600;
}

.col-hours {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 700;
}

.col-hours .good {
  color: #10b981;
}

.col-hours .average {
  color: #f59e0b;
}

.col-hours .low {
  color: #ef4444;
}

.col-hours .no-hours {
  color: #94a3b8;
}

.col-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.status-badge.active {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-badge.active .status-dot {
  background: #3b82f6;
}

.status-badge.completed .status-dot {
  background: #10b981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.no-data {
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.page-number.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
}

/* Top Performers */
.top-performers {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.top-performers h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.performer-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.performer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.performer-rank {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.performer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.performer-info {
  flex: 1;
}

.performer-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.performer-info p {
  color: #64748b;
  margin: 0;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.performer-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.stat {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.no-performers {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
}

/* Alerts Section */
.alerts-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.alerts-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1.5rem 0;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  border-left: 4px solid;
  transition: all 0.2s ease;
}

.alert-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.alert-item.warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.alert-item.info {
  background: #dbeafe;
  border-color: #3b82f6;
}

.alert-item.success {
  background: #dcfce7;
  border-color: #10b981;
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.alert-content p {
  margin: 0 0 0.5rem 0;
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.5;
}

.alert-time {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
}

.no-alerts {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-alerts-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-alerts p {
  margin: 0;
  font-style: italic;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .performers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .clock-analytics {
    padding: 1rem;
  }

  .analytics-header {
    padding: 1.5rem;
    flex-direction: column;
    align-items: stretch;
  }

  .range-select {
    width: 100%;
  }

  .kpi-cards {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
  }

  .col-employee,
  .col-date,
  .col-times,
  .col-hours,
  .col-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-employee::before,
  .col-date::before,
  .col-times::before,
  .col-hours::before,
  .col-status::before {
    content: attr(data-label);
    font-weight: 600;
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
  }

  .performer-card {
    flex-wrap: wrap;
  }

  .performer-stats {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .clock-analytics {
    padding: 0.75rem;
  }

  .analytics-header {
    padding: 1.25rem;
  }

  .header-content h2 {
    font-size: 1.5rem;
  }

  .kpi-card {
    padding: 1.5rem;
  }

  .kpi-icon {
    width: 48px;
    height: 48px;
    font-size: 2rem;
  }

  .kpi-content h3 {
    font-size: 1.75rem;
  }

  .chart-container {
    padding: 1.5rem;
  }

  .activity-logs-section {
    padding: 1.5rem;
  }

  .top-performers {
    padding: 1.5rem;
  }

  .alerts-section {
    padding: 1.5rem;
  }
}
</style>  