<template>
  <div class="manager-logs">
    <div class="header">
      <h2>Employee Activity Logs</h2>
      <p>Inspect employee-level daily logs, clock histories, and productivity charts</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading activity logs...</p>
    </div>

    <template v-else>
      <!-- Filters and Controls -->
      <div class="controls">
        <div class="filters">
          <select v-model="selectedEmployee" @change="applyFilters" class="employee-select">
            <option value="">All Employees</option>
            <option v-for="employee in employees" :key="employee.id" :value="employee.id">
              {{ employee.name }}
            </option>
          </select>

          <select v-model="selectedPeriod" @change="applyFilters" class="period-select">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>

          <select v-model="selectedStatus" @change="applyFilters" class="status-select">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>

          <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters-btn">
            <span>🔄</span>
            Clear Filters
          </button>
        </div>

        <div class="actions">
          <button class="export-btn" @click="exportAllLogs" :disabled="filteredLogs.length === 0 || isExporting">
            <span class="btn-icon">📊</span>
            <span>{{ isExporting ? 'Exporting...' : 'Export All' }}</span>
          </button>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h4>{{ filteredLogs.length }}</h4>
            <p>Total Logs</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <h4>{{ totalHours }}</h4>
            <p>Total Hours</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h4>{{ averageHours }}</h4>
            <p>Avg Hours/Day</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <h4>{{ activeEmployees }}</h4>
            <p>Active Today</p>
          </div>
        </div>
      </div>

      <!-- Activity Logs Table -->
      <div class="logs-table">
        <div class="table-header">
          <div class="col-employee">Employee</div>
          <div class="col-date">Date</div>
          <div class="col-times">Clock Times</div>
          <div class="col-hours">Hours</div>
          <div class="col-status">Status</div>
          <div class="col-actions">Actions</div>
        </div>

        <div v-for="log in paginatedLogs" :key="`${log.userId}-${log.date}-${log.id}`" class="table-row">
          <div class="col-employee">
            <div class="employee-info">
              <div class="employee-avatar">{{ getEmployeeInitials(log.userId) }}</div>
              <span class="employee-name">{{ getEmployeeName(log.userId) }}</span>
            </div>
          </div>

          <div class="col-date">
            <div class="date-main">{{ formatDate(log.date) }}</div>
            <div class="date-sub">{{ formatDay(log.date) }}</div>
          </div>

          <div class="col-times">
            <div class="times">
              <span class="time-in">{{ log.clockIn || '--:--' }}</span>
              <span class="time-separator">→</span>
              <span class="time-out">{{ log.clockOut || 'Active' }}</span>
            </div>
            <div v-if="log.breakStart" class="break-info">
              Break: {{ log.breakStart }} - {{ log.breakEnd || 'Active' }}
            </div>
          </div>

          <div class="col-hours">
            <span class="hours-value">{{ (log.totalHours || 0).toFixed(1) }}</span>
            <span class="hours-unit">h</span>
          </div>

          <div class="col-status">
            <span class="status-badge" :class="log.clockOut ? 'completed' : 'active'">
              {{ log.clockOut ? 'Completed' : 'Active' }}
            </span>
          </div>

          <div class="col-actions">
            <button class="action-btn view" @click="viewLogDetails(log)" title="View Details">
              👁️
            </button>
            <button class="action-btn export" @click="exportSingleLog(log)" title="Export">
              📊
            </button>
          </div>
        </div>

        <div v-if="paginatedLogs.length === 0" class="no-logs">
          <div class="no-logs-icon">📋</div>
          <h3>No logs found</h3>
          <p>{{ noLogsMessage }}</p>
          <button v-if="hasActiveFilters" @click="clearFilters" class="reset-btn">
            Reset Filters
          </button>
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

      <!-- Productivity Chart -->
      <div class="productivity-chart">
        <h3>Team Productivity Overview (Last 7 Days)</h3>
        <div class="chart-container">
          <div class="chart-bars">
            <div v-for="(day, index) in productivityData" :key="index" class="chart-bar">
              <div class="bar-group">
                <div
                  class="bar-fill productive"
                  :style="{ height: day.percentage + '%' }"
                  :title="`${day.hours.toFixed(1)}h worked`"
                >
                  <span v-if="day.hours > 0" class="bar-value">{{ day.hours.toFixed(1) }}h</span>
                </div>
              </div>
              <span class="chart-label">{{ day.day }}</span>
            </div>
          </div>

          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color productive"></div>
              <span>Hours Worked</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { users, timeLogs } from '@/composables/useManagerStore.js';

