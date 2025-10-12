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
        <div class="card-sparkline">
          <svg width="60" height="20" viewBox="0 0 60 20">
            <path
              :d="generateSparkline(logsSparklineData, 60, 20)"
              stroke="#3b82f6"
              stroke-width="2"
              fill="none"
            />
          </svg>
        </div>
      </div>

      <div class="summary-card secondary">
        <div class="card-icon">⏰</div>
        <div class="card-content">
          <h4>{{ totalHours }}h</h4>
          <p>Total Hours</p>
          <div class="card-trend">
            <span class="trend-icon">{{ hoursTrend >= 0 ? '↗️' : '↘️' }}</span>
            <span>{{ Math.abs(hoursTrend).toFixed(1) }}% vs last period</span>
          </div>
        </div>
        <div class="progress-ring">
          <svg width="40" height="40">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#e5e7eb"
              stroke-width="3"
              fill="none"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#10b981"
              stroke-width="3"
              fill="none"
              :stroke-dasharray="hoursProgress"
              stroke-dashoffset="0"
              transform="rotate(-90 20 20)"
            />
          </svg>
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
        <div class="active-indicator" :class="getActiveStatus()">
          <div class="pulse-dot"></div>
        </div>
      </div>

      <div class="summary-card quaternary">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <h4>{{ avgHoursPerDay }}h</h4>
          <p>Avg Hours/Day</p>
          <div class="card-trend">
            <span class="trend-icon">🎯</span>
            <span>{{ getEfficiencyText() }}</span>
          </div>
        </div>
        <div class="efficiency-meter">
          <div class="meter-fill" :style="{ height: efficiencyPercentage + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Advanced Filters & Analytics -->
    <div class="analytics-section">
      <div class="section-header">
        <h3>Analytics & Insights</h3>
        <div class="analytics-controls">
          <select v-model="analyticsView" class="analytics-select">
            <option value="overview">Overview</option>
            <option value="productivity">Productivity</option>
            <option value="patterns">Patterns</option>
            <option value="comparison">Comparison</option>
          </select>
        </div>
      </div>

      <div class="analytics-content">
        <!-- Overview Analytics -->
        <div v-if="analyticsView === 'overview'" class="analytics-grid">
          <div class="analytics-card">
            <h4>Peak Activity Hours</h4>
            <div class="peak-hours-chart">
              <div v-for="hour in peakHours" :key="hour.time" class="hour-bar">
                <div 
                  class="bar-fill" 
                  :style="{ height: hour.percentage + '%' }"
                  :title="`${hour.time}: ${hour.activity}% activity`"
                ></div>
                <span class="hour-label">{{ hour.time }}</span>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <h4>Weekly Pattern</h4>
            <div class="weekly-pattern">
              <div v-for="day in weeklyPattern" :key="day.name" class="day-column">
                <div class="day-stats">
                  <span class="day-hours">{{ day.avgHours }}h</span>
                  <div class="day-bar" :style="{ height: day.percentage + '%' }"></div>
                </div>
                <span class="day-name">{{ day.name }}</span>
              </div>
            </div>
          </div>

          <div class="analytics-card">
            <h4>Break Patterns</h4>
            <div class="break-analysis">
              <div class="break-metric">
                <span class="metric-label">Avg Break Duration</span>
                <span class="metric-value">{{ avgBreakDuration }}m</span>
              </div>
              <div class="break-metric">
                <span class="metric-label">Total Break Time</span>
                <span class="metric-value">{{ totalBreakTime }}h</span>
              </div>
              <div class="break-efficiency">
                <span class="efficiency-label">Break Efficiency</span>
                <div class="efficiency-bar">
                  <div class="efficiency-fill" :style="{ width: breakEfficiency + '%' }"></div>
                </div>
                <span class="efficiency-text">{{ breakEfficiency }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Productivity Analytics -->
        <div v-if="analyticsView === 'productivity'" class="productivity-metrics">
          <div class="productivity-card">
            <h4>Productivity Score</h4>
            <div class="score-display">
              <div class="score-circle">
                <svg width="120" height="120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    stroke-width="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#10b981"
                    stroke-width="8"
                    fill="none"
                    :stroke-dasharray="productivityCircle"
                    stroke-dashoffset="0"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div class="score-text">
                  <span class="score-number">{{ productivityScore }}</span>
                  <span class="score-unit">%</span>
                </div>
              </div>
              <div class="score-details">
                <div class="score-factor">
                  <span class="factor-label">Hours Consistency</span>
                  <span class="factor-value">{{ hoursConsistency }}%</span>
                </div>
                <div class="score-factor">
                  <span class="factor-label">Attendance Rate</span>
                  <span class="factor-value">{{ attendanceRate }}%</span>
                </div>
                <div class="score-factor">
                  <span class="factor-label">Overtime Balance</span>
                  <span class="factor-value">{{ overtimeBalance }}%</span>
                </div>
              </div>
            </div>
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
            <button
              :class="['toggle-btn', { active: viewMode === 'timeline' }]"
              @click="viewMode = 'timeline'"
            >
              <span class="btn-icon">📅</span>
              Timeline
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
                <span class="break-duration">{{ calculateBreakDuration(log) }}m</span>
              </td>
              <td>
                <div class="hours-cell">
                  <span class="hours-value" :class="getHoursClass(log.totalHours)">
                    {{ log.totalHours ? `${log.totalHours}h` : '--' }}
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
                  +{{ log.overtime }}h
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
                <span class="time-value">{{ calculateBreakDuration(log) }}m</span>
              </div>
              <div class="time-item">
                <span class="time-label">Total Hours</span>
                <span class="time-value hours" :class="getHoursClass(log.totalHours)">
                  {{ log.totalHours ? `${log.totalHours}h` : '--' }}
                </span>
              </div>
            </div>

            <div v-if="log.overtime && log.overtime > 0" class="overtime-section">
              <div class="overtime-badge">
                Overtime: +{{ log.overtime }}h
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

      <!-- Timeline View -->
      <div v-else-if="viewMode === 'timeline'" class="logs-timeline">
        <div class="timeline-container">
          <div v-for="(dateGroup, date) in groupedByDate" :key="date" class="timeline-date-group">
            <div class="timeline-date">
              <div class="date-marker"></div>
              <div class="date-info">
                <span class="date-main">{{ formatTimelineDate(date) }}</span>
                <span class="date-meta">{{ dateGroup.length }} {{ dateGroup.length === 1 ? 'entry' : 'entries' }}</span>
              </div>
            </div>
            
            <div class="timeline-entries">
              <div v-for="log in dateGroup" :key="log.id" class="timeline-entry" :class="getTimelineClass(log)">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <div class="employee-info">
                      <div class="employee-avatar small">
                        {{ getEmployeeInitials(getUserName(log.userId)) }}
                      </div>
                      <span class="employee-name">{{ getUserName(log.userId) }}</span>
                    </div>
                    <span :class="['status-badge', log.status]">
                      {{ log.status }}
                    </span>
                  </div>
                  
                  <div class="timeline-details">
                    <div class="time-range">
                      <span class="time-in">{{ log.clockIn || '--:--' }}</span>
                      <span class="time-separator">→</span>
                      <span class="time-out">{{ log.clockOut || 'Active' }}</span>
                    </div>
                    <div class="timeline-stats">
                      <span class="stat-item">{{ log.totalHours || 0 }}h total</span>
                      <span v-if="log.overtime > 0" class="stat-item overtime">+{{ log.overtime }}h OT</span>
                      <span class="stat-item">{{ calculateBreakDuration(log) }}m break</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!Object.keys(groupedByDate).length" class="no-timeline-data">
          <div class="no-data-content">
            <div class="no-data-icon">📅</div>
            <h4>No timeline data</h4>
            <p>No logs found for the selected period</p>
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
const analyticsView = ref('overview');
const sortBy = ref('date');
const sortOrder = ref('desc');
const currentPage = ref(1);
const itemsPerPage = 20;

// Timer for live updates
let liveTimer = null;

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
  // Mock calculation - in real app this would compare with previous period
  return Math.random() * 20 - 10; // Random between -10 and +10
});

