<template>
  <div class="manager-logs">
    <div class="header">
      <h2>Employee Activity Logs</h2>
      <p>Inspect employee-level daily logs, clock histories, and productivity charts</p>
    </div>

    <!-- Filters and Controls -->
    <div class="controls">
      <div class="filters">
        <select v-model="selectedEmployee" @change="loadEmployeeLogs" class="employee-select">
          <option value="">All Employees</option>
          <option v-for="employee in employees" :key="employee.id" :value="employee.id">
            {{ employee.name }}
          </option>
        </select>

        <select v-model="selectedPeriod" @change="loadEmployeeLogs" class="period-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">Last 3 Months</option>
        </select>

        <select v-model="selectedStatus" @change="loadEmployeeLogs" class="status-select">
          <option value="">All Status</option>
          <option value="complete">Completed</option>
          <option value="active">Active</option>
        </select>
      </div>

      <div class="actions">
        <button class="export-btn" @click="exportAllLogs" :disabled="filteredLogs.length === 0">
          <span class="btn-icon">📊</span>
          Export All
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

      <div v-for="log in paginatedLogs" :key="`${log.employeeId}-${log.id}`" class="table-row">
        <div class="col-employee">
          <div class="employee-info">
            <div class="employee-avatar">{{ getEmployeeInitials(log.employeeId) }}</div>
            <span class="employee-name">{{ getEmployeeName(log.employeeId) }}</span>
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
          <span class="hours-value">{{ log.totalHours || 0 }}</span>
          <span class="hours-unit">h</span>
        </div>

        <div class="col-status">
          <span class="status-badge" :class="log.status">
            {{ log.status === 'active' ? 'Active' : 'Completed' }}
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
      <h3>Team Productivity Overview</h3>
      <div class="chart-container">
        <div class="chart-bars">
          <div v-for="(day, index) in productivityData" :key="index" class="chart-bar">
            <div class="bar-group">
              <div
                class="bar-fill productive"
                :style="{ height: day.productive + '%' }"
                :title="`${day.productive}% productive`"
              ></div>
              <div
                class="bar-fill break-time"
                :style="{ height: day.breakTime + '%' }"
                :title="`${day.breakTime}% break time`"
              ></div>
            </div>
            <span class="chart-label">{{ day.day }}</span>
          </div>
        </div>

        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color productive"></div>
            <span>Productive Time</span>
          </div>
          <div class="legend-item">
            <div class="legend-color break-time"></div>
            <span>Break Time</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { users } from '@/composables/useManagerStore.js';

const selectedEmployee = ref('');
const selectedPeriod = ref('week');
const selectedStatus = ref('');
const currentPage = ref(1);
const logsPerPage = 10;

// Mock employees data
const employees = computed(() =>
  users.value.filter(u => u.role === 'employee')
);

// Mock logs data - in real app this would come from API
const allLogs = ref([
  {
    id: 1,
    employeeId: 2,
    date: '2024-10-04',
    clockIn: '09:00',
    clockOut: '17:30',
    breakStart: '12:00',
    breakEnd: '12:30',
    totalHours: 8.0,
    status: 'complete'
  },
  {
    id: 2,
    employeeId: 3,
    date: '2024-10-04',
    clockIn: '08:45',
    clockOut: '17:15',
    breakStart: '12:15',
    breakEnd: '12:45',
    totalHours: 7.5,
    status: 'complete'
  },
  {
    id: 3,
    employeeId: 4,
    date: '2024-10-04',
    clockIn: '09:15',
    clockOut: null,
    breakStart: null,
    breakEnd: null,
    totalHours: 0,
    status: 'active'
  },
  {
    id: 4,
    employeeId: 2,
    date: '2024-10-03',
    clockIn: '09:00',
    clockOut: '17:45',
    breakStart: '12:30',
    breakEnd: '13:00',
    totalHours: 8.25,
    status: 'complete'
  },
  {
    id: 5,
    employeeId: 3,
    date: '2024-10-03',
    clockIn: '08:30',
    clockOut: '17:00',
    breakStart: '12:00',
    breakEnd: '12:15',
    totalHours: 7.75,
    status: 'complete'
  }
]);

const filteredLogs = computed(() => {
  let filtered = [...allLogs.value];

  // Filter by employee
  if (selectedEmployee.value) {
    filtered = filtered.filter(log => log.employeeId === parseInt(selectedEmployee.value));
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
  }

  filtered = filtered.filter(log => new Date(log.date) >= cutoffDate);

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(log => log.status === selectedStatus.value);
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
});

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / logsPerPage);
});

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * logsPerPage;
  const end = start + logsPerPage;
  return filteredLogs.value.slice(start, end);
});

