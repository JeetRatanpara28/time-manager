<template>
  <div class="clock-analytics">
    <div class="analytics-header">
      <h2>Clock Analytics</h2>
      <div class="time-range-selector">
        <select v-model="selectedRange" class="range-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-icon">⏱️</div>
        <div class="kpi-content">
          <h3>{{ totalHours }}h</h3>
          <p>Total Hours</p>
          <span class="kpi-trend" :class="hoursTrend > 0 ? 'positive' : 'negative'">
            {{ hoursTrend > 0 ? '+' : '' }}{{ hoursTrend.toFixed(1) }}% from last {{ selectedRange }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⚡</div>
        <div class="kpi-content">
          <h3>{{ overtimeHours }}h</h3>
          <p>Overtime Hours</p>
          <span class="kpi-trend" :class="overtimeTrend > 0 ? 'positive' : 'negative'">
            {{ overtimeTrend > 0 ? '+' : '' }}{{ overtimeTrend.toFixed(1) }}% from last {{ selectedRange }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">☕</div>
        <div class="kpi-content">
          <h3>{{ totalBreaks }}m</h3>
          <p>Total Break Time</p>
          <span class="kpi-trend" :class="breakTrend > 0 ? 'positive' : 'negative'">
            {{ breakTrend > 0 ? '+' : '' }}{{ breakTrend.toFixed(1) }}% from last {{ selectedRange }}
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-content">
          <h3>{{ avgDailyHours }}h</h3>
          <p>Avg Daily Hours</p>
          <span class="kpi-trend positive">
            Target: 8h/day
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="chart-container">
        <h3>Hours Worked Trend</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div
              v-for="(day, index) in chartData"
              :key="index"
              class="chart-bar"
              :style="{ height: `${(day.hours / maxHours) * 100}%` }"
            >
              <span class="bar-value">{{ day.hours }}h</span>
              <span class="bar-label">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h3>Department Comparison</h3>
        <div class="chart-placeholder">
          <div class="dept-comparison">
            <div v-for="dept in departmentStats" :key="dept.name" class="dept-bar">
              <div class="dept-info">
                <span class="dept-name">{{ dept.name }}</span>
                <span class="dept-hours">{{ dept.avgHours }}h avg</span>
              </div>
              <div class="dept-progress">
                <div
                  class="progress-fill"
                  :style="{ width: `${(dept.avgHours / maxDeptHours) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Performers -->
    <div class="top-performers">
      <h3>Top Performers</h3>
      <div class="performers-grid">
        <div v-for="(performer, index) in topPerformers" :key="index" class="performer-card">
          <div class="performer-rank">#{{ index + 1 }}</div>
          <div class="performer-info">
            <h4>{{ performer.name }}</h4>
            <p>{{ performer.role.replace('_', ' ') }}</p>
          </div>
          <div class="performer-stats">
            <span class="stat">{{ performer.hours }}h</span>
            <span class="stat">{{ performer.days }} days</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts & Notifications -->
    <div class="alerts-section">
      <h3>Alerts & Notifications</h3>
      <div class="alerts-list">
        <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.type">
          <div class="alert-icon">{{ alert.icon }}</div>
          <div class="alert-content">
            <p>{{ alert.message }}</p>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { users, timeLogs, currentUser } from '@/composables/useGmStore.js';

const selectedRange = ref('week');

// Mock data for charts and analytics
const chartData = [
  { label: 'Mon', hours: 8.5 },
  { label: 'Tue', hours: 7.2 },
  { label: 'Wed', hours: 9.1 },
  { label: 'Thu', hours: 8.0 },
  { label: 'Fri', hours: 8.8 },
  { label: 'Sat', hours: 4.2 },
  { label: 'Sun', hours: 0 }
];

const departmentStats = [
  { name: 'Management', avgHours: 8.2 },
  { name: 'Sales', avgHours: 7.8 },
  { name: 'Development', avgHours: 8.5 },
  { name: 'Design', avgHours: 7.2 }
];

const topPerformers = [
  { name: 'John Smith', role: 'general_manager', hours: 45.2, days: 6 },
  { name: 'Sarah Johnson', role: 'manager', hours: 42.1, days: 5 },
  { name: 'Mike Davis', role: 'employee', hours: 40.5, days: 5 },
  { name: 'Emily Chen', role: 'employee', hours: 38.8, days: 4 }
];

const alerts = [
  { id: 1, type: 'warning', icon: '⚠️', message: 'Emily Chen has worked 4 days this week', time: '2 hours ago' },
  { id: 2, type: 'info', icon: 'ℹ️', message: 'Average daily hours below target', time: '1 day ago' },
  { id: 3, type: 'success', icon: '✅', message: 'Team productivity increased by 12%', time: '3 days ago' }
];

// Computed properties
const maxHours = computed(() => Math.max(...chartData.map(d => d.hours)));
const maxDeptHours = computed(() => Math.max(...departmentStats.map(d => d.avgHours)));

const totalHours = computed(() => {
  if (!currentUser.value || !timeLogs.value) return '0.0';
  return timeLogs.value
    .filter(log => log.userId === currentUser.value.id && log.totalHours)
    .reduce((sum, log) => sum + log.totalHours, 0)
    .toFixed(1);
});

const overtimeHours = computed(() => {
  if (!currentUser.value || !timeLogs.value) return '0.0';
  return timeLogs.value
    .filter(log => log.userId === currentUser.value.id && log.totalHours && log.totalHours > 8)
    .reduce((sum, log) => sum + (log.totalHours - 8), 0)
    .toFixed(1);
});

const totalBreaks = computed(() => {
  if (!currentUser.value || !timeLogs.value) return '0';
  return timeLogs.value
    .filter(log => log.userId === currentUser.value.id && log.breakStart && log.breakEnd)
    .reduce((total, log) => {
      const breakStart = new Date(`2000-01-01T${log.breakStart}:00`);
      const breakEnd = new Date(`2000-01-01T${log.breakEnd}:00`);
      const breakMinutes = (breakEnd - breakStart) / (1000 * 60);
      return total + breakMinutes;
    }, 0)
    .toFixed(0);
});

const avgDailyHours = computed(() => {
  if (!currentUser.value || !timeLogs.value) return '0.0';
  const logs = timeLogs.value.filter(log => log.userId === currentUser.value.id && log.totalHours);
  if (logs.length === 0) return '0.0';
  const total = logs.reduce((sum, log) => sum + log.totalHours, 0);
  return (total / logs.length).toFixed(1);
});

// Mock trend calculations (in real app, compare with previous period)
const hoursTrend = computed(() => 5.2);
const overtimeTrend = computed(() => -2.1);
const breakTrend = computed(() => 8.7);
</script>

<style scoped>
.clock-analytics {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.analytics-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.range-select {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.kpi-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.kpi-icon {
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

.kpi-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
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
}

.kpi-trend.positive {
  color: #10b981;
}

.kpi-trend.negative {
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

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: end;
  justify-content: center;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 0.5rem;
  height: 100%;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
  padding: 0.5rem;
  min-height: 20px;
}

.bar-value {
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.bar-label {
  color: white;
  font-size: 0.6rem;
  font-weight: 500;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.dept-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dept-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dept-info {
  min-width: 120px;
}

.dept-name {
  display: block;
  font-weight: 600;
  color: #1e293b;
}

.dept-hours {
  color: #64748b;
  font-size: 0.8rem;
}

.dept-progress {
  flex: 1;
  height: 20px;
  background: #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.top-performers {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.top-performers h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.performer-card {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
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
}

.performer-info {
  flex: 1;
}

.performer-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.performer-info p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.performer-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
}

.alerts-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.alerts-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-item.warning {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.alert-item.info {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.alert-item.success {
  background: #dcfce7;
  border-left: 4px solid #10b981;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  flex: 1;
}

.alert-content p {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-weight: 500;
}

.alert-time {
  color: #64748b;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .clock-analytics {
    padding: 1rem;
  }

  .analytics-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .kpi-cards {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .performers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