const hoursProgress = computed(() => {
  const circumference = 2 * Math.PI * 16;
  const targetHours = 160; // Monthly target
  const progress = Math.min(parseFloat(totalHours.value) / targetHours, 1);
  return `${circumference * progress} ${circumference}`;
});

const efficiencyPercentage = computed(() => {
  return Math.min((parseFloat(avgHoursPerDay.value) / 8) * 100, 100);
});

const productivityScore = computed(() => {
  // Mock calculation based on various factors
  return Math.round((efficiencyPercentage.value + attendanceRate.value + hoursConsistency.value) / 3);
});

const productivityCircle = computed(() => {
  const circumference = 2 * Math.PI * 50;
  const progress = productivityScore.value / 100;
  return `${circumference * progress} ${circumference}`;
});

const hoursConsistency = computed(() => {
  // Calculate consistency based on standard deviation
  const hours = filteredLogs.value.map(log => log.totalHours || 0);
  if (hours.length < 2) return 100;
  
  const avg = hours.reduce((sum, h) => sum + h, 0) / hours.length;
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, Math.round(100 - (stdDev / avg) * 50));
});

const attendanceRate = computed(() => {
  const workingDays = 22; // Assume 22 working days per month
  const actualDays = new Set(filteredLogs.value.map(log => log.date)).size;
  return Math.round((actualDays / workingDays) * 100);
});

const overtimeBalance = computed(() => {
  const totalOvertime = filteredLogs.value.reduce((sum, log) => sum + (log.overtime || 0), 0);
  const totalRegularHours = filteredLogs.value.reduce((sum, log) => sum + Math.min(log.totalHours || 0, 8), 0);
  
  if (totalRegularHours === 0) return 100;
  const overtimeRatio = totalOvertime / totalRegularHours;
  return Math.max(0, Math.round(100 - overtimeRatio * 100));
});

