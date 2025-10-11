<template>
  <div class="clock-analytics">
    <div class="analytics-header">
      <h2>Clock Analytics</h2>
      <div class="time-range-selector">
        <select v-model="selectedRange" class="range-select" @change="loadAnalyticsData">
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

    <!-- Employee Activity Logs -->
    <div class="activity-logs-section">
      <h3>Employee Activity Logs</h3>
      <div class="activity-logs-table">
        <div class="table-header">
          <div class="col-employee">Employee</div>
          <div class="col-date">Date</div>
          <div class="col-times">Time Range</div>
          <div class="col-hours">Hours</div>
          <div class="col-status">Status</div>
        </div>
        
        <div v-for="(log, index) in employeeActivityLogs" :key="index" class="table-row">
          <div class="col-employee">{{ log.employeeName }}</div>
          <div class="col-date">{{ formatDate(log.date) }}</div>
          <div class="col-times">{{ log.clockIn }} - {{ log.clockOut || 'Active' }}</div>
          <div class="col-hours">{{ log.totalHours || 0 }}h</div>
          <div class="col-status" :class="log.status">
            {{ log.status === 'active' ? 'Active' : 'Completed' }}
          </div>
        </div>
        
        <div v-if="!employeeActivityLogs.length" class="no-data">
          <p>No activity logs for the selected period</p>
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
import { ref, computed, onMounted, watch } from 'vue';
import { useAnalyticsStore } from '@/composables/useAnalyticsStore.js';
import { useAuthStore } from '@/composables/useAuthStore.js';

// Initialize stores
const analyticsStore = useAnalyticsStore();
const authStore = useAuthStore();

// Reactive state
const selectedRange = ref('week');
const chartData = ref([]);
const departmentStats = ref([]);
const topPerformers = ref([]);
const alerts = ref([]);
const employeeActivityLogs = ref([]);

// Analytics data
const totalHours = ref(0);
const overtimeHours = ref(0);
const totalBreaks = ref(0);
const avgDailyHours = ref(0);
const hoursTrend = ref(0);
const overtimeTrend = ref(0);
const breakTrend = ref(0);

// Computed properties
const maxHours = computed(() => {
  if (!chartData.value.length) return 10; // Default for empty data
  return Math.max(...chartData.value.map(d => d.hours), 8); // At least 8 for scale
});

const maxDeptHours = computed(() => {
  if (!departmentStats.value.length) return 8; // Default for empty data
  return Math.max(...departmentStats.value.map(d => d.avgHours), 8); // At least 8 for scale
});

// Format date for display
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

// Load analytics data based on selected range
const loadAnalyticsData = async () => {
  try {
    const userId = authStore.user?.id;
    if (!userId) return;
    
    // Show loading state
    // You can add loading indicators here if needed
    
    // Fetch all required data
    const analyticsData = await analyticsStore.fetchAnalytics(userId, selectedRange.value);
    
    if (analyticsData) {
      // Update KPI data
      totalHours.value = analyticsData.totalHours || 0;
      overtimeHours.value = analyticsData.overtimeHours || 0;
      totalBreaks.value = analyticsData.totalBreakMinutes || 0;
      avgDailyHours.value = analyticsData.avgDailyHours || 0;
      hoursTrend.value = analyticsData.hoursTrend || 0;
      overtimeTrend.value = analyticsData.overtimeTrend || 0;
      breakTrend.value = analyticsData.breakTrend || 0;
      
      // Update chart data
      if (analyticsData.hoursTrend) {
        chartData.value = analyticsData.hoursTrend;
      }
      
      // Update department stats
      if (analyticsData.departmentStats) {
        departmentStats.value = analyticsData.departmentStats;
      }
      
      // Update top performers
      if (analyticsData.topPerformers) {
        topPerformers.value = analyticsData.topPerformers;
      }
      
      // Update alerts
      if (analyticsData.alerts) {
        alerts.value = analyticsData.alerts;
      }
      
      // Update activity logs
      if (analyticsData.activityLogs) {
        employeeActivityLogs.value = analyticsData.activityLogs;
      }
    }
  } catch (error) {
    console.error('Failed to load analytics data:', error);
    // Handle error - show notification to user
  }
};

// Watch for changes to selected range
watch(selectedRange, () => {
  loadAnalyticsData();
});

// Initialize data when component mounts
onMounted(async () => {
  try {
    // Ensure user data is loaded
    if (!authStore.user) {
      await authStore.fetchCurrentUser();
    }
    
    // Load initial analytics data
    await loadAnalyticsData();
    
    // Set up real-time updates if supported
    if (analyticsStore.subscribeToAnalyticsUpdates) {
      analyticsStore.subscribeToAnalyticsUpdates((updates) => {
        // Handle real-time updates to analytics data
        if (updates.totalHours) totalHours.value = updates.totalHours;
        if (updates.overtimeHours) overtimeHours.value = updates.overtimeHours;
        if (updates.activityLogs) {
          // Add new logs to the existing list
          employeeActivityLogs.value = [
            ...updates.activityLogs,
            ...employeeActivityLogs.value
          ].slice(0, 20); // Keep only the 20 most recent
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize analytics component:', error);
  }
});
</script>

<style scoped>

.activity-logs-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.activity-logs-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
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
  font-size: 0.9rem;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-row:last-child {
  border-bottom: none;
}

.col-status {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
}

.col-status.active {
  background: #dcfce7;
  color: #166534;
}

.col-status.completed {
  background: #dbeafe;
  color: #1e40af;
}

.no-data {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
}

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
