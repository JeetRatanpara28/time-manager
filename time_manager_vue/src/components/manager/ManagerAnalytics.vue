<template>
  <div class="manager-analytics">
    <div class="header">
      <h2>My Analytics</h2>
      <p>Review your working-time log, clock-in/out history, charts, and KPIs</p>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-icon">⏰</div>
        <div class="kpi-content">
          <h4>{{ weeklyHours }}</h4>
          <p>Hours This Week</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">📅</div>
        <div class="kpi-content">
          <h4>{{ monthlyHours }}</h4>
          <p>Hours This Month</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-content">
          <h4>{{ averageDaily }}</h4>
          <p>Average Daily</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🏆</div>
        <div class="kpi-content">
          <h4>{{ longestDay }}</h4>
          <p>Best Day</p>
        </div>
      </div>
    </div>

    <!-- Work Hours Chart (Simplified) -->
    <div class="chart-section">
      <h3>Weekly Hours Overview</h3>
      <div class="chart-placeholder">
        <div class="chart-bar" v-for="(day, index) in weekData" :key="index">
          <div class="bar-fill" :style="{ height: day.percentage + '%' }">
            <span class="bar-value">{{ day.hours }}h</span>
          </div>
          <span class="bar-label">{{ day.day }}</span>
        </div>
      </div>
      <div class="chart-legend">
        <span class="legend-item">
          <span class="legend-color"></span>
          Hours Worked
        </span>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="activity-section">
      <h3>Recent Clock History</h3>
      <div class="activity-list">
        <div v-for="log in recentLogs.slice(0, 10)" :key="log.id" class="activity-item">
          <div class="activity-date">
            {{ formatDate(log.date) }}
          </div>
          <div class="activity-details">
            <div class="activity-times">
              <span class="time-range">{{ log.clockIn }} - {{ log.clockOut || 'Active' }}</span>
              <span class="total-hours">{{ log.totalHours }}h</span>
            </div>
            <div class="activity-status" :class="log.status">
              {{ log.status === 'active' ? 'In Progress' : 'Completed' }}
            </div>
          </div>
        </div>

        <div v-if="recentLogs.length === 0" class="no-activity">
          <p>No recent activity</p>
        </div>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="monthly-summary">
      <h3>Monthly Performance</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Total Days Worked</span>
          <span class="summary-value">{{ workedDaysThisMonth }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Average Hours/Day</span>
          <span class="summary-value">{{ averageHoursPerDay }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Most Productive Day</span>
          <span class="summary-value">{{ mostProductiveDay }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Consistency Score</span>
          <span class="summary-value">{{ consistencyScore }}%</span>
        </div>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-section">
      <h3>Export Data</h3>
      <div class="export-options">
        <button class="export-btn" @click="exportPersonalLogs('week')">
          <span class="btn-icon">📊</span>
          Export This Week
        </button>
        <button class="export-btn" @click="exportPersonalLogs('month')">
          <span class="btn-icon">📈</span>
          Export This Month
        </button>
        <button class="export-btn" @click="exportPersonalLogs('all')">
          <span class="btn-icon">📋</span>
          Export All Time
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { weeklyHours, monthlyHours, recentLogs } from '@/composables/useManagerStore.js';

// Mock data for demonstration
const weekData = [
  { day: 'Mon', hours: 8.5, percentage: 85 },
  { day: 'Tue', hours: 7.0, percentage: 70 },
  { day: 'Wed', hours: 9.0, percentage: 90 },
  { day: 'Thu', hours: 8.0, percentage: 80 },
  { day: 'Fri', hours: 7.5, percentage: 75 },
  { day: 'Sat', hours: 0, percentage: 0 },
  { day: 'Sun', hours: 0, percentage: 0 }
];

const averageDaily = computed(() => {
  const total = parseFloat(weeklyHours.value);
  const daysWorked = weekData.filter(d => d.hours > 0).length;
  return daysWorked > 0 ? (total / daysWorked).toFixed(1) : '0.0';
});

const longestDay = computed(() => {
  const maxHours = Math.max(...weekData.map(d => d.hours));
  return maxHours > 0 ? maxHours.toFixed(1) : '0.0';
});

const workedDaysThisMonth = computed(() => {
  // Mock calculation for demonstration
  return Math.floor(Math.random() * 15) + 10; // Random between 10-25
});

const averageHoursPerDay = computed(() => {
  const total = parseFloat(monthlyHours.value);
  const days = workedDaysThisMonth.value;
  return days > 0 ? (total / days).toFixed(1) : '0.0';
});

const mostProductiveDay = computed(() => {
  // Mock data for demonstration
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days[Math.floor(Math.random() * days.length)];
});

const consistencyScore = computed(() => {
  // Mock consistency score
  return Math.floor(Math.random() * 30) + 70; // 70-100%
});

const formatDate = (dateString) => {
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
      weekday: 'short'
    });
  }
};

const exportPersonalLogs = (period) => {
  // In real implementation, this would export the manager's personal logs
  console.log('Exporting personal logs for period:', period);

  // Mock CSV export for demonstration
  const headers = ['Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
  const mockData = recentLogs.value.map(log => [
    log.date,
    log.clockIn || '',
    log.clockOut || '',
    log.totalHours || '',
    log.status
  ]);

  const csvContent = [headers, ...mockData].map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `personal_logs_${period}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.manager-analytics {
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

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-icon {
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

.kpi-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.kpi-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.chart-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.chart-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.chart-placeholder {
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

.bar-fill {
  width: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: end;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem;
  min-height: 20px;
  transition: height 0.3s ease;
}

.bar-label {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.chart-legend {
  display: flex;
  justify-content: center;
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
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 2px;
}

.activity-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.activity-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.activity-item:hover {
  background: #f8fafc;
}

.activity-date {
  font-weight: 600;
  color: #1e293b;
  min-width: 120px;
}

.activity-details {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: space-between;
}

.activity-times {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-range {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
  color: #1e293b;
}

.total-hours {
  font-weight: 600;
  color: #667eea;
}

.activity-status {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
}

.activity-status.active {
  background: #dcfce7;
  color: #166534;
}

.activity-status.complete {
  background: #dbeafe;
  color: #1e40af;
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.monthly-summary {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.monthly-summary h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.summary-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
}

.summary-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 1.1rem;
}

.export-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.export-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.export-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
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

.export-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .manager-analytics {
    padding: 1rem;
  }

  .kpi-cards {
    grid-template-columns: 1fr;
  }

  .chart-placeholder {
    height: 150px;
  }

  .chart-bar {
    margin: 0 0.1rem;
  }

  .bar-fill {
    width: 30px;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .activity-details {
    width: 100%;
    justify-content: space-between;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .export-options {
    flex-direction: column;
  }
}
</style>
