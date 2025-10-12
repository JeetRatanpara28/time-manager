<template>
  <div class="manager-monitoring">
    <div class="header">
      <h2>Employee Monitoring</h2>
      <p>Real-time status and activity monitoring of your team</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading monitoring data...</p>
    </div>

    <template v-else>
      <!-- Live Status Overview -->
      <div class="status-overview">
        <div class="status-card online">
          <div class="status-icon">🟢</div>
          <div class="status-content">
            <h3>{{ onlineEmployees }}</h3>
            <p>Currently Active</p>
          </div>
        </div>

        <div class="status-card offline">
          <div class="status-icon">🔴</div>
          <div class="status-content">
            <h3>{{ offlineEmployees }}</h3>
            <p>Offline</p>
          </div>
        </div>

        <div class="status-card active">
          <div class="status-icon">⏰</div>
          <div class="status-content">
            <h3>{{ activeToday }}</h3>
            <p>Worked Today</p>
          </div>
        </div>

        <div class="status-card break">
          <div class="status-icon">☕</div>
          <div class="status-content">
            <h3>{{ onBreak }}</h3>
            <p>On Break</p>
          </div>
        </div>
      </div>

      <!-- Team Productivity Chart -->
      <div class="chart-section">
        <h3>Team Productivity Overview (Last 7 Days)</h3>
        <div class="chart-placeholder">
          <div class="chart-bar" v-for="(day, index) in teamProductivityData" :key="index">
            <div class="bar-fill" :style="{ height: day.percentage + '%' }">
              <span class="bar-value" v-if="day.hours > 0">{{ day.hours.toFixed(1) }}h</span>
            </div>
            <span class="bar-label">{{ day.day }}</span>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color"></span>
            Total Hours Worked
          </span>
        </div>
      </div>

      <!-- Employee Status Table -->
      <div class="employees-table">
        <div class="table-header">
          <div class="col-employee">Employee</div>
          <div class="col-status">Status</div>
          <div class="col-today">Today's Activity</div>
          <div class="col-actions">Actions</div>
        </div>

        <div v-for="employee in employees" :key="employee.id" class="table-row">
          <div class="col-employee">
            <div class="employee-info">
              <div class="employee-avatar">{{ getInitials(employee.name) }}</div>
              <div class="employee-details">
                <span class="employee-name">{{ employee.name }}</span>
                <span class="employee-email">{{ employee.email }}</span>
              </div>
            </div>
          </div>

          <div class="col-status">
            <span class="status-badge" :class="getEmployeeStatus(employee.id)">
              <span class="status-dot"></span>
              {{ getStatusLabel(getEmployeeStatus(employee.id)) }}
            </span>
          </div>

          <div class="col-today">
            <div class="today-activity">
              <div class="activity-item">
                <span class="label">Clock In:</span>
                <span class="value">{{ getTodayActivity(employee.id).clockIn || '--:--' }}</span>
              </div>
              <div class="activity-item">
                <span class="label">Hours:</span>
                <span class="value hours">{{ getTodayActivity(employee.id).hours }}h</span>
              </div>
              <div class="activity-item" v-if="getTodayActivity(employee.id).breakStart">
                <span class="label">Break:</span>
                <span class="value break">{{ getTodayActivity(employee.id).breakStart }}</span>
              </div>
            </div>
          </div>

          <div class="col-actions">
            <button class="action-btn view" @click="viewEmployeeLogs(employee)" title="View Logs">
              📋
            </button>
            <button class="action-btn export" @click="exportEmployeeLogs(employee)" title="Export CSV">
              📊
            </button>
          </div>
        </div>

        <div v-if="employees.length === 0" class="no-employees">
          <div class="no-employees-icon">👥</div>
          <h3>No Employees Found</h3>
          <p>No employees are assigned to your team yet</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <h3>Today's Team Summary</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">👥</div>
            <span class="stat-value">{{ teamStats.totalMembers }}</span>
            <span class="stat-label">Total Team</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">⚡</div>
            <span class="stat-value">{{ teamStats.activeNow }}</span>
            <span class="stat-label">Currently Working</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">☕</div>
            <span class="stat-value">{{ teamStats.onBreak }}</span>
            <span class="stat-label">On Break</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">✅</div>
            <span class="stat-value">{{ teamStats.completedToday }}</span>
            <span class="stat-label">Completed Today</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">⏰</div>
            <span class="stat-value">{{ teamStats.totalHours }}</span>
            <span class="stat-label">Total Hours Today</span>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <span class="stat-value">{{ teamStats.avgHours }}</span>
            <span class="stat-label">Avg Hours/Person</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { users, timeLogs, exportTeamLogsToCSV } from '@/composables/useManagerStore.js';
import { useAuthStore } from '@/composables/useAuthStore.js';