// Reactive state
const selectedEmployee = ref('');
const selectedPeriod = ref('week');
const selectedStatus = ref('');
const currentPage = ref(1);
const isLoading = ref(true);
const isExporting = ref(false);
const logsPerPage = 10;

// Get employees (excluding general managers)
const employees = computed(() => {
  return users.value.filter(u => u.role !== 'general_manager');
});

// Computed: Has active filters
const hasActiveFilters = computed(() => {
  return !!(selectedEmployee.value || selectedStatus.value || selectedPeriod.value !== 'week');
});

// Computed: Filtered logs
const filteredLogs = computed(() => {
  console.log('🔍 Filtering logs...');
  console.log('📝 Total available logs:', timeLogs.value.length);
  
  let filtered = [...timeLogs.value];

  // Filter by employee
  if (selectedEmployee.value) {
    const employeeId = parseInt(selectedEmployee.value);
    filtered = filtered.filter(log => log.userId === employeeId);
    console.log(`👤 Filtered by employee ${employeeId}:`, filtered.length, 'logs');
  }

  // Filter by period
  const now = new Date();
  let cutoffDate = new Date();

  switch (selectedPeriod.value) {
    case 'week':
      cutoffDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      cutoffDate.setDate(now.getDate() - 30);
      break;
    case 'quarter':
      cutoffDate.setDate(now.getDate() - 90);
      break;
    case 'all':
      cutoffDate = new Date(0); // Beginning of time
      break;
  }

  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  filtered = filtered.filter(log => log.date >= cutoffStr);
  console.log(`📅 Filtered by period ${selectedPeriod.value}:`, filtered.length, 'logs');

  // Filter by status
  if (selectedStatus.value) {
    if (selectedStatus.value === 'completed') {
      filtered = filtered.filter(log => log.clockOut);
    } else if (selectedStatus.value === 'active') {
      filtered = filtered.filter(log => !log.clockOut);
    }
    console.log(`🔖 Filtered by status ${selectedStatus.value}:`, filtered.length, 'logs');
  }

  // Sort by date (newest first)
  const sorted = filtered.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    // If same date, sort by clock in time
    return (b.clockIn || '').localeCompare(a.clockIn || '');
  });

  console.log('✅ Final filtered logs:', sorted.length);
  return sorted;
});

// Computed: Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / logsPerPage);
});

// Computed: Paginated logs
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * logsPerPage;
  const end = start + logsPerPage;
  return filteredLogs.value.slice(start, end);
});

// Computed: Total hours
const totalHours = computed(() => {
  const total = filteredLogs.value.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  return total.toFixed(1);
});

// Computed: Average hours
const averageHours = computed(() => {
  const completedLogs = filteredLogs.value.filter(log => log.clockOut);
  if (completedLogs.length === 0) return '0.0';

  const total = completedLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  const uniqueDays = new Set(completedLogs.map(log => log.date)).size;

  return uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : '0.0';
});

// Computed: Active employees today
const activeEmployees = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = filteredLogs.value.filter(log => log.date === today && log.clockIn && !log.clockOut);
  return new Set(todayLogs.map(log => log.userId)).size;
});

