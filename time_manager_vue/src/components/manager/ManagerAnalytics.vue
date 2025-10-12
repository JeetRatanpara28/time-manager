<template>
  <div class="manager-analytics">
    <div class="header">
      <h2>My Analytics</h2>
      <p>Review your working-time log, clock-in/out history, charts, and KPIs</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your analytics...</p>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-icon">⏰</div>
          <div class="kpi-content">
            <h4>{{ weeklyHoursDisplay }}</h4>
            <p>Hours This Week</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📅</div>
          <div class="kpi-content">
            <h4>{{ monthlyHoursDisplay }}</h4>
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

      <!-- Work Hours Chart -->
      <div class="chart-section">
        <h3>Weekly Hours Overview</h3>
        <div class="chart-placeholder">
          <div class="chart-bar" v-for="(day, index) in weekData" :key="index">
            <div class="bar-fill" :style="{ height: day.percentage + '%' }">
              <span class="bar-value" v-if="day.hours > 0">{{ day.hours }}h</span>
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
          <div v-for="log in recentLogsDisplay" :key="log.id" class="activity-item">
            <div class="activity-date">
              {{ formatDate(log.date) }}
            </div>
            <div class="activity-details">
              <div class="activity-times">
                <span class="time-range">{{ log.clockIn || 'N/A' }} - {{ log.clockOut || 'Active' }}</span>
                <span class="total-hours">{{ (log.totalHours || 0).toFixed(1) }}h</span>
              </div>
              <div class="activity-status" :class="log.clockOut ? 'completed' : 'active'">
                {{ log.clockOut ? 'Completed' : 'In Progress' }}
              </div>
            </div>
          </div>

          <div v-if="!recentLogsDisplay || recentLogsDisplay.length === 0" class="no-activity">
            <div class="no-activity-icon">📊</div>
            <p>No recent activity found</p>
            <span>Your clock history will appear here</span>
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
          <button class="export-btn" @click="exportPersonalLogs('week')" :disabled="isExporting">
            <span class="btn-icon">📊</span>
            <span>{{ isExporting ? 'Exporting...' : 'Export This Week' }}</span>
          </button>
          <button class="export-btn" @click="exportPersonalLogs('month')" :disabled="isExporting">
            <span class="btn-icon">📈</span>
            <span>{{ isExporting ? 'Exporting...' : 'Export This Month' }}</span>
          </button>
          <button class="export-btn" @click="exportPersonalLogs('all')" :disabled="isExporting">
            <span class="btn-icon">📋</span>
            <span>{{ isExporting ? 'Exporting...' : 'Export All Time' }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { timeLogs, exportTeamLogsToCSV } from '@/composables/useManagerStore.js';
import { useAuthStore } from '@/composables/useAuthStore.js';

// Initialize auth store
const authStore = useAuthStore();

// Reactive data
const isLoading = ref(true);
const isExporting = ref(false);
const weeklyHours = ref(0);
const monthlyHours = ref(0);
const recentLogs = ref([]);
const weekData = ref([
  { day: 'Mon', hours: 0, percentage: 0 },
  { day: 'Tue', hours: 0, percentage: 0 },
  { day: 'Wed', hours: 0, percentage: 0 },
  { day: 'Thu', hours: 0, percentage: 0 },
  { day: 'Fri', hours: 0, percentage: 0 },
  { day: 'Sat', hours: 0, percentage: 0 },
  { day: 'Sun', hours: 0, percentage: 0 }
]);

// Get current user ID
const getCurrentUserId = () => {
  // Try multiple ways to get user ID
  const user = authStore.currentUser?.value || authStore.currentUser || authStore.user?.value || authStore.user;
  
  console.log('🔍 Getting user ID...');
  console.log('Auth store:', authStore);
  console.log('Current user:', user);
  
  if (user && user.id) {
    console.log('✅ User ID found:', user.id);
    return user.id;
  }
  
  console.warn('⚠️ No user ID found in auth store');
  return null;
};

// Computed properties
const weeklyHoursDisplay = computed(() => {
  return weeklyHours.value ? weeklyHours.value.toFixed(1) : '0.0';
});

const monthlyHoursDisplay = computed(() => {
  return monthlyHours.value ? monthlyHours.value.toFixed(1) : '0.0';
});

const recentLogsDisplay = computed(() => {
  return recentLogs.value || [];
});

const averageDaily = computed(() => {
  const total = parseFloat(weeklyHoursDisplay.value) || 0;
  const daysWorked = weekData.value.filter(d => d.hours > 0).length;
  return daysWorked > 0 ? (total / daysWorked).toFixed(1) : '0.0';
});

const longestDay = computed(() => {
  const maxHours = Math.max(...weekData.value.map(d => d.hours));
  return maxHours > 0 ? maxHours.toFixed(1) : '0.0';
});

const workedDaysThisMonth = computed(() => {
  if (!recentLogs.value || recentLogs.value.length === 0) return 0;
  const uniqueDates = new Set(recentLogs.value.map(log => log.date));
  return uniqueDates.size;
});

const averageHoursPerDay = computed(() => {
  const total = parseFloat(monthlyHoursDisplay.value) || 0;
  const days = workedDaysThisMonth.value;
  return days > 0 ? (total / days).toFixed(1) : '0.0';
});

const mostProductiveDay = computed(() => {
  const maxDay = weekData.value.reduce((max, day) => 
    day.hours > max.hours ? day : max, { hours: 0, day: 'N/A' });
  return maxDay.hours > 0 ? maxDay.day : 'N/A';
});

const consistencyScore = computed(() => {
  const workDays = weekData.value.filter(d => d.hours > 0);
  if (workDays.length <= 1) return 0;
  
  const avg = workDays.reduce((sum, d) => sum + d.hours, 0) / workDays.length;
  const variance = workDays.reduce((sum, d) => sum + Math.pow(d.hours - avg, 2), 0) / workDays.length;
  const stdDev = Math.sqrt(variance);
  
  return avg > 0 ? Math.max(0, Math.min(100, Math.round(100 - (stdDev / avg) * 50))) : 0;
});

// Helper functions
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
        weekday: 'short'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown';
  }
};

