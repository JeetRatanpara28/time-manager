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

<style scoped>
.daily-logs {
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
}

/* Header Section */
.logs-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.header-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.header-content p {
  color: #64748b;
  font-size: 1.1rem;
  line-height: 1.5;
}

.logs-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.date-filter-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-filter label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.date-input {
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  color: #1e293b;
  transition: all 0.3s ease;
  min-width: 160px;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.user-select {
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  color: #1e293b;
  transition: all 0.3s ease;
  min-width: 200px;
  cursor: pointer;
}

.user-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
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

.export-btn:hover {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-icon {
  font-size: 1.25rem;
}

/* Summary Cards */
.logs-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  padding: 1.75rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-content {
  flex: 1;
}

.card-content h4 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  line-height: 1;
}

.card-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.trend-icon {
  font-size: 0.9rem;
}

.card-sparkline,
.progress-ring,
.active-indicator,
.efficiency-meter {
  flex-shrink: 0;
}

.card-sparkline svg {
  border-radius: 8px;
}

.progress-ring svg {
  transform: rotate(-90deg);
}

.active-indicator {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.active-indicator.inactive {
  background: rgba(239, 68, 68, 0.15);
}

.active-indicator.low {
  background: rgba(245, 158, 11, 0.15);
}

.active-indicator.medium {
  background: rgba(16, 185, 129, 0.15);
}

.active-indicator.high {
  background: rgba(59, 130, 246, 0.15);
}

.pulse-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.efficiency-meter {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
}

.meter-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(135deg, #10b981, #059669);
  transition: height 0.3s ease;
}

/* Analytics Section */
.analytics-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.analytics-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.analytics-select {
  padding: 0.75rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 1rem;
  color: #1e293b;
  cursor: pointer;
  font-weight: 500;
}

.analytics-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.analytics-content {
  min-height: 300px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.analytics-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.analytics-card h4 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-align: center;
}

.peak-hours-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 120px;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.hour-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.bar-fill {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  transition: height 0.3s ease;
}

.hour-label {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.weekly-pattern {
  display: flex;
  justify-content: space-around;
  height: 120px;
  align-items: flex-end;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.day-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.day-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-hours {
  font-size: 0.8rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.day-bar {
  width: 30px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 4px 4px 0 0;
  min-height: 20px;
  transition: height 0.3s ease;
}

.day-name {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.break-analysis {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.break-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}

.metric-label {
  font-weight: 600;
  color: #d97706;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.break-efficiency {
  padding: 1rem;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
}

.efficiency-label {
  display: block;
  font-weight: 600;
  color: #059669;
  margin-bottom: 0.5rem;
}

.efficiency-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.efficiency-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.efficiency-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #059669;
}

/* Productivity Analytics */
.productivity-metrics {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.productivity-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  text-align: center;
  max-width: 500px;
}

.productivity-card h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.score-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-circle svg {
  transform: rotate(-90deg);
}

.score-text {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.score-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.score-unit {
  font-size: 1.25rem;
  color: #64748b;
  font-weight: 600;
}

.score-details {
  flex: 1;
}

.score-factor {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.factor-label {
  font-weight: 500;
  color: #64748b;
}

.factor-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
}

/* Logs Section */
.logs-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-bottom: 2px solid #e2e8f0;
}

.section-header h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.view-controls {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 0.25rem;
}

.toggle-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.toggle-btn:hover {
  color: #374151;
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
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #1e293b;
  cursor: pointer;
}

.sort-order-btn {
  padding: 0.75rem;
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
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table thead {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
}

.logs-table th {
  padding: 1.25rem 1rem;
  text-align: left;
  font-weight: 700;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.logs-table td {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.logs-table tbody tr {
  transition: all 0.2s ease;
}

.logs-table tbody tr:hover {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  transform: translateX(4px);
}

.employee-cell {
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
  flex-shrink: 0;
}

.employee-info {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
  line-height: 1.3;
}

.employee-dept {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.date-cell {
  display: flex;
  flex-direction: column;
}

.date-main {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.date-day {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.time-display {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.break-duration {
  font-weight: 600;
  color: #f59e0b;
  font-size: 0.9rem;
}

.hours-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hours-value {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
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

.hours-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.hours-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.overtime-badge {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.no-overtime {
  color: #94a3b8;
  font-style: italic;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.status-badge.active {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-badge.active .status-dot {
  background: #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}

.live-timer {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 0.8rem;
  color: #3b82f6;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.6rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.view:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.action-btn.edit:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.action-btn.export:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.no-logs {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.no-logs-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-logs-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.no-logs h4 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.no-logs p {
  font-size: 1rem;
  margin: 0;
}

/* Cards View */
.logs-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.log-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.log-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.log-card-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-section {
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

.employee-details {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
  line-height: 1.3;
}

.employee-dept {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.date-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.log-date {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.log-day {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.log-card-content {
  padding: 1.5rem;
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
  gap: 0.25rem;
}

.time-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-value {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.time-value.hours {
  color: #667eea;
  font-weight: 700;
}

.overtime-section {
  margin-bottom: 1rem;
}

.overtime-badge {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.4);
  display: inline-block;
}

.active-section {
  margin-bottom: 1rem;
}

.live-timer-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.timer-icon {
  font-size: 1.1rem;
}

.timer-text {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #2563eb;
}

.log-card-footer {
  padding: 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.card-action-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.card-action-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.card-action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
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

.card-action-btn.tertiary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.card-action-btn.tertiary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.no-logs-cards {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.no-logs-card {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  max-width: 400px;
}

.no-logs-card .no-logs-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-logs-card h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.no-logs-card p {
  color: #64748b;
  margin: 0;
}

/* Timeline View */
.logs-timeline {
  padding: 2rem;
}

.timeline-container {
  position: relative;
}

.timeline-date-group {
  margin-bottom: 2rem;
  position: relative;
}

.timeline-date-group::before {
  content: '';
  position: absolute;
  left: 60px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 1px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.date-marker {
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 0 0 2px #e2e8f0;
  z-index: 2;
  position: relative;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date-main {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.date-meta {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.timeline-entries {
  margin-left: 80px;
}

.timeline-entry {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.timeline-entry:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.2);
}

.timeline-marker {
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e2e8f0;
  flex-shrink: 0;
  margin-top: 0.5rem;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-avatar.small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 0.8rem;
}

.employee-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.timeline-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-in,
.time-out {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.time-separator {
  color: #94a3b8;
}

.timeline-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.stat-item.overtime {
  color: #ef4444;
  font-weight: 600;
}

.no-timeline-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.no-data-content {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  max-width: 400px;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-data-content h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.no-data-content p {
  color: #64748b;
  margin: 0;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
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
  font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 1400px) {
  .logs-cards {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 1200px) {
  .logs-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .logs-cards {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 1024px) {
  .logs-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .date-filter-group {
    justify-content: center;
  }

  .filter-controls {
    justify-content: center;
  }

  .logs-summary {
    grid-template-columns: 1fr;
  }

  .time-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
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
    font-size: 2rem;
  }

  .header-content p {
    font-size: 1rem;
  }

  .date-filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .date-filter {
    width: 100%;
  }

  .date-input {
    width: 100%;
    min-width: auto;
  }

  .user-select {
    width: 100%;
    min-width: auto;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }

  .analytics-section {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .section-header h3 {
    text-align: center;
  }

  .analytics-controls {
    justify-content: center;
  }

  .logs-section .section-header {
    padding: 1.5rem;
    flex-direction: column;
    gap: 1rem;
  }

  .view-controls {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .view-toggle {
    width: 100%;
    justify-content: center;
  }

  .toggle-btn {
    flex: 1;
    justify-content: center;
  }

  .sort-controls {
    width: 100%;
    justify-content: center;
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

  .log-card {
    margin-bottom: 1rem;
  }

  .timeline-entries {
    margin-left: 40px;
  }

  .timeline-entry {
    flex-direction: column;
    gap: 0.75rem;
  }

  .timeline-marker {
    align-self: flex-start;
    margin-top: 1rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }

  .page-numbers {
    order: -1;
    justify-content: center;
  }

  .page-btn {
    width: 100%;
    max-width: 200px;
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
    font-size: 1.75rem;
  }

  .header-content p {
    font-size: 0.95rem;
  }

  .summary-card {
    padding: 1.25rem;
  }

  .card-icon {
    font-size: 2rem;
  }

  .card-content h4 {
    font-size: 2rem;
  }

  .analytics-section {
    padding: 1.25rem;
  }

  .analytics-card {
    padding: 1rem;
  }

  .peak-hours-chart,
  .weekly-pattern {
    height: 100px;
  }

  .logs-section .section-header {
    padding: 1.25rem;
  }

  .logs-cards {
    padding: 1.25rem;
  }

  .log-card-header,
  .log-card-content,
  .log-card-footer {
    padding: 1.25rem;
  }

  .time-grid {
    gap: 0.5rem;
  }

  .timeline-entries {
    margin-left: 30px;
  }

  .timeline-date {
    gap: 0.75rem;
  }

  .date-marker {
    width: 12px;
    height: 12px;
  }

  .date-main {
    font-size: 1.1rem;
  }

  .timeline-entry {
    padding: 0.75rem;
  }
}
</style>