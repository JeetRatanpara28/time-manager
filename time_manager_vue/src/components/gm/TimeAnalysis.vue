<template>
  <div class="time-analysis">
    <div class="analysis-header">
      <h2>Working Time Analysis</h2>
      <div class="time-range-selector">
        <select v-model="selectedPeriod" class="period-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>

    <!-- Time Summary -->
    <div class="time-summary">
      <div class="summary-card">
        <div class="card-icon">⏱️</div>
        <div class="card-content">
          <h3>{{ periodTotalHours }}h</h3>
          <p>Total Hours</p>
          <span class="trend" :class="hoursTrend > 0 ? 'positive' : 'negative'">
            {{ hoursTrend > 0 ? '↗' : '↘' }} {{ Math.abs(hoursTrend).toFixed(1) }}%
          </span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">📅</div>
        <div class="card-content">
          <h3>{{ periodDays }}</h3>
          <p>Days Worked</p>
          <span class="trend positive">
            {{ avgHoursPerDay }}h avg
          </span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">⚡</div>
        <div class="card-content">
          <h3>{{ periodOvertime }}h</h3>
          <p>Overtime</p>
          <span class="trend" :class="overtimeTrend > 0 ? 'negative' : 'positive'">
            {{ overtimeTrend < 0 ? '↘' : '↗' }} {{ Math.abs(overtimeTrend).toFixed(1) }}%
          </span>
        </div>
      </div>

      <div class="summary-card">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <h3>{{ efficiency }}%</h3>
          <p>Efficiency</p>
          <span class="trend positive">
            Target: 100%
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Hours Trend Chart -->
      <div class="chart-container">
        <h3>Hours Worked Trend</h3>
        <div class="chart-area">
          <div class="chart-content">
            <div class="chart-bars">
              <div
                v-for="(day, index) in chartData"
                :key="index"
                class="bar-group"
              >
                <div 
                  class="chart-bar"
                  :class="{ weekend: day.isWeekend }"
                  :style="{ height: `${(day.hours / 10) * 100}%` }"
                >
                  <span class="bar-tooltip">{{ day.hours }}h</span>
                </div>
                <span class="bar-label">{{ day.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Pattern - FIXED -->
      <div class="chart-container">
        <h3>Weekly Activity Pattern</h3>
        <div class="pattern-chart">
          <div class="pattern-wrapper">
            <div class="pattern-day-labels">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
            <div class="pattern-grid">
              <div 
                v-for="(day, dayIndex) in 7" 
                :key="`day-${dayIndex}`" 
                class="pattern-row"
              >
                <div
                  v-for="(hour, hourIndex) in 24"
                  :key="`hour-${hourIndex}`"
                  class="pattern-cell"
                  :style="getCellStyle(dayIndex, hourIndex)"
                  :title="getCellTitle(dayIndex, hourIndex)"
                />
              </div>
            </div>
            <div class="pattern-hour-labels">
              <span v-for="h in [0, 3, 6, 9, 12, 15, 18, 21, 24]" :key="h">{{ h }}</span>
            </div>
          </div>
          <div class="pattern-legend">
            <span>Less</span>
            <div class="legend-gradient"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Logs Table -->
    <div class="logs-section">
      <div class="section-header">
        <h3>Detailed Time Logs</h3>
        <div class="table-controls">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search logs..."
            class="search-input"
          />
        </div>
      </div>

      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Clock In</th>
              <th>Clock Out</th>
              <th>Break Time</th>
              <th>Total Hours</th>
              <th>Overtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id" :class="{ weekend: isWeekend(log.date) }">
              <td>{{ formatDate(log.date) }}</td>
              <td>{{ formatDayName(log.date) }}</td>
              <td>{{ log.clockIn || '--:--' }}</td>
              <td>{{ log.clockOut || '--:--' }}</td>
              <td>{{ calculateBreakTime(log) }}m</td>
              <td :class="{ 'text-success': log.totalHours >= 8, 'text-warning': log.totalHours < 8 }">
                {{ log.totalHours ? `${log.totalHours}h` : '--' }}
              </td>
              <td :class="{ 'text-warning': log.overtime > 0 }">
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
    </div>

    <!-- Insights -->
    <div class="insights-section">
      <h3>Insights & Recommendations</h3>
      <div class="insights-grid">
        <div v-for="insight in insights" :key="insight.id" class="insight-card" :class="insight.type">
          <div class="insight-icon">{{ insight.icon }}</div>
          <div class="insight-content">
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { currentUser, timeLogs } from '@/composables/useGmStore.js';

const selectedPeriod = ref('month');
const searchQuery = ref('');

// Generate weekly pattern data (7 days x 24 hours)
const weeklyPattern = computed(() => {
  const pattern = Array(7 * 24).fill(0);
  
  // Simulate work hours: Mon-Fri 9 AM to 6 PM
  for (let day = 0; day < 5; day++) { // Monday to Friday
    for (let hour = 9; hour < 18; hour++) {
      const index = day * 24 + hour;
      // Peak hours: 10 AM - 4 PM
      if (hour >= 10 && hour <= 16) {
        pattern[index] = 7 + Math.random() * 1; // 7-8 hours
      } else {
        pattern[index] = 5 + Math.random() * 2; // 5-7 hours
      }
    }
  }
  
  return pattern;
});

// Get cell style for heatmap
const getCellStyle = (dayIndex, hourIndex) => {
  const index = dayIndex * 24 + hourIndex;
  const value = weeklyPattern.value[index];
  const opacity = value > 0 ? Math.min(value / 8, 1) : 0;
  
  return {
    backgroundColor: value > 0 ? `rgba(16, 185, 129, ${opacity})` : '#f1f5f9'
  };
};

// Get cell title for tooltip
const getCellTitle = (dayIndex, hourIndex) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const index = dayIndex * 24 + hourIndex;
  const value = weeklyPattern.value[index];
  return `${days[dayIndex]} ${hourIndex}:00 - ${value.toFixed(1)}h`;
};

// Mock data for charts
const chartData = ref([
  { label: 'Mon', hours: 8.5, isWeekend: false },
  { label: 'Tue', hours: 7.2, isWeekend: false },
  { label: 'Wed', hours: 9.1, isWeekend: false },
  { label: 'Thu', hours: 8.0, isWeekend: false },
  { label: 'Fri', hours: 8.8, isWeekend: false },
  { label: 'Sat', hours: 4.2, isWeekend: true },
  { label: 'Sun', hours: 0, isWeekend: true }
]);

const insights = [
  {
    id: 1,
    type: 'success',
    icon: '🎯',
    title: 'Great Work-Life Balance',
    description: 'You\'ve maintained consistent hours without excessive overtime this month.'
  },
  {
    id: 2,
    type: 'info',
    icon: '📈',
    title: 'Productivity Peak',
    description: 'Your most productive day is Wednesday with an average of 9.1 hours worked.'
  },
  {
    id: 3,
    type: 'warning',
    icon: '⚠️',
    title: 'Weekend Work',
    description: 'Consider reducing weekend work to maintain better work-life balance.'
  }
];

// Computed properties
const periodLogs = computed(() => {
  if (!currentUser.value || !timeLogs.value) return [];

  const now = new Date();
  let startDate;

  switch (selectedPeriod.value) {
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

  return timeLogs.value.filter(log => {
    const logDate = new Date(log.date);
    return log.userId === currentUser.value.id && logDate >= startDate;
  });
});

const filteredLogs = computed(() => {
  if (!periodLogs.value.length) return [];

  if (!searchQuery.value) return periodLogs.value;

  const query = searchQuery.value.toLowerCase();
  return periodLogs.value.filter(log =>
    log.date.toLowerCase().includes(query) ||
    log.status.toLowerCase().includes(query)
  );
});

const periodTotalHours = computed(() => {
  if (!periodLogs.value.length) return '0.0';
  return periodLogs.value
    .filter(log => log.totalHours)
    .reduce((sum, log) => sum + log.totalHours, 0)
    .toFixed(1);
});

const periodDays = computed(() => {
  if (!periodLogs.value.length) return 0;
  return new Set(periodLogs.value.map(log => log.date)).size;
});

const periodOvertime = computed(() => {
  if (!periodLogs.value.length) return '0.0';
  return periodLogs.value
    .filter(log => log.totalHours && log.totalHours > 8)
    .reduce((sum, log) => sum + (log.totalHours - 8), 0)
    .toFixed(1);
});

const avgHoursPerDay = computed(() => {
  if (periodDays.value === 0) return 0;
  return (parseFloat(periodTotalHours.value) / periodDays.value).toFixed(1);
});

const efficiency = computed(() => {
  return 94;
});

const hoursTrend = computed(() => {
  return 5.2;
});

const overtimeTrend = computed(() => {
  return -2.1;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDayName = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short'
  });
};

const isWeekend = (dateString) => {
  if (!dateString) return false;
  const day = new Date(dateString).getDay();
  return day === 0 || day === 6;
};

const calculateBreakTime = (log) => {
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
</script>

<style scoped>
.time-analysis {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.analysis-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.period-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.time-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.summary-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
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
  color: white;
}

.card-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.card-content p {
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.trend {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.trend.positive {
  color: #10b981;
}

.trend.negative {
  color: #ef4444;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.chart-container {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.chart-container h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.chart-area {
  height: 250px;
  display: flex;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  justify-content: space-around;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.chart-bar {
  width: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-bar:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.chart-bar.weekend {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-bottom: 4px;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* Weekly Pattern - FIXED */
.pattern-chart {
  text-align: center;
}

.pattern-wrapper {
  position: relative;
}

.pattern-day-labels {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 2px;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  position: absolute;
  left: -40px;
  top: 0;
  bottom: 20px;
  width: 35px;
}

.pattern-day-labels span {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.pattern-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 0.5rem;
}

.pattern-row {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  gap: 2px;
}

.pattern-cell {
  aspect-ratio: 1;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.pattern-cell:hover {
  transform: scale(1.3);
  z-index: 10;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
}

.pattern-hour-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #64748b;
  padding: 0 2px;
  margin-top: 0.5rem;
}

.pattern-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #64748b;
}

.legend-gradient {
  width: 100px;
  height: 8px;
  background: linear-gradient(to right, #f1f5f9, rgba(16, 185, 129, 1));
  border-radius: 4px;
}

.insights-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.insights-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.insight-card {
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid;
  display: flex;
  gap: 1rem;
}

.insight-card.success {
  background: #f0fdf4;
  border-color: #10b981;
}

.insight-card.info {
  background: #eff6ff;
  border-color: #3b82f6;
}

.insight-card.warning {
  background: #fffbeb;
  border-color: #f59e0b;
}

.insight-icon {
  font-size: 1.5rem;
}

.insight-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.insight-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
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

.table-controls {
  display: flex;
  gap: 1rem;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 250px;
  font-size: 0.9rem;
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

.logs-table tr.weekend {
  background: #fefce8;
}

.logs-table tr.weekend:hover {
  background: #fef3c7;
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
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

@media (max-width: 768px) {
  .time-analysis {
    padding: 1rem;
  }

  .analysis-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .time-summary {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .pattern-day-labels {
    position: static;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: none;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .pattern-day-labels span {
    justify-content: center;
  }
}
</style>