const logsSparklineData = computed(() => {
  // Generate daily log counts for sparkline
  const dailyCounts = {};
  filteredLogs.value.forEach(log => {
    dailyCounts[log.date] = (dailyCounts[log.date] || 0) + 1;
  });
  return Object.values(dailyCounts).slice(-7); // Last 7 days
});

const peakHours = computed(() => {
  // Mock data for peak activity hours
  return [
    { time: '9AM', activity: 85, percentage: 85 },
    { time: '10AM', activity: 95, percentage: 95 },
    { time: '11AM', activity: 100, percentage: 100 },
    { time: '12PM', activity: 60, percentage: 60 },
    { time: '1PM', activity: 70, percentage: 70 },
    { time: '2PM', activity: 90, percentage: 90 },
    { time: '3PM', activity: 88, percentage: 88 },
    { time: '4PM', activity: 92, percentage: 92 },
    { time: '5PM', activity: 85, percentage: 85 }
  ];
});

const weeklyPattern = computed(() => {
  // Calculate average hours per day of week
  const dayStats = {};
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  filteredLogs.value.forEach(log => {
    const dayOfWeek = new Date(log.date).getDay();
    const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1]; // Adjust for Monday start
    
    if (!dayStats[dayName]) {
      dayStats[dayName] = { totalHours: 0, count: 0 };
    }
    dayStats[dayName].totalHours += log.totalHours || 0;
    dayStats[dayName].count += 1;
  });
  
  return dayNames.map(day => {
    const stats = dayStats[day] || { totalHours: 0, count: 0 };
    const avgHours = stats.count > 0 ? stats.totalHours / stats.count : 0;
    return {
      name: day,
      avgHours: avgHours.toFixed(1),
      percentage: Math.min((avgHours / 10) * 100, 100)
    };
  });
});

const avgBreakDuration = computed(() => {
  const breaks = filteredLogs.value
    .filter(log => log.breakStart && log.breakEnd)
    .map(log => calculateBreakDuration(log));
  
  if (breaks.length === 0) return 0;
  return Math.round(breaks.reduce((sum, b) => sum + b, 0) / breaks.length);
});

const totalBreakTime = computed(() => {
  const totalMinutes = filteredLogs.value
    .filter(log => log.breakStart && log.breakEnd)
    .reduce((sum, log) => sum + calculateBreakDuration(log), 0);
  
  return (totalMinutes / 60).toFixed(1);
});

const breakEfficiency = computed(() => {
  const idealBreakRatio = 0.125; // 1 hour break for 8 hour day
  const actualBreakRatio = parseFloat(totalBreakTime.value) / parseFloat(totalHours.value);
  
  if (actualBreakRatio === 0) return 100;
  return Math.max(0, Math.round(100 - Math.abs(actualBreakRatio - idealBreakRatio) * 500));
});

const groupedByDate = computed(() => {
  const grouped = {};
  sortedFilteredLogs.value.forEach(log => {
    if (!grouped[log.date]) {
      grouped[log.date] = [];
    }
    grouped[log.date].push(log);
  });
  return grouped;
});

// Methods
const generateSparkline = (data, width, height) => {
  if (!data || data.length === 0) return '';
  
  const max = Math.max(...data, 1);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (value / max) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return `M ${points.split(' ').join(' L ')}`;
};

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

const formatTimelineDate = (dateString) => {
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
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
};

const calculateBreakDuration = (log) => {
  if (!log.breakStart || !log.breakEnd) return 0;
  
  const breakStart = new Date(`2000-01-01T${log.breakStart}:00`);
  const breakEnd = new Date(`2000-01-01T${log.breakEnd}:00`);
  return Math.floor((breakEnd - breakStart) / (1000 * 60));
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

const getTimelineClass = (log) => {
  const classes = [];
  if (log.status === 'active') classes.push('active-timeline');
  if (log.overtime > 0) classes.push('overtime-timeline');
  return classes.join(' ');
};

const getHoursClass = (hours) => {
  if (!hours) return 'no-hours';
  if (hours >= 8) return 'good';
  if (hours >= 6) return 'average';
  return 'low';
};

const getActiveStatus = () => {
  if (activeSessions.value === 0) return 'inactive';
  if (activeSessions.value < 3) return 'low';
  if (activeSessions.value < 6) return 'medium';
  return 'high';
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
  // In real app, this would open a detailed modal or navigate to detail page
};

const editLog = (log) => {
  console.log('Editing log:', log);
  // In real app, this would open an edit modal
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
  // Set up live timer updates
  liveTimer = setInterval(() => {
    // Force reactivity update for live timers
    const activeLog = filteredLogs.value.find(log => log.status === 'active');
    if (activeLog) {
      // Trigger reactivity
      timeLogs.value = [...timeLogs.value];
    }
  }, 60000); // Update every minute
});

onUnmounted(() => {
  if (liveTimer) {
    clearInterval(liveTimer);
  }
});
</script>