// Computed: No logs message
const noLogsMessage = computed(() => {
  if (selectedEmployee.value) {
    const employee = employees.value.find(e => e.id === parseInt(selectedEmployee.value));
    return `No logs found for ${employee?.name || 'selected employee'} in ${selectedPeriod.value}`;
  }
  if (selectedStatus.value) {
    return `No ${selectedStatus.value} logs found for ${selectedPeriod.value}`;
  }
  if (selectedPeriod.value !== 'week') {
    return `No logs found for ${selectedPeriod.value}`;
  }
  return 'No activity logs available. Employees will appear here once they clock in.';
});

// Computed: Productivity data (last 7 days)
const productivityData = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = days[date.getDay()];

    // Get total hours for this day
    const dayLogs = timeLogs.value.filter(log => log.date === dateStr);
    const totalHours = dayLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

    // Calculate percentage (max 10 hours = 100%)
    const maxHours = 10;
    const percentage = Math.min(100, (totalHours / maxHours) * 100);

    data.push({
      day: dayName,
      hours: totalHours,
      percentage: percentage
    });
  }

  return data;
});

// Methods
const getEmployeeName = (userId) => {
  const employee = users.value.find(u => u.id === userId);
  return employee ? employee.name : 'Unknown Employee';
};

const getEmployeeInitials = (userId) => {
  const name = getEmployeeName(userId);
  if (!name || name === 'Unknown Employee') return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (error) {
    return dateString;
  }
};

const formatDay = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch (error) {
    return '';
  }
};

const applyFilters = () => {
  console.log('🔄 Applying filters...');
  currentPage.value = 1; // Reset to first page when filters change
};

const clearFilters = () => {
  selectedEmployee.value = '';
  selectedPeriod.value = 'week';
  selectedStatus.value = '';
  currentPage.value = 1;
};

const viewLogDetails = (log) => {
  const employee = getEmployeeName(log.userId);
  const details = `
Log Details:
━━━━━━━━━━━━━━━━━━━━
Employee: ${employee}
Date: ${formatDate(log.date)} (${formatDay(log.date)})
Clock In: ${log.clockIn || 'N/A'}
Clock Out: ${log.clockOut || 'Still Active'}
${log.breakStart ? `Break: ${log.breakStart} - ${log.breakEnd || 'Active'}` : 'No breaks'}
Total Hours: ${(log.totalHours || 0).toFixed(2)}h
Status: ${log.clockOut ? 'Completed' : 'In Progress'}
  `.trim();
  
  alert(details);
};