// Initialize auth store
const authStore = useAuthStore();

// Reactive state
const isLoading = ref(true);
const todayActivities = ref({});
const refreshInterval = ref(null);

// Get today's date
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Get day of week
const getDayOfWeek = (dateString) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

// Computed: Employees list (exclude general managers)
const employees = computed(() => {
  return users.value.filter(u => u.role !== 'general_manager');
});

// Computed: Online employees (currently clocked in)
const onlineEmployees = computed(() => {
  return Object.values(todayActivities.value).filter(activity => 
    activity.clockIn && !activity.clockOut
  ).length;
});

// Computed: Offline employees
const offlineEmployees = computed(() => {
  return employees.value.length - onlineEmployees.value;
});

// Computed: Active today (anyone who clocked in today)
const activeToday = computed(() => {
  return Object.keys(todayActivities.value).length;
});

// Computed: On break
const onBreak = computed(() => {
  return Object.values(todayActivities.value).filter(activity => 
    activity.breakStart && !activity.breakEnd
  ).length;
});

// Computed: Team productivity data (last 7 days)
const teamProductivityData = computed(() => {
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = getDayOfWeek(dateStr);

    // Get total hours for all employees on this day
    const dayLogs = timeLogs.value.filter(log => log.date === dateStr);
    const totalHours = dayLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);

    // Calculate percentage (max 80 hours for team = 100%)
    const maxHours = employees.value.length * 10; // Assume 10 hours max per person
    const percentage = maxHours > 0 ? Math.min(100, (totalHours / maxHours) * 100) : 0;

    data.push({
      day: dayName,
      hours: totalHours,
      percentage: percentage
    });
  }

  return data;
});

// Computed: Team stats
const teamStats = computed(() => {
  const today = getTodayDate();
  const todayLogs = timeLogs.value.filter(log => log.date === today);
  
  const activeNow = todayLogs.filter(log => log.clockIn && !log.clockOut).length;
  const onBreak = todayLogs.filter(log => log.breakStart && !log.breakEnd).length;
  const completedToday = todayLogs.filter(log => log.clockOut).length;
  const totalHours = todayLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  const avgHours = completedToday > 0 ? (totalHours / completedToday).toFixed(1) : '0.0';

  return {
    totalMembers: employees.value.length,
    activeNow: activeNow,
    onBreak: onBreak,
    completedToday: completedToday,
    totalHours: totalHours.toFixed(1) + 'h',
    avgHours: avgHours + 'h'
  };
});

// Helper functions
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getEmployeeStatus = (userId) => {
  const activity = todayActivities.value[userId];
  
  if (!activity || !activity.clockIn) {
    return 'offline';
  }
  
  if (activity.breakStart && !activity.breakEnd) {
    return 'break';
  }
  
  if (activity.clockIn && !activity.clockOut) {
    return 'online';
  }
  
  return 'completed';
};

const getStatusLabel = (status) => {
  const labels = {
    'online': 'Working',
    'offline': 'Offline',
    'break': 'On Break',
    'completed': 'Completed'
  };
  return labels[status] || 'Unknown';
};

const getTodayActivity = (userId) => {
  const activity = todayActivities.value[userId];
  
  if (!activity) {
    return {
      clockIn: null,
      hours: '0.0',
      breakStart: null
    };
  }
  
  return {
    clockIn: activity.clockIn || null,
    hours: (activity.totalHours || 0).toFixed(1),
    breakStart: activity.breakStart || null
  };
};

const viewEmployeeLogs = (employee) => {
  if (!employee) return;
  
  console.log('Viewing logs for:', employee.name);
  alert(`Viewing logs for ${employee.name}\n\nThis would navigate to detailed logs view in a full application.`);
};

const exportEmployeeLogs = async (employee) => {
  if (!employee) return;
  
  try {
    console.log('Exporting logs for:', employee.name);
    
    // Get all logs for this employee
    const employeeLogs = timeLogs.value.filter(log => log.userId === employee.id);
    
    if (employeeLogs.length === 0) {
      alert(`No logs found for ${employee.name}`);
      return;
    }
    
    // Export using the manager store function
    await exportTeamLogsToCSV(employee.id);
    
    alert(`Successfully exported ${employeeLogs.length} logs for ${employee.name}!`);
  } catch (error) {
    console.error(`Failed to export logs for ${employee.name}:`, error);
    alert('Failed to export logs. Please try again.');
  }
};

