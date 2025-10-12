<template>
  <div class="daily-logs">
    <div class="logs-header">
      <div class="header-content">
        <h2>Daily Logs Overview</h2>
        <p>Comprehensive time tracking and productivity insights</p>
      </div>
      <div class="logs-controls">
        <div class="date-filter-group">
          <div class="date-filter">
            <label for="date-from">From:</label>
            <input
              id="date-from"
              v-model="dateFrom"
              type="date"
              class="date-input"
            />
          </div>
          <div class="date-filter">
            <label for="date-to">To:</label>
            <input
              id="date-to"
              v-model="dateTo"
              type="date"
              class="date-input"
            />
          </div>
        </div>
        <div class="filter-controls">
          <div class="user-filter">
            <select v-model="selectedUser" class="user-select">
              <option value="">All Users</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          <button class="export-btn" @click="exportLogs">
            <span class="btn-icon">📥</span>
            Export CSV
          </button>
        </div>
      </div>
    </div>

    <!-- Enhanced Summary Cards -->
    <div class="logs-summary">
      <div class="summary-card primary">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <h4>{{ filteredLogs.length }}</h4>
          <p>Total Logs</p>
          <div class="card-trend">
            <span class="trend-icon">📈</span>
            <span>{{ getTrendText('logs') }}</span>
          </div>
        </div>
      </div>

      <div class="summary-card secondary">
        <div class="card-icon">⏰</div>
        <div class="card-content">
          <h4>{{ formatHoursMinutes(parseFloat(totalHours)) }}</h4>
          <p>Total Hours</p>
          <div class="card-trend">
            <span class="trend-icon">{{ hoursTrend >= 0 ? '↗️' : '↘️' }}</span>
            <span>{{ Math.abs(hoursTrend).toFixed(1) }}% vs last period</span>
          </div>
        </div>
      </div>

      <div class="summary-card tertiary">
        <div class="card-icon">👥</div>
        <div class="card-content">
          <h4>{{ activeSessions }}</h4>
          <p>Active Sessions</p>
          <div class="card-trend">
            <span class="trend-icon">🟢</span>
            <span>{{ getActiveSessionsText() }}</span>
          </div>
        </div>
      </div>

      <div class="summary-card quaternary">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <h4>{{ formatHoursMinutes(parseFloat(avgHoursPerDay)) }}</h4>
          <p>Avg Hours/Day</p>
          <div class="card-trend">
            <span class="trend-icon">🎯</span>
            <span>{{ getEfficiencyText() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Logs Section -->
    <div class="logs-section">
      <div class="section-header">
        <h3>Time Logs</h3>
        <div class="view-controls">
          <div class="view-toggle">
            <button
              :class="['toggle-btn', { active: viewMode === 'table' }]"
              @click="viewMode = 'table'"
            >
              <span class="btn-icon">📋</span>
              Table
            </button>
            <button
              :class="['toggle-btn', { active: viewMode === 'cards' }]"
              @click="viewMode = 'cards'"
            >
              <span class="btn-icon">🃏</span>
              Cards
            </button>
          </div>
          <div class="sort-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="hours">Sort by Hours</option>
              <option value="status">Sort by Status</option>
            </select>
            <button 
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              class="sort-order-btn"
              :title="sortOrder === 'asc' ? 'Ascending' : 'Descending'"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break Duration</th>
              <th>Total Hours</th>
              <th>Overtime</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in sortedFilteredLogs" :key="log.id" :class="getRowClass(log)">
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar">
                    {{ getEmployeeInitials(getUserName(log.userId)) }}
                  </div>
                  <div class="employee-info">
                    <span class="employee-name">{{ getUserName(log.userId) }}</span>
                    <span class="employee-dept">{{ getUserDepartment(log.userId) }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="date-cell">
                  <span class="date-main">{{ formatDate(log.date) }}</span>
                  <span class="date-day">{{ formatDayName(log.date) }}</span>
                </div>
              </td>
              <td>
                <span class="time-display">{{ log.clockIn || '--:--' }}</span>
              </td>
              <td>
                <span class="time-display">{{ log.clockOut || '--:--' }}</span>
              </td>
              <td>
                <span class="break-duration">{{ calculateBreakDuration(log) }}</span>
              </td>
              <td>
                <div class="hours-cell">
                  <span class="hours-value" :class="getHoursClass(log.totalHours)">
                    {{ formatHoursMinutes(log.totalHours) }}
                  </span>
                  <div v-if="log.totalHours" class="hours-bar">
                    <div 
                      class="hours-fill" 
                      :style="{ width: Math.min((log.totalHours / 8) * 100, 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="log.overtime && log.overtime > 0" class="overtime-badge">
                  +{{ formatHoursMinutes(log.overtime) }}
                </span>
                <span v-else class="no-overtime">--</span>
              </td>
              <td>
                <div class="status-cell">
                  <span :class="['status-badge', log.status]">
                    <span class="status-dot"></span>
                    {{ log.status }}
                  </span>
                  <div v-if="log.status === 'active'" class="live-timer">
                    {{ getLiveTimer(log) }}
                  </div>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn view" @click="viewLogDetail(log)" title="View Details">
                    👁️
                  </button>
                  <button class="action-btn edit" @click="editLog(log)" title="Edit Log">
                    ✏️
                  </button>
                  <button class="action-btn export" @click="exportSingleLog(log)" title="Export">
                    📊
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!sortedFilteredLogs.length" class="no-logs">
          <div class="no-logs-content">
            <div class="no-logs-icon">📋</div>
            <h4>No logs found</h4>
            <p>Try adjusting your filters or date range</p>
          </div>
        </div>
      </div>

      <!-- Cards View -->
      <div v-else-if="viewMode === 'cards'" class="logs-cards">
        <div v-for="log in sortedFilteredLogs" :key="log.id" class="log-card" :class="getCardClass(log)">
          <div class="log-card-header">
            <div class="employee-section">
              <div class="employee-avatar">
                {{ getEmployeeInitials(getUserName(log.userId)) }}
              </div>
              <div class="employee-details">
                <span class="employee-name">{{ getUserName(log.userId) }}</span>
                <span class="employee-dept">{{ getUserDepartment(log.userId) }}</span>
              </div>
            </div>
            <div class="date-section">
              <span class="log-date">{{ formatDate(log.date) }}</span>
              <span class="log-day">{{ formatDayName(log.date) }}</span>
            </div>
            <span :class="['status-badge', log.status]">
              <span class="status-dot"></span>
              {{ log.status }}
            </span>
          </div>

          <div class="log-card-content">
            <div class="time-grid">
              <div class="time-item">
                <span class="time-label">Clock In</span>
                <span class="time-value">{{ log.clockIn || '--:--' }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Clock Out</span>
                <span class="time-value">{{ log.clockOut || '--:--' }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Break Duration</span>
                <span class="time-value">{{ calculateBreakDuration(log) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">Total Hours</span>
                <span class="time-value hours" :class="getHoursClass(log.totalHours)">
                  {{ formatHoursMinutes(log.totalHours) }}
                </span>
              </div>
            </div>

            <div v-if="log.overtime && log.overtime > 0" class="overtime-section">
              <div class="overtime-badge">
                Overtime: +{{ formatHoursMinutes(log.overtime) }}
              </div>
            </div>

            <div v-if="log.status === 'active'" class="active-section">
              <div class="live-timer-display">
                <span class="timer-icon">🔴</span>
                <span class="timer-text">{{ getLiveTimer(log) }}</span>
              </div>
            </div>
          </div>

          <div class="log-card-footer">
            <div class="card-actions">
              <button class="card-action-btn primary" @click="viewLogDetail(log)">
                <span>👁️</span>
                Details
              </button>
              <button class="card-action-btn secondary" @click="editLog(log)">
                <span>✏️</span>
                Edit
              </button>
              <button class="card-action-btn tertiary" @click="exportSingleLog(log)">
                <span>📊</span>
                Export
              </button>
            </div>
          </div>
        </div>

        <div v-if="!sortedFilteredLogs.length" class="no-logs-cards">
          <div class="no-logs-card">
            <div class="no-logs-icon">📋</div>
            <h4>No logs available</h4>
            <p>Try adjusting your search criteria</p>
          </div>
        </div>
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

      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { users, timeLogs, exportUserLogsToCSV } from '@/composables/useGmStore.js';

// Reactive state
const dateFrom = ref('');
const dateTo = ref('');
const selectedUser = ref('');
const viewMode = ref('table');
const sortBy = ref('date');
const sortOrder = ref('desc');
const currentPage = ref(1);
const itemsPerPage = 20;

// Timer for live updates
let liveTimer = null;

// Helper function to format hours and minutes
const formatHoursMinutes = (totalHours) => {
  if (!totalHours) return '--';
  
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
};

// Computed properties
const filteredLogs = computed(() => {
  let logs = [...timeLogs.value];

  // Filter by date range
  if (dateFrom.value) {
    logs = logs.filter(log => log.date >= dateFrom.value);
  }
  if (dateTo.value) {
    logs = logs.filter(log => log.date <= dateTo.value);
  }

  // Filter by user
  if (selectedUser.value) {
    logs = logs.filter(log => log.userId === parseInt(selectedUser.value));
  }

  return logs;
});

const sortedFilteredLogs = computed(() => {
  let logs = [...filteredLogs.value];
  
  logs.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy.value) {
      case 'name':
        aValue = getUserName(a.userId);
        bValue = getUserName(b.userId);
        break;
      case 'hours':
        aValue = a.totalHours || 0;
        bValue = b.totalHours || 0;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default: // date
        aValue = new Date(a.date);
        bValue = new Date(b.date);
    }
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return logs.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / itemsPerPage);
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

const totalHours = computed(() => {
  return filteredLogs.value
    .filter(log => log.totalHours)
    .reduce((sum, log) => sum + log.totalHours, 0)
    .toFixed(1);
});

const activeSessions = computed(() => {
  return filteredLogs.value.filter(log => log.status === 'active').length;
});

const avgHoursPerDay = computed(() => {
  const days = new Set(filteredLogs.value.map(log => log.date)).size;
  if (days === 0) return '0.0';
  return (parseFloat(totalHours.value) / days).toFixed(1);
});

const hoursTrend = computed(() => {
  return Math.random() * 20 - 10;
});

const efficiencyPercentage = computed(() => {
  return Math.min((parseFloat(avgHoursPerDay.value) / 8) * 100, 100);
});

// Methods
const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
};

const getUserDepartment = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.department || 'N/A' : 'N/A';
};

const getEmployeeInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short'
  });
};

const calculateBreakDuration = (log) => {
  if (!log.breakStart || !log.breakEnd) return '0m';
  
  const breakStart = new Date(`2000-01-01T${log.breakStart}:00`);
  const breakEnd = new Date(`2000-01-01T${log.breakEnd}:00`);
  const minutes = Math.floor((breakEnd - breakStart) / (1000 * 60));
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

const getRowClass = (log) => {
  const classes = [];
  if (log.status === 'active') classes.push('active-row');
  if (log.overtime > 0) classes.push('overtime-row');
  if (log.totalHours < 6) classes.push('low-hours-row');
  return classes.join(' ');
};

const getCardClass = (log) => {
  const classes = [];
  if (log.status === 'active') classes.push('active-card');
  if (log.overtime > 0) classes.push('overtime-card');
  return classes.join(' ');
};

const getHoursClass = (hours) => {
  if (!hours) return 'no-hours';
  if (hours >= 8) return 'good';
  if (hours >= 6) return 'average';
  return 'low';
};

const getLiveTimer = (log) => {
  if (!log.clockIn || log.status !== 'active') return '';
  
  const now = new Date();
  const clockInTime = new Date(`${log.date}T${log.clockIn}:00`);
  const diff = now - clockInTime;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

const getTrendText = (type) => {
  const trends = {
    logs: 'vs last week',
    hours: 'vs target',
    productivity: 'efficiency score'
  };
  return trends[type] || '';
};

const getActiveSessionsText = () => {
  if (activeSessions.value === 0) return 'No active sessions';
  if (activeSessions.value === 1) return '1 person working';
  return `${activeSessions.value} people working`;
};

const getEfficiencyText = () => {
  const efficiency = efficiencyPercentage.value;
  if (efficiency >= 90) return 'Excellent';
  if (efficiency >= 75) return 'Good';
  if (efficiency >= 60) return 'Average';
  return 'Needs improvement';
};

const viewLogDetail = (log) => {
  console.log('Viewing log detail:', log);
};

const editLog = (log) => {
  console.log('Editing log:', log);
};

const exportSingleLog = (log) => {
  const employeeName = getUserName(log.userId);
  const csvContent = [
    ['Employee', 'Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Overtime', 'Status'].join(','),
    [
      employeeName,
      log.date,
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      log.totalHours || '',
      log.overtime || '',
      log.status
    ].join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${employeeName}_${log.date}_log.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportLogs = () => {
  if (selectedUser.value) {
    exportUserLogsToCSV(parseInt(selectedUser.value));
  } else {
    const allLogsData = filteredLogs.value.map(log => ({
      employee: getUserName(log.userId),
      date: log.date,
      clockIn: log.clockIn || '',
      clockOut: log.clockOut || '',
      breakStart: log.breakStart || '',
      breakEnd: log.breakEnd || '',
      totalHours: log.totalHours || '',
      overtime: log.overtime || '',
      status: log.status
    }));

    if (allLogsData.length === 0) return;

    const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Overtime', 'Status'];
    const csvContent = [
      headers.join(','),
      ...allLogsData.map(log => Object.values(log).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daily_logs_${dateFrom.value || 'all'}_to_${dateTo.value || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

// Watch for filter changes to reset pagination
watch([dateFrom, dateTo, selectedUser, sortBy, sortOrder], () => {
  currentPage.value = 1;
});

onMounted(() => {
  liveTimer = setInterval(() => {
    const activeLog = filteredLogs.value.find(log => log.status === 'active');
    if (activeLog) {
      timeLogs.value = [...timeLogs.value];
    }
  }, 60000);
});

onUnmounted(() => {
  if (liveTimer) {
    clearInterval(liveTimer);
  }
});
</script>

<style scoped>
/* Main Container */
.daily-logs {
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
  background: #f8fafc;
}

/* Header Section */
.logs-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
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

.logs-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.date-filter-group {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.date-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-filter label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.date-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #1e293b;
  transition: all 0.2s ease;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
  min-width: 200px;
}

.user-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.export-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Summary Cards */
.logs-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h4 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1;
}

.card-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Logs Section */
.logs-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.view-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.25rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.toggle-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.toggle-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.sort-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.sort-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.875rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.sort-order-btn {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-order-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* Table View */
.logs-table-container {
  overflow-x: auto;
  padding: 0;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  font-size: 0.875rem;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.logs-table tbody tr {
  transition: all 0.2s ease;
}

.logs-table tbody tr:hover {
  background: #f8fafc;
}

.employee-cell {
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

.employee-info {
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

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-main {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  line-height: 1;
}

.date-day {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1;
}

.time-display {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.break-duration {
  font-weight: 600;
  color: #f59e0b;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.hours-value {
  font-size: 1rem;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.hours-value.good {
  color: #10b981;
}

.hours-value.average {
  color: #f59e0b;
}

.hours-value.low {
  color: #ef4444;
}

.hours-value.no-hours {
  color: #94a3b8;
}

.overtime-badge {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  display: inline-block;
}

.no-overtime {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.875rem;
}

.status-badge {
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.8rem;
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
  background: #f8fafc;
}

.no-logs {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.no-logs-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-logs h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.no-logs p {
  margin: 0;
  font-size: 0.95rem;
}

/* Cards View */
.logs-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.log-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid #e2e8f0;
}

.log-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.log-card-header {
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.employee-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.employee-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.log-card-content {
  padding: 1.5rem;
}

.card-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-date-main {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
}

.card-date-day {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-value {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.time-value.hours {
  font-size: 1.25rem;
}

.time-value.hours.good {
  color: #10b981;
}

.time-value.hours.average {
  color: #f59e0b;
}

.time-value.hours.low {
  color: #ef4444;
}

.overtime-section {
  margin-top: 1rem;
}

.overtime-badge-card {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.3);
  text-align: center;
}

.log-card-footer {
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.card-action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  flex: 1;
  justify-content: center;
}

.card-action-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.card-action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.card-action-btn.secondary {
  background: white;
  color: #374151;
  border: 2px solid #e2e8f0;
}

.card-action-btn.secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.no-logs-cards {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
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
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #374151;
}

.page-number.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
}

.page-info {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .logs-cards {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .daily-logs {
    padding: 1rem;
  }

  .logs-header {
    padding: 1.5rem;
  }

  .header-content h2 {
    font-size: 1.75rem;
  }

  .logs-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .date-filter-group {
    flex-direction: column;
    width: 100%;
  }

  .date-input {
    width: 100%;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .user-select {
    width: 100%;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }

  .logs-summary {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .view-controls {
    flex-direction: column;
    width: 100%;
  }

  .view-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    justify-content: center;
  }

  .sort-controls {
    width: 100%;
  }

  .sort-select {
    flex: 1;
  }

  .logs-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .logs-table {
    min-width: 800px;
  }

  .logs-cards {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .time-grid {
    grid-template-columns: 1fr;
  }

  .log-card-footer {
    flex-direction: column;
  }

  .pagination {
    padding: 1.5rem;
    gap: 0.75rem;
  }

  .page-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .daily-logs {
    padding: 0.75rem;
  }

  .logs-header {
    padding: 1.25rem;
  }

  .header-content h2 {
    font-size: 1.5rem;
  }

  .header-content p {
    font-size: 0.9rem;
  }

  .summary-card {
    padding: 1.5rem;
  }

  .card-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }

  .card-content h4 {
    font-size: 1.75rem;
  }

  .logs-cards {
    padding: 1rem;
  }

  .log-card-header,
  .log-card-content,
  .log-card-footer {
    padding: 1.25rem;
  }
}
</style>