const exportSingleLog = (log) => {
  try {
    const employeeName = getEmployeeName(log.userId);
    const headers = ['Employee', 'Date', 'Day', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
    const row = [
      employeeName,
      log.date,
      formatDay(log.date),
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      (log.totalHours || 0).toFixed(2),
      log.clockOut ? 'Completed' : 'Active'
    ];

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      row.map(cell => `"${cell}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${employeeName.replace(/\s+/g, '_')}_${log.date}_log.csv`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('✅ Single log exported');
  } catch (error) {
    console.error('❌ Failed to export single log:', error);
    alert('Failed to export log. Please try again.');
  }
};

const exportAllLogs = () => {
  if (filteredLogs.value.length === 0) {
    alert('No logs to export');
    return;
  }

  try {
    isExporting.value = true;

    const headers = ['Employee', 'Date', 'Day', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
    const rows = filteredLogs.value.map(log => [
      getEmployeeName(log.userId),
      log.date,
      formatDay(log.date),
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      (log.totalHours || 0).toFixed(2),
      log.clockOut ? 'Completed' : 'Active'
    ]);

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_logs_${selectedPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('✅ All logs exported:', filteredLogs.value.length, 'records');
    alert(`Successfully exported ${filteredLogs.value.length} logs!`);
  } catch (error) {
    console.error('❌ Failed to export logs:', error);
    alert('Failed to export logs. Please try again.');
  } finally {
    isExporting.value = false;
  }
};

// Watch for page changes beyond total pages
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal && newTotal > 0) {
    currentPage.value = newTotal;
  }
});

// Initialize
onMounted(() => {
  console.log('🚀 ManagerLogs component mounted');
  console.log('📊 Available users:', users.value.length);
  console.log('📝 Available logs:', timeLogs.value.length);
  
  isLoading.value = false;
});
</script>

<style scoped>
.manager-logs {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2.5rem;
}

.header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.header p {
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.5;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.spinner {
  width: 56px;
  height: 56px;
  border: 5px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 500;
}

/* Controls */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
}

.employee-select,
.period-select,
.status-select {
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  min-width: 180px;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 500;
  color: #1e293b;
}

.employee-select:focus,
.period-select:focus,
.status-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.clear-filters-btn {
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.clear-filters-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  padding: 0.875rem 1.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.25rem;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.75rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.stat-icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 14px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.stat-content h4 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  line-height: 1;
}

.stat-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Logs Table */
.logs-table {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.5fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.5fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
  transform: translateX(4px);
}

.table-row:last-child {
  border-bottom: none;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.date-main {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
  line-height: 1.4;
}

.date-sub {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.times {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.time-in,
.time-out {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.time-separator {
  color: #9ca3af;
  font-weight: 700;
}

.break-info {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
  font-weight: 500;
}

.hours-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  line-height: 1;
}

.hours-unit {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  margin-left: 0.25rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-block;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-badge.completed,
.status-badge.complete {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.6rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.view:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.action-btn.export:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  transform: translateY(-2px);
}

/* No Logs State */
.no-logs {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.no-logs-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.no-logs h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.no-logs p {
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
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
  transform: none;
}

.page-info {
  color: #64748b;
  font-weight: 600;
  font-size: 1rem;
}

/* Productivity Chart */
.productivity-chart {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.productivity-chart h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
}

.chart-container {
  margin-top: 1.5rem;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 240px;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(to top, #f8fafc 0%, transparent 100%);
  border-radius: 12px;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
  margin: 0 0.5rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 56px;
  height: 100%;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 8px 8px 0 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0.5rem 0.25rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
  min-height: 20px;
}

.bar-fill:hover {
  transform: scaleY(1.03);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.bar-fill.productive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.bar-fill.break-time {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  margin-top: 4px;
}

.bar-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.chart-label {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
}

.legend-color {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.legend-color.productive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.legend-color.break-time {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .table-header,
  .table-row {
    grid-template-columns: 1.5fr 1fr 1.5fr 0.8fr 0.8fr 0.8fr;
  }
}

@media (max-width: 1024px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-bars {
    height: 200px;
  }

  .bar-group {
    max-width: 48px;
  }
}

@media (max-width: 768px) {
  .manager-logs {
    padding: 1rem;
  }

  .header h2 {
    font-size: 2rem;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .employee-select,
  .period-select,
  .status-select {
    width: 100%;
  }

  .clear-filters-btn {
    width: 100%;
    justify-content: center;
  }

  .actions {
    width: 100%;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }

  .stats-overview {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.5rem;
  }

  .stat-icon {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .table-row:hover {
    transform: none;
  }

  .col-employee,
  .col-date,
  .col-times,
  .col-hours,
  .col-status,
  .col-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .col-actions {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .employee-info {
    width: 100%;
  }

  .chart-bars {
    height: 160px;
  }

  .bar-group {
    max-width: 36px;
  }

  .chart-legend {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }

  .page-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .manager-logs {
    padding: 0.75rem;
  }

  .header h2 {
    font-size: 1.75rem;
  }

  .header p {
    font-size: 1rem;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }

  .stat-content h4 {
    font-size: 2rem;
  }

  .table-row {
    padding: 1.25rem;
  }

  .chart-bars {
    height: 140px;
    padding: 0.5rem;
  }

  .bar-group {
    max-width: 28px;
  }

  .chart-label {
    font-size: 0.75rem;
  }
}
</style>