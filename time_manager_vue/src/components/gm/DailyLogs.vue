<template>
  <div class="daily-logs">
    <div class="logs-header">
      <h2>Daily Logs Overview</h2>
      <div class="logs-controls">
        <div class="date-filter">
          <label for="date-from">From:</label>
          <input
            id="date-from"
            v-model="dateFrom"
            type="date"
            class="date-input"
          />
          <label for="date-to">To:</label>
          <input
            id="date-to"
            v-model="dateTo"
            type="date"
            class="date-input"
          />
        </div>
        <div class="user-filter">
          <select v-model="selectedUser" class="user-select">
            <option value="">All Users</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.name }}
            </option>
          </select>
        </div>
        <button class="export-btn" @click="exportLogs">
          📥 Export CSV
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="logs-summary">
      <div class="summary-card">
        <h4>{{ filteredLogs.length }}</h4>
        <p>Total Logs</p>
      </div>
      <div class="summary-card">
        <h4>{{ totalHours }}h</h4>
        <p>Total Hours</p>
      </div>
      <div class="summary-card">
        <h4>{{ activeSessions }}</h4>
        <p>Active Sessions</p>
      </div>
      <div class="summary-card">
        <h4>{{ avgHoursPerDay }}h</h4>
        <p>Avg Hours/Day</p>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="logs-section">
      <div class="section-header">
        <h3>Time Logs</h3>
        <div class="view-toggle">
          <button
            :class="['toggle-btn', { active: viewMode === 'table' }]"
            @click="viewMode = 'table'"
          >
            📋 Table
          </button>
          <button
            :class="['toggle-btn', { active: viewMode === 'cards' }]"
            @click="viewMode = 'cards'"
          >
            🃏 Cards
          </button>
        </div>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break Start</th>
              <th>Break End</th>
              <th>Total Hours</th>
              <th>Overtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id">
              <td>{{ formatDate(log.date) }}</td>
              <td>{{ getUserName(log.userId) }}</td>
              <td>{{ log.clockIn || '--:--' }}</td>
              <td>{{ log.clockOut || '--:--' }}</td>
              <td>{{ log.breakStart || '--:--' }}</td>
              <td>{{ log.breakEnd || '--:--' }}</td>
              <td :class="{ 'text-success': log.totalHours && log.totalHours >= 8 }">
                {{ log.totalHours ? `${log.totalHours}h` : '--' }}
              </td>
              <td :class="{ 'text-warning': log.overtime && log.overtime > 0 }">
                {{ log.overtime ? `${log.overtime}h` : '--' }}
              </td>
              <td>
                <span :class="['status-badge', log.status]">
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards View -->
      <div v-else class="logs-cards">
        <div v-for="log in filteredLogs" :key="log.id" class="log-card">
          <div class="log-card-header">
            <div class="log-date">{{ formatDate(log.date) }}</div>
            <div class="log-user">{{ getUserName(log.userId) }}</div>
            <span :class="['status-badge', log.status]">{{ log.status }}</span>
          </div>

          <div class="log-times">
            <div class="time-row">
              <span class="time-label">Clock In:</span>
              <span class="time-value">{{ log.clockIn || '--:--' }}</span>
            </div>
            <div class="time-row">
              <span class="time-label">Clock Out:</span>
              <span class="time-value">{{ log.clockOut || '--:--' }}</span>
            </div>
            <div class="time-row">
              <span class="time-label">Break:</span>
              <span class="time-value">
                {{ log.breakStart || '--:--' }} - {{ log.breakEnd || '--:--' }}
              </span>
            </div>
          </div>

          <div class="log-summary">
            <div class="summary-item">
              <span class="summary-label">Total:</span>
              <span class="summary-value" :class="{ 'text-success': log.totalHours && log.totalHours >= 8 }">
                {{ log.totalHours ? `${log.totalHours}h` : '--' }}
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Overtime:</span>
              <span class="summary-value" :class="{ 'text-warning': log.overtime && log.overtime > 0 }">
                {{ log.overtime ? `${log.overtime}h` : '--' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination (if needed) -->
    <div v-if="filteredLogs.length > 50" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
        Previous
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { users, timeLogs, exportUserLogsToCSV } from '@/composables/useGmStore.js';

const dateFrom = ref('');
const dateTo = ref('');
const selectedUser = ref('');
const viewMode = ref('table');
const currentPage = ref(1);
const itemsPerPage = 50;

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

  // Sort by date (newest first)
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));

  return logs;
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
  if (days === 0) return 0;
  return (parseFloat(totalHours.value) / days).toFixed(1);
});

const totalPages = computed(() => {
  return Math.ceil(filteredLogs.value.length / itemsPerPage);
});

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
};

const exportLogs = () => {
  if (selectedUser.value) {
    exportUserLogsToCSV(parseInt(selectedUser.value));
  } else {
    // Export all logs
    const allLogsData = filteredLogs.value.map(log => ({
      date: log.date,
      user: getUserName(log.userId),
      clockIn: log.clockIn || '',
      clockOut: log.clockOut || '',
      breakStart: log.breakStart || '',
      breakEnd: log.breakEnd || '',
      totalHours: log.totalHours || '',
      overtime: log.overtime || '',
      status: log.status
    }));

    if (allLogsData.length === 0) return;

    const headers = ['Date', 'User', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Overtime', 'Status'];
    const csvContent = [
      headers.join(','),
      ...allLogsData.map(log => [
        log.date,
        log.user,
        log.clockIn,
        log.clockOut,
        log.breakStart,
        log.breakEnd,
        log.totalHours,
        log.overtime,
        log.status
      ].join(','))
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
watch([dateFrom, dateTo, selectedUser], () => {
  currentPage.value = 1;
});
</script>

<style scoped>
.daily-logs {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.logs-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.logs-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-filter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.user-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 150px;
}

.export-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn:hover {
  transform: translateY(-1px);
}

.logs-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.summary-card h4 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.summary-card p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.logs-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
}

.logs-table-container {
  overflow-x: auto;
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
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.text-success {
  color: #10b981;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.complete {
  background: #e0e7ff;
  color: #3730a3;
}

.logs-cards {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.log-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.log-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.log-date {
  font-weight: 600;
  color: #1e293b;
}

.log-user {
  color: #64748b;
  font-size: 0.9rem;
}

.log-times {
  margin-bottom: 1rem;
}

.time-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.time-label {
  color: #64748b;
  font-size: 0.9rem;
}

.time-value {
  font-weight: 500;
  color: #1e293b;
}

.log-summary {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-label {
  color: #64748b;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .daily-logs {
    padding: 1rem;
  }

  .logs-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .logs-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .date-filter {
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .logs-cards {
    grid-template-columns: 1fr;
  }

  .log-card-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .log-summary {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