const getDayOfWeek = (dateString) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// Load weekly data
const loadWeeklyData = () => {
  try {
    console.log('📊 Loading weekly data...');
    const userId = getCurrentUserId();
    
    if (!userId) {
      console.warn('⚠️ Cannot load weekly data: No user ID');
      return;
    }

    console.log('🔍 Filtering logs for user:', userId);
    console.log('📝 Total logs available:', timeLogs.value?.length || 0);

    // Get logs for the current user from the last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split('T')[0];

    const userLogs = timeLogs.value.filter(log => 
      log.userId === userId && log.date >= weekStart
    );

    console.log('✅ User logs found:', userLogs.length);

    // Reset week data
    weekData.value.forEach(day => {
      day.hours = 0;
      day.percentage = 0;
    });

    // Calculate hours per day
    userLogs.forEach(log => {
      const dayName = getDayOfWeek(log.date);
      const dayIndex = weekData.value.findIndex(d => d.day === dayName);
      
      if (dayIndex >= 0 && log.totalHours) {
        weekData.value[dayIndex].hours += log.totalHours;
      }
    });

    // Calculate percentages for chart display
    const maxHours = Math.max(...weekData.value.map(d => d.hours), 8);
    weekData.value.forEach(day => {
      day.percentage = maxHours > 0 ? Math.min(100, (day.hours / maxHours) * 100) : 0;
    });

    // Calculate weekly total
    weeklyHours.value = weekData.value.reduce((sum, day) => sum + day.hours, 0);
    
    console.log('📊 Weekly hours calculated:', weeklyHours.value);
    console.log('📈 Week data:', weekData.value);
  } catch (error) {
    console.error('❌ Failed to load weekly data:', error);
  }
};