// Load today's activities
const loadTodayActivities = () => {
  try {
    console.log('📊 Loading today\'s activities...');
    const today = getTodayDate();
    
    // Get all logs for today
    const todayLogs = timeLogs.value.filter(log => log.date === today);
    console.log('📝 Today\'s logs:', todayLogs.length);
    
    // Group by user ID
    const activities = {};
    todayLogs.forEach(log => {
      activities[log.userId] = {
        clockIn: log.clockIn,
        clockOut: log.clockOut,
        breakStart: log.breakStart,
        breakEnd: log.breakEnd,
        totalHours: log.totalHours || 0,
        status: log.status
      };
    });
    
    todayActivities.value = activities;
    console.log('✅ Activities loaded:', Object.keys(activities).length, 'employees');
  } catch (error) {
    console.error('❌ Failed to load today\'s activities:', error);
  }
};

// Refresh data periodically
const startAutoRefresh = () => {
  // Refresh every 30 seconds
  refreshInterval.value = setInterval(() => {
    console.log('🔄 Auto-refreshing monitoring data...');
    loadTodayActivities();
  }, 30000);
};

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// Initialize
onMounted(async () => {
  try {
    console.log('🚀 ManagerMonitoring component mounted');
    console.log('👥 Total users:', users.value.length);
    console.log('📝 Total logs:', timeLogs.value.length);
    
    isLoading.value = true;
    
    // Load today's activities
    loadTodayActivities();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('✅ Monitoring initialized');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring:', error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  console.log('🛑 Stopping auto-refresh');
  stopAutoRefresh();
});
</script>

<style scoped>

.manager-monitoring {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Header Section */
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

/* Status Overview */
.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.status-card {
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

.status-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: width 0.3s ease;
}

.status-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.status-card:hover::before {
  width: 6px;
}

.status-card.online::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-card.offline::before {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.status-card.active::before {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.status-card.break::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.status-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.status-content h3 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem 0;
  line-height: 1;
}

.status-content p {
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
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
  line-height: 1.3;
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
  border: 2px solid #e2e8f0;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
  margin: 0 0.5rem;
}

.bar-fill {
  width: 100%;
  max-width: 56px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px 8px 0 0;
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
  padding-top: 1.5rem;
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
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

/* Employee Status Table */
.employees-table {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-bottom: 2px solid #e2e8f0;
  font-weight: 700;
  color: #374151;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1.25rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
  font-size: 1.05rem;
  line-height: 1.3;
}

.employee-email {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.1rem;
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

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.status-badge.online {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.status-badge.online .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.status-badge.offline {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.status-badge.offline .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.status-badge.break {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.status-badge.break .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.today-activity {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.activity-item .label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.activity-item .value {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
}

.activity-item .value.hours {
  color: #667eea;
  font-weight: 700;
}

.activity-item .value.break {
  color: #f59e0b;
  font-weight: 600;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.6rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.view:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.action-btn.export:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

/* No Employees State */
.no-employees {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.no-employees-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.no-employees h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.75rem 0;
}

.no-employees p {
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
}

/* Quick Stats */
.quick-stats {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.quick-stats h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
  line-height: 1.3;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-item:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.stat-value {
  display: block;
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .table-header,
  .table-row {
    grid-template-columns: 1.8fr 1fr 1.4fr 1fr;
  }
}

@media (max-width: 1024px) {
  .status-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-placeholder {
    height: 200px;
  }

  .bar-fill {
    max-width: 48px;
  }
}

@media (max-width: 768px) {
  .manager-monitoring {
    padding: 1rem;
  }

  .header h2 {
    font-size: 2rem;
  }

  .header p {
    font-size: 1rem;
  }

  .status-overview {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .status-card {
    padding: 1.5rem;
  }

  .status-icon {
    font-size: 2rem;
  }

  .status-content h3 {
    font-size: 2rem;
  }

  .table-header {
    display: none;
  }

  .table-row {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .table-row:hover {
    transform: none;
  }

  .employee-info {
    width: 100%;
  }

  .col-employee,
  .col-status,
  .col-today,
  .col-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .col-actions {
    flex-direction: row;
    justify-content: flex-start;
    gap: 0.75rem;
  }

  .today-activity {
    text-align: left;
    width: 100%;
  }

  .chart-placeholder {
    height: 160px;
    padding: 0.5rem;
  }

  .bar-fill {
    max-width: 36px;
  }

  .chart-legend {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-item {
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .manager-monitoring {
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

  .status-card {
    padding: 1.25rem;
  }

  .status-icon {
    font-size: 1.75rem;
  }

  .status-content h3 {
    font-size: 1.75rem;
  }

  .status-content p {
    font-size: 0.85rem;
  }

  .chart-section,
  .employees-table,
  .quick-stats {
    padding: 1.5rem;
  }

  .chart-section h3,
  .quick-stats h3 {
    font-size: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .chart-placeholder {
    height: 140px;
  }

  .bar-fill {
    max-width: 28px;
  }

  .bar-label {
    font-size: 0.75rem;
  }

  .stat-item {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
  }

  .stat-label {
    font-size: 0.85rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