const totalHours = computed(() => {
  return filteredLogs.value
    .reduce((total, log) => total + (log.totalHours || 0), 0)
    .toFixed(1);
});

const averageHours = computed(() => {
  const completedLogs = filteredLogs.value.filter(log => log.status === 'complete');
  if (completedLogs.length === 0) return '0.0';

  const total = completedLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  const uniqueDays = new Set(completedLogs.map(log => log.date)).size;

  return uniqueDays > 0 ? (total / uniqueDays).toFixed(1) : '0.0';
});

const activeEmployees = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = filteredLogs.value.filter(log => log.date === today);
  return new Set(todayLogs.map(log => log.employeeId)).size;
});

const noLogsMessage = computed(() => {
  if (selectedEmployee.value && selectedPeriod.value) {
    return `No logs found for selected employee in ${selectedPeriod.value}`;
  }
  if (selectedEmployee.value) {
    return 'No logs found for selected employee';
  }
  if (selectedPeriod.value) {
    return `No logs found for ${selectedPeriod.value}`;
  }
  return 'No activity logs found';
});

// Mock productivity data
const productivityData = ref([
  { day: 'Mon', productive: 75, breakTime: 15 },
  { day: 'Tue', productive: 80, breakTime: 12 },
  { day: 'Wed', productive: 70, breakTime: 18 },
  { day: 'Thu', productive: 85, breakTime: 10 },
  { day: 'Fri', productive: 78, breakTime: 14 },
  { day: 'Sat', productive: 0, breakTime: 0 },
  { day: 'Sun', productive: 0, breakTime: 0 }
]);

const getEmployeeName = (employeeId) => {
  const employee = employees.value.find(emp => emp.id === employeeId);
  return employee ? employee.name : 'Unknown Employee';
};

const getEmployeeInitials = (employeeId) => {
  const name = getEmployeeName(employeeId);
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const loadEmployeeLogs = () => {
  currentPage.value = 1;
  // In real implementation, this would fetch logs based on filters
};

const viewLogDetails = (log) => {
  // In real implementation, this would open a detailed view modal
  console.log('Viewing log details:', log);
  alert(`Log Details:\nEmployee: ${getEmployeeName(log.employeeId)}\nDate: ${formatDate(log.date)}\nClock In: ${log.clockIn}\nClock Out: ${log.clockOut}\nTotal Hours: ${log.totalHours}h`);
};

const exportSingleLog = (log) => {
  const employeeName = getEmployeeName(log.employeeId);
  const csvContent = [
    ['Employee', 'Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'].join(','),
    [employeeName, log.date, log.clockIn || '', log.clockOut || '', log.breakStart || '', log.breakEnd || '', log.totalHours || '', log.status].join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${employeeName}_${log.date}_log.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportAllLogs = () => {
  if (filteredLogs.value.length === 0) return;

  const headers = ['Employee', 'Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
  const csvContent = [
    headers.join(','),
    ...filteredLogs.value.map(log => [
      getEmployeeName(log.employeeId),
      log.date,
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      log.totalHours || '',
      log.status
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `employee_logs_${selectedPeriod.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  loadEmployeeLogs();
});
</script>

<style scoped>
.manager-logs {
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.header p {
  color: #64748b;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.employee-select,
.period-select,
.status-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  min-width: 150px;
}

.actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.stat-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.logs-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.5fr 0.8fr 0.8fr 1fr;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
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
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.date-main {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.date-sub {
  color: #64748b;
  font-size: 0.8rem;
}

.times {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-in,
.time-out {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
  color: #1e293b;
}

.time-separator {
  color: #9ca3af;
}

.break-info {
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
  margin-top: 0.25rem;
}

.hours-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
}

.hours-unit {
  color: #64748b;
  font-weight: 500;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.complete {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.action-btn.view:hover {
  background: #dbeafe;
}

.action-btn.export:hover {
  background: #f3f4f6;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-weight: 500;
}

.productivity-chart {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.productivity-chart h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.chart-container {
  margin-top: 1rem;
}

.chart-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 200px;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin: 0 0.25rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  height: 100%;
  position: relative;
}

.bar-fill {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.bar-fill.productive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.bar-fill.break-time {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  margin-top: 2px;
}

.chart-label {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #64748b;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.productive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.legend-color.break-time {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.no-logs {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-logs-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-logs h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.no-logs p {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .manager-logs {
    padding: 1rem;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    flex-direction: column;
    gap: 0.5rem;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }

  .employee-info {
    flex-direction: column;
    text-align: center;
  }

  .chart-bars {
    height: 150px;
  }

  .bar-group {
    width: 30px;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
