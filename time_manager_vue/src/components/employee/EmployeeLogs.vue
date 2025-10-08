<template>
  <div class="employee-logs">
    <div class="header">
      <h2>My Time Logs</h2>
      <p>View your complete work history</p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="selectedPeriod" @change="loadLogs" class="period-select">
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="quarter">Last 3 Months</option>
        <option value="all">All Time</option>
      </select>

      <div class="export-section">
        <button class="export-btn" @click="exportLogs" :disabled="filteredLogs.length === 0">
          <span class="btn-icon">📊</span>
          Export to CSV
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">⏰</div>
        <div class="card-content">
          <h4>{{ totalHours }}</h4>
          <p>Total Hours</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">📅</div>
        <div class="card-content">
          <h4>{{ workDays }}</h4>
          <p>Work Days</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <h4>{{ averageHours }}</h4>
          <p>Avg Daily</p>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">🏆</div>
        <div class="card-content">
          <h4>{{ longestDay }}</h4>
          <p>Best Day</p>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-table">
      <div class="table-header">
        <div class="col-date">Date</div>
        <div class="col-times">Clock In/Out</div>
        <div class="col-hours">Hours</div>
        <div class="col-status">Status</div>
      </div>

      <div v-for="log in filteredLogs" :key="log.id" class="table-row">
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
      </div>

      <div v-if="filteredLogs.length === 0" class="no-logs">
        <div class="no-logs-icon">📋</div>
        <h3>No logs found</h3>
        <p>{{ noLogsMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { recentLogs, weeklyHours, monthlyHours, timeLogs } from '@/composables/useEmployeeStore.js';

const selectedPeriod = ref('month');

// Use actual store data instead of mock data
const allLogs = computed(() => timeLogs.value);

const filteredLogs = computed(() => {
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
      cutoffDate = new Date(2020, 0, 1); // Far past date
      break;
  }

  return allLogs.value
    .filter(log => new Date(log.date) >= cutoffDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
});

const totalHours = computed(() => {
  return filteredLogs.value
    .reduce((total, log) => total + (log.totalHours || 0), 0)
    .toFixed(1);
});

const workDays = computed(() => {
  return filteredLogs.value.filter(log => log.totalHours > 0).length;
});

const averageHours = computed(() => {
  const days = workDays.value;
  if (days === 0) return '0.0';
  return (parseFloat(totalHours.value) / days).toFixed(1);
});

const longestDay = computed(() => {
  const maxHours = Math.max(...filteredLogs.value.map(log => log.totalHours || 0));
  return maxHours > 0 ? maxHours.toFixed(1) : '0.0';
});

const noLogsMessage = computed(() => {
  switch (selectedPeriod.value) {
    case 'week':
      return 'No logs for this week yet';
    case 'month':
      return 'No logs for this month yet';
    case 'quarter':
      return 'No logs for the last 3 months';
    default:
      return 'No time logs found';
  }
});

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
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const loadLogs = () => {
  // In real implementation, this would fetch logs based on selected period
  console.log('Loading logs for period:', selectedPeriod.value);
};

const exportLogs = () => {
  if (filteredLogs.value.length === 0) return;

  const headers = ['Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
  const csvContent = [
    headers.join(','),
    ...filteredLogs.value.map(log => [
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
  link.download = `time_logs_${selectedPeriod.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.employee-logs {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
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

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.period-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  min-width: 150px;
}

.export-section {
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
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

.card-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.card-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.logs-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1.5fr 2fr 1fr 1fr;
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
  grid-template-columns: 1.5fr 2fr 1fr 1fr;
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

.col-date {
  display: flex;
  flex-direction: column;
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

.col-times {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
}

.col-hours {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
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

.no-logs {
  text-align: center;
  padding: 4rem 2rem;
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
  .employee-logs {
    padding: 1rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }

  .col-date,
  .col-times,
  .col-hours,
  .col-status {
    padding: 0.5rem 0;
  }

  .col-times {
    order: 2;
  }

  .col-hours {
    order: 3;
  }

  .col-status {
    order: 4;
  }
}
</style>