// Load monthly data
const loadMonthlyData = () => {
  try {
    console.log('📅 Loading monthly data...');
    const userId = getCurrentUserId();
    
    if (!userId) {
      console.warn('⚠️ Cannot load monthly data: No user ID');
      return;
    }

    // Get logs for current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const monthlyLogs = timeLogs.value.filter(log => 
      log.userId === userId && log.date >= monthStartStr
    );

    console.log('✅ Monthly logs found:', monthlyLogs.length);

    // Calculate monthly hours
    monthlyHours.value = monthlyLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
    
    console.log('📅 Monthly hours calculated:', monthlyHours.value);
  } catch (error) {
    console.error('❌ Failed to load monthly data:', error);
  }
};

// Load recent logs
const loadRecentLogs = () => {
  try {
    console.log('📋 Loading recent logs...');
    const userId = getCurrentUserId();
    
    if (!userId) {
      console.warn('⚠️ Cannot load recent logs: No user ID');
      return;
    }

    // Get recent logs for user (last 10)
    const userLogs = timeLogs.value
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    recentLogs.value = userLogs;
    
    console.log('✅ Recent logs loaded:', recentLogs.value.length);
  } catch (error) {
    console.error('❌ Failed to load recent logs:', error);
  }
};

// Export personal logs
const exportPersonalLogs = (period) => {
  try {
    isExporting.value = true;
    
    const userId = getCurrentUserId();
    
    if (!userId) {
      alert('User information not available. Please try logging in again.');
      console.error('❌ Cannot export: No user ID available');
      isExporting.value = false;
      return;
    }

    console.log('📤 Exporting logs for user:', userId, 'period:', period);

    // Filter logs based on period
    let filteredLogs = [];
    const today = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStart = weekAgo.toISOString().split('T')[0];
      
      filteredLogs = timeLogs.value.filter(log => 
        log.userId === userId && log.date >= weekStart
      );
    } else if (period === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      
      filteredLogs = timeLogs.value.filter(log => 
        log.userId === userId && log.date >= monthStartStr
      );
    } else {
      // All time
      filteredLogs = timeLogs.value.filter(log => log.userId === userId);
    }

    if (filteredLogs.length === 0) {
      alert(`No logs found for ${period}`);
      isExporting.value = false;
      return;
    }

    // Create CSV content
    const csvHeaders = ['Date', 'Clock In', 'Clock Out', 'Break Start', 'Break End', 'Total Hours', 'Status'];
    const csvRows = filteredLogs.map(log => [
      log.date || '',
      log.clockIn || '',
      log.clockOut || '',
      log.breakStart || '',
      log.breakEnd || '',
      (log.totalHours || 0).toFixed(2),
      log.clockOut ? 'Completed' : 'In Progress'
    ]);

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `my_logs_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Export completed:', filteredLogs.length, 'logs exported');
    alert(`Successfully exported ${filteredLogs.length} logs for ${period}!`);
  } catch (error) {
    console.error(`❌ Failed to export logs for ${period}:`, error);
    alert(`Failed to export logs. Please try again.`);
  } finally {
    isExporting.value = false;
  }
};

// Initialize data
const initializeAnalytics = async () => {
  try {
    isLoading.value = true;
    
    console.log('🚀 Initializing analytics...');
    console.log('📊 Auth store state:', {
      currentUser: authStore.currentUser,
      user: authStore.user,
      isAuthenticated: authStore.isAuthenticated
    });

    // Wait a bit for auth to initialize if needed
    await new Promise(resolve => setTimeout(resolve, 100));

    const userId = getCurrentUserId();
    
    if (!userId) {
      console.error('❌ User ID not available for analytics');
      alert('Unable to load analytics. Please try logging in again.');
      isLoading.value = false;
      return;
    }

    console.log('✅ User ID available:', userId);
    console.log('📝 Available time logs:', timeLogs.value?.length || 0);

    // Load all data
    loadWeeklyData();
    loadMonthlyData();
    loadRecentLogs();

    console.log('✅ Analytics initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize analytics:', error);
    alert('Failed to load analytics data. Please refresh the page.');
  } finally {
    isLoading.value = false;
  }
};

// Load data when component mounts
onMounted(async () => {
  console.log('🎬 ManagerAnalytics component mounted');
  await initializeAnalytics();
});
</script>

<style scoped>
.manager-analytics {
  padding: 2rem;
  max-width: 1400px;
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

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
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

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.kpi-icon {
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

.kpi-content {
  flex: 1;
}

.kpi-content h4 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  line-height: 1;
}

.kpi-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.chart-section h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
}

.chart-placeholder {
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
  max-width: 60px;
  margin: 0 0.5rem;
}

.bar-fill {
  width: 100%;
  max-width: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 6px 6px 0 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 0.25rem;
  min-height: 30px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: relative;
}

.bar-fill:hover {
  transform: scaleY(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.bar-value {
  font-size: 0.85rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.bar-label {
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
  padding-top: 1rem;
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
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

/* Activity Section */
.activity-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.activity-section h3 {
  font-size: 1.5rem;
  font-weight: 700;
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
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: white;
}

.activity-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-date {
  font-weight: 700;
  color: #1e293b;
  min-width: 120px;
  font-size: 1rem;
}

.activity-details {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  flex: 1;
  justify-content: space-between;
}

.activity-times {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.time-range {
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.total-hours {
  font-weight: 700;
  color: #667eea;
  font-size: 1.05rem;
}

.activity-status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.activity-status.active {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.activity-status.complete,
.activity-status.completed {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.no-activity {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-activity-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-activity p {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.no-activity span {
  font-size: 0.95rem;
  color: #64748b;
}

/* Monthly Summary */
.monthly-summary {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.monthly-summary h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.summary-label {
  font-weight: 600;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
}

.summary-value {
  font-weight: 700;
  color: #1e293b;
  font-size: 1.5rem;
  line-height: 1;
}

/* Export Section */
.export-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.export-section h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.export-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-btn {
  padding: 1rem 1.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.25rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .kpi-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .manager-analytics {
    padding: 1rem;
  }

  .header h2 {
    font-size: 2rem;
  }

  .header p {
    font-size: 1rem;
  }

  .kpi-cards {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .kpi-card {
    padding: 1.5rem;
  }

  .kpi-icon {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .kpi-content h4 {
    font-size: 2rem;
  }

  .chart-placeholder {
    height: 180px;
    padding: 0.5rem;
  }

  .chart-bar {
    margin: 0 0.25rem;
    max-width: 40px;
  }

  .bar-fill {
    max-width: 36px;
  }

  .bar-label {
    font-size: 0.75rem;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }

  .activity-date {
    min-width: auto;
    width: 100%;
  }

  .activity-details {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .activity-times {
    width: 100%;
  }

  .activity-status {
    align-self: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .summary-item {
    padding: 1.25rem;
  }

  .summary-value {
    font-size: 1.25rem;
  }

  .export-options {
    flex-direction: column;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .manager-analytics {
    padding: 0.75rem;
  }

  .header {
    margin-bottom: 1.5rem;
  }

  .header h2 {
    font-size: 1.75rem;
  }

  .header p {
    font-size: 0.95rem;
  }

  .kpi-card {
    padding: 1.25rem;
  }

  .kpi-icon {
    width: 56px;
    height: 56px;
    font-size: 1.75rem;
  }

  .kpi-content h4 {
    font-size: 1.75rem;
  }

  .kpi-content p {
    font-size: 0.85rem;
  }

  .chart-section,
  .activity-section,
  .monthly-summary,
  .export-section {
    padding: 1.5rem;
  }

  .chart-section h3,
  .activity-section h3,
  .monthly-summary h3,
  .export-section h3 {
    font-size: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .chart-placeholder {
    height: 160px;
  }

  .summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
  }

  .summary-label {
    font-size: 0.85rem;
  }

  .summary-value {
    font-size: 1.5rem;
  }
}
</style>