<template>
  <div class="gm-overview">
    <div class="overview-header">
      <h2>General Manager Dashboard</h2>
      <p class="current-time">{{ currentTime }}</p>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-content">
          <h3>{{ totalUsers }}</h3>
          <p>Total Users</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">🟢</div>
        <div class="kpi-content">
          <h3>{{ onlineUsers.length }}</h3>
          <p>Online Now</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">⏰</div>
        <div class="kpi-content">
          <h3>{{ todaysLogs.length }}</h3>
          <p>Active Sessions</p>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-content">
          <h3>{{ averageHours }}h</h3>
          <p>Avg. Hours Today</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <div class="quick-actions-header">
        <div class="header-icon">⚡</div>
        <div class="header-content">
          <h3>Quick Actions</h3>
          <p>Access frequently used features</p>
        </div>
      </div>

      <div class="action-grid">
        <div class="action-card primary-card" @click="navigateTo('users')">
          <div class="card-icon">
            <span>👥</span>
          </div>
          <div class="card-content">
            <h4>Manage Users</h4>
            <p>View and manage team members</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="action-card secondary-card" @click="navigateTo('logs')">
          <div class="card-icon">
            <span>📋</span>
          </div>
          <div class="card-content">
            <h4>View Logs</h4>
            <p>Check time logs and reports</p>
          </div>
          <div class="card-arrow">→</div>
        </div>

        <div class="action-card tertiary-card" @click="navigateTo('analytics')">
          <div class="card-icon">
            <span>📊</span>
          </div>
          <div class="card-content">
            <h4>Analytics</h4>
            <p>View detailed analytics</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </div>

    <!-- Week Overview -->
    <div class="week-overview-section">
      <div class="week-overview-header">
        <div class="header-icon">📈</div>
        <div class="header-content">
          <h3>Week Overview</h3>
          <p>Weekly performance insights and trends</p>
        </div>
      </div>

      <div class="week-stats-grid">
        <div class="week-stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <h4>{{ weeklyTotalHours }}h</h4>
            <p>Total Hours This Week</p>
            <span class="stat-trend trend-up">↗️ +12%</span>
          </div>
        </div>

        <div class="week-stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h4>{{ weeklyActiveDays }}</h4>
            <p>Active Days</p>
            <span class="stat-trend trend-neutral">→ 5/7</span>
          </div>
        </div>

        <div class="week-stat-card">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <h4>{{ weeklyAvgHours }}</h4>
            <p>Avg Daily Hours</p>
            <span class="stat-trend trend-up">↗️ +8%</span>
          </div>
        </div>

        <div class="week-stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h4>{{ weeklyTopPerformer }}</h4>
            <p>Top Performer</p>
            <span class="stat-trend">This Week</span>
          </div>
        </div>
      </div>

      <div class="week-chart-placeholder">
        <div class="chart-header">
          <h4>Weekly Activity Trend</h4>
          <p>Hours worked per day this week</p>
        </div>
        <div class="chart-area">
          <div class="chart-bars">
            <div class="chart-bar" v-for="(day, index) in weeklyData" :key="index">
              <div class="bar-fill" :style="{ height: `${(day.hours / 10) * 100}%` }"></div>
              <span class="bar-label">{{ day.day }}</span>
              <span class="bar-value">{{ day.hours }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts & Notifications -->
    <div class="alerts-section">
      <div class="alerts-header">
        <div class="header-icon">🔔</div>
        <div class="header-content">
          <h3>Alerts & Notifications</h3>
          <p>Important updates and alerts requiring attention</p>
        </div>
        <div v-if="alerts.length > 0" class="alerts-count">
          <span class="count-badge">{{ alerts.length }}</span>
        </div>
      </div>

      <div v-if="alerts.length === 0" class="no-alerts">
        <div class="no-alerts-icon">✅</div>
        <h4>All Clear!</h4>
        <p>No alerts or notifications at this time</p>
      </div>

      <div v-else class="alerts-list">
        <div v-for="alert in alerts" :key="alert.id" 
             :class="['alert-item', alert.priority === 'high' ? 'alert-high' : alert.priority === 'medium' ? 'alert-medium' : 'alert-low']">
          <div class="alert-icon">{{ alert.icon }}</div>
          <div class="alert-content">
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.message }}</p>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
          <div v-if="alert.action" class="alert-action">
            <button class="alert-btn" @click="handleAlertAction(alert)">{{ alert.action }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" 
           :class="['activity-item', activity.type === 'active-session' ? 'active-session' : '', 
                   activity.type === 'long-break' ? 'warning' : '',
                   activity.icon === '⏰' ? 'overtime' : '']">
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-content">
            <p>{{ activity.message }}</p>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { users, timeLogs, onlineUsers, todaysLogs } from '@/composables/useGmStore.js';

// Props from parent component
const props = defineProps({
  activeGmView: {
    type: String,
    default: 'overview'
  }
});

// Emits to parent component
const emit = defineEmits(['update:activeGmView']);

// Local state
const currentTime = ref('');
let timeInterval = null;

// Update current time every second
const updateTime = () => {
  currentTime.value = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Handle navigation to different views
const navigateTo = (view) => {
  emit('update:activeGmView', view);
};

// Helper function to format relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Computed properties
const totalUsers = computed(() => users.value.length);

const averageHours = computed(() => {
  const completedLogs = todaysLogs.value.filter(log => log.totalHours);
  if (completedLogs.length === 0) return 0;
  const total = completedLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  return (total / completedLogs.length).toFixed(1);
});

const weeklyTotalHours = computed(() => {
  // Calculate total hours for the current week (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weeklyLogs = timeLogs.value.filter(log => log.date >= weekStart && log.totalHours);
  const total = weeklyLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0);
  return total.toFixed(1);
});

const weeklyActiveDays = computed(() => {
  // Count unique days with activity in the last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const uniqueDays = new Set(
    timeLogs.value
      .filter(log => log.date >= weekStart && (log.totalHours || log.clockIn))
      .map(log => log.date)
  );
  return uniqueDays.size;
});

const weeklyAvgHours = computed(() => {
  const totalHours = parseFloat(weeklyTotalHours.value);
  const activeDays = weeklyActiveDays.value;
  return activeDays > 0 ? (totalHours / activeDays).toFixed(1) : '0.0';
});

const weeklyTopPerformer = computed(() => {
  // Find user with most hours this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const userHours = {};
  timeLogs.value
    .filter(log => log.date >= weekStart && log.totalHours)
    .forEach(log => {
      const user = users.value.find(u => u.id === log.userId);
      if (user) {
        userHours[user.name] = (userHours[user.name] || 0) + log.totalHours;
      }
    });

  const topUser = Object.entries(userHours).sort(([,a], [,b]) => b - a)[0];
  return topUser ? topUser[0] : 'No data';
});

const weeklyData = computed(() => {
  // Generate mock weekly data for the chart (in real app, this would come from API)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    hours: Math.floor(Math.random() * 8) + 2 // Mock data: 2-10 hours per day
  }));
});

const alerts = computed(() => {
  const alertsList = [];
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  // Check for missing clock-ins (employees who should have clocked in but haven't)
  if (currentHour >= 9) { // After 9 AM, check for missing clock-ins
    users.value.forEach(user => {
      const todaysLog = timeLogs.value.find(log =>
        log.userId === user.id && log.date === today
      );

      if (!todaysLog || (!todaysLog.clockIn && todaysLog.status !== 'active')) {
        alertsList.push({
          id: `missing-clockin-${user.id}`,
          icon: '⚠️',
          title: 'Missing Clock-In',
          message: `${user.name} hasn't clocked in yet today`,
          time: formatRelativeTime(currentTime),
          priority: 'high',
          action: 'Send Reminder',
          userId: user.id,
          type: 'missing-clockin'
        });
      } else if (todaysLog && todaysLog.clockIn) {
        // Check for late arrivals (after 9:30 AM)
        const clockInTime = new Date(`${today}T${todaysLog.clockIn}:00`);
        const lateThreshold = new Date(`${today}T09:30:00`);
        if (clockInTime > lateThreshold) {
          alertsList.push({
            id: `late-arrival-${todaysLog.id}`,
            icon: '🕘',
            title: 'Late Arrival',
            message: `${user.name} arrived at ${todaysLog.clockIn} (after 9:30 AM)`,
            time: formatRelativeTime(clockInTime),
            priority: 'medium',
            action: 'View Details',
            userId: user.id,
            type: 'late-arrival'
          });
        }
      }
    });
  }

  // Check for current overtime employees (actively working > 8 hours)
  timeLogs.value.forEach(log => {
    if (log.date === today && log.status === 'active' && log.clockIn && !log.clockOut) {
      const clockInTime = new Date(`${log.date}T${log.clockIn}:00`);
      const hoursWorked = (currentTime - clockInTime) / (1000 * 60 * 60);

      if (hoursWorked > 8) {
        const user = users.value.find(u => u.id === log.userId);
        if (user) {
          alertsList.push({
            id: `current-overtime-${log.id}`,
            icon: '⏰',
            title: 'Currently Overtime',
            message: `${user.name} has been working for ${hoursWorked.toFixed(1)} hours today`,
            time: 'Active now',
            priority: 'high',
            action: 'Check Status',
            userId: user.id,
            type: 'current-overtime'
          });
        }
      } else if (hoursWorked > 10) {
        // Extreme overtime warning
        const user = users.value.find(u => u.id === log.userId);
        if (user) {
          alertsList.push({
            id: `extreme-overtime-${log.id}`,
            icon: '🚨',
            title: 'Extreme Overtime Alert',
            message: `${user.name} has been working for ${hoursWorked.toFixed(1)} hours - consider break or clock out`,
            time: 'Urgent!',
            priority: 'high',
            action: 'Contact Employee',
            userId: user.id,
            type: 'extreme-overtime'
          });
        }
      }
    }
  });

  // Check for completed overtime (already clocked out with overtime)
  timeLogs.value.forEach(log => {
    if (log.date === today && log.status === 'completed' && log.totalHours && log.totalHours > 8) {
      const user = users.value.find(u => u.id === log.userId);
      if (user) {
        alertsList.push({
          id: `completed-overtime-${log.id}`,
          icon: '⏰',
          title: 'Overtime Completed',
          message: `${user.name} worked ${log.totalHours}h today (includes ${log.overtime || (log.totalHours - 8).toFixed(1)}h overtime)`,
          time: formatRelativeTime(new Date(`${log.date}T${log.clockOut}:00`)),
          priority: 'medium',
          action: 'Review Hours',
          userId: user.id,
          type: 'completed-overtime'
        });
      }
    }
  });

  // Check for long breaks
  timeLogs.value.forEach(log => {
    if (log.date === today && log.breakStart && log.breakEnd) {
      const breakStart = new Date(`${log.date}T${log.breakStart}:00`);
      const breakEnd = new Date(`${log.date}T${log.breakEnd}:00`);
      const breakDuration = (breakEnd - breakStart) / (1000 * 60 * 60); // hours

      if (breakDuration > 1.5) {
        const user = users.value.find(u => u.id === log.userId);
        if (user) {
          alertsList.push({
            id: `extended-break-${log.id}`,
            icon: '☕',
            title: 'Extended Break',
            message: `${user.name} took a ${breakDuration.toFixed(1)}h break - review break policy`,
            time: formatRelativeTime(breakEnd),
            priority: 'medium',
            action: 'View Details',
            userId: user.id,
            type: 'extended-break'
          });
        }
      }
    }
  });

  // Check for employees still working after 6 PM
  if (currentHour >= 18) {
    timeLogs.value.forEach(log => {
      if (log.date === today && log.status === 'active' && log.clockIn && !log.clockOut) {
        const clockInTime = new Date(`${log.date}T${log.clockIn}:00`);
        const hoursWorked = (currentTime - clockInTime) / (1000 * 60 * 60);

        const user = users.value.find(u => u.id === log.userId);
        if (user) {
          alertsList.push({
            id: `late-working-${log.id}`,
            icon: '🌙',
            title: 'Late Working Hours',
            message: `${user.name} is still working after 6 PM (${hoursWorked.toFixed(1)}h total)`,
            time: 'After hours',
            priority: 'medium',
            action: 'Check Status',
            userId: user.id,
            type: 'late-working'
          });
        }
      }
    });
  }

  // Check for no activity today (employees who haven't done anything)
  if (currentHour >= 12) { // After noon, check for no activity
    users.value.forEach(user => {
      const todaysActivity = timeLogs.value.filter(log =>
        log.userId === user.id && log.date === today && (log.clockIn || log.totalHours)
      );

      if (todaysActivity.length === 0) {
        alertsList.push({
          id: `no-activity-${user.id}`,
          icon: '📭',
          title: 'No Activity Today',
          message: `${user.name} has no recorded activity today`,
          time: 'Since start of day',
          priority: 'low',
          action: 'Contact Employee',
          userId: user.id,
          type: 'no-activity'
        });
      }
    });
  }

  // Sort alerts by priority (high -> medium -> low) and return top 8
  return alertsList
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 8);
});

// Alert action handler
const handleAlertAction = (alert) => {
  console.log('Handling alert action:', alert);

  // Navigate to user management for user-specific alerts
  if (alert.type === 'missing-clockin' || alert.type === 'late-arrival' || alert.type === 'no-activity') {
    navigateTo('users');
    // Could pass user ID as query parameter in real app
    console.log(`Navigating to user profile for ${alert.userId}`);
  }

  // Navigate to logs for time-related alerts
  else if (alert.type === 'current-overtime' || alert.type === 'extreme-overtime' ||
           alert.type === 'completed-overtime' || alert.type === 'late-working') {
    navigateTo('logs');
    console.log(`Checking time logs for user ${alert.userId}`);
  }

  // Navigate to analytics for break and performance alerts
  else if (alert.type === 'extended-break') {
    navigateTo('analytics');
    console.log(`Reviewing break patterns for user ${alert.userId}`);
  }

  // Additional actions based on alert type
  switch (alert.action) {
    case 'Send Reminder':
      // In a real app, this would send a notification/email
      console.log(`Sending clock-in reminder to user ${alert.userId}`);
      // Could show a success toast: "Reminder sent to [user name]"
      break;

    case 'Contact Employee':
      // Navigate to user details or open contact modal
      navigateTo('users');
      console.log(`Opening contact options for user ${alert.userId}`);
      break;

    case 'View Details':
      // Navigate to detailed view
      navigateTo('logs');
      console.log(`Showing detailed view for user ${alert.userId}`);
      break;

    case 'Check Status':
      // Navigate to current status view
      navigateTo('logs');
      console.log(`Checking current status for user ${alert.userId}`);
      break;

    case 'Review Hours':
      // Navigate to time analysis
      navigateTo('analytics');
      console.log(`Reviewing overtime hours for user ${alert.userId}`);
      break;

    default:
      console.log(`Unknown action: ${alert.action}`);
  }
};

const recentActivities = computed(() => {
  const activities = [];
  const allLogs = timeLogs.value.slice().reverse(); // Start from most recent

  // Process each log to extract activities
  for (const log of allLogs) {
    const user = users.value.find(u => u.id === log.userId);
    if (!user) continue;

    // Create a base timestamp for this log's date
    const logDate = new Date(log.date);

    // Clock in activity (with early/late indicators)
    if (log.clockIn) {
      const clockInTime = new Date(`${log.date}T${log.clockIn}:00`);
      const hour = clockInTime.getHours();
      let message = `${user.name} clocked in`;
      let icon = '🟢';
      
      // Early morning arrival (before 8 AM)
      if (hour < 8) {
        message += ' (early start)';
        icon = '🌅';
      }
      // Late arrival (after 9 AM)
      else if (hour >= 9) {
        message += ' (late start)';
        icon = '🕘';
      }
      
      activities.push({
        id: `clockin-${log.id}`,
        icon: icon,
        message: message,
        time: formatRelativeTime(clockInTime),
        timestamp: clockInTime,
        type: 'clock-in'
      });
    }

    // Break start activity
    if (log.breakStart) {
      const breakStartTime = new Date(`${log.date}T${log.breakStart}:00`);
      activities.push({
        id: `breakstart-${log.id}`,
        icon: '☕',
        message: `${user.name} started break`,
        time: formatRelativeTime(breakStartTime),
        timestamp: breakStartTime,
        type: 'break-start'
      });
    }

    // Break end activity
    if (log.breakEnd) {
      const breakEndTime = new Date(`${log.date}T${log.breakEnd}:00`);
      activities.push({
        id: `breakend-${log.id}`,
        icon: '↩️',
        message: `${user.name} ended break`,
        time: formatRelativeTime(breakEndTime),
        timestamp: breakEndTime,
        type: 'break-end'
      });
    }

    // Clock out activity (with overtime and late indicators)
    if (log.clockOut) {
      const clockOutTime = new Date(`${log.date}T${log.clockOut}:00`);
      const hour = clockOutTime.getHours();
      let message = `${user.name} clocked out`;
      let icon = '🔴';
      
      // Overtime indicator
      if (log.overtime && log.overtime > 0) {
        message += ` (${log.overtime}h overtime)`;
        icon = '⏰';
      } else if (log.totalHours && log.totalHours >= 8) {
        message += ` (${log.totalHours}h completed)`;
      }
      
      // Late departure (after 6 PM)
      if (hour >= 18) {
        message += ' (late departure)';
        icon = '🌙';
      }
      
      activities.push({
        id: `clockout-${log.id}`,
        icon: icon,
        message: message,
        time: formatRelativeTime(clockOutTime),
        timestamp: clockOutTime,
        type: 'clock-out'
      });
    }

    // Long break warning (breaks longer than 1 hour)
    if (log.breakStart && log.breakEnd) {
      const breakStartTime = new Date(`${log.date}T${log.breakStart}:00`);
      const breakEndTime = new Date(`${log.date}T${log.breakEnd}:00`);
      const breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60); // hours
      
      if (breakDuration > 1) {
        activities.push({
          id: `longbreak-${log.id}`,
          icon: '⚠️',
          message: `${user.name} had a long break (${breakDuration.toFixed(1)}h)`,
          time: formatRelativeTime(breakEndTime),
          timestamp: breakEndTime,
          type: 'long-break'
        });
      }
    }
  }

  // Add currently active sessions
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  timeLogs.value.forEach(log => {
    if (log.date === today && log.status === 'active' && log.clockIn && !log.clockOut) {
      const user = users.value.find(u => u.id === log.userId);
      if (!user) return;

      const clockInTime = new Date(`${log.date}T${log.clockIn}:00`);
      const hoursWorked = (now - clockInTime) / (1000 * 60 * 60);
      
      activities.push({
        id: `active-${log.id}`,
        icon: '🔵',
        message: `${user.name} currently working (${hoursWorked.toFixed(1)}h elapsed)`,
        time: 'Active now',
        timestamp: now, // Sort to top
        type: 'active-session',
        priority: 'high'
      });
    }
  });

  // Sort by priority first, then by timestamp (most recent first) and limit to 10 activities
  return activities
    .sort((a, b) => {
      // High priority items first
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      // Then by timestamp
      return b.timestamp - a.timestamp;
    })
    .slice(0, 10);
});

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.gm-overview {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.overview-header {
  text-align: center;
  margin-bottom: 3rem;
}

.overview-header h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.current-time {
  color: #64748b;
  font-size: 1.1rem;
}

.kpi-grid {
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
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
  margin: 0;
}

.kpi-content p {
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.quick-actions-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.quick-actions-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
}

.quick-actions-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.header-content h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.header-content p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.action-card:hover::before {
  opacity: 1;
}

.action-card:active {
  transform: translateY(-2px);
  transition: all 0.1s ease;
}

.primary-card {
  border-color: rgba(102, 126, 234, 0.2);
}

.primary-card:hover {
  border-color: #667eea;
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
}

.secondary-card {
  border-color: rgba(113, 128, 150, 0.2);
}

.secondary-card:hover {
  border-color: #718096;
  box-shadow: 0 12px 32px rgba(113, 128, 150, 0.2);
}

.tertiary-card {
  border-color: rgba(16, 185, 129, 0.2);
}

.tertiary-card:hover {
  border-color: #10b981;
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.2);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.primary-card .card-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.secondary-card .card-icon {
  background: linear-gradient(135deg, #718096, #4a5568);
  color: white;
  box-shadow: 0 4px 12px rgba(113, 128, 150, 0.3);
}

.tertiary-card .card-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.card-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.card-content h4 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.card-content p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
  line-height: 1.4;
}

.card-arrow {
  font-size: 1.5rem;
  color: #cbd5e0;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  opacity: 0.7;
}

.action-card:hover .card-arrow {
  color: #667eea;
  transform: translateX(4px);
  opacity: 1;
}

.week-overview-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.week-overview-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981, #059669, #047857);
}

.week-overview-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.week-overview-header .header-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.week-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.week-stat-card {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.week-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.week-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
}

.week-stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stat-content {
  flex: 1;
}

.stat-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.2;
}

.stat-content p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
}

.stat-trend.trend-up {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-trend.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.stat-trend.trend-neutral {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.week-chart-placeholder {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.week-chart-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
}

.chart-header {
  margin-bottom: 2rem;
}

.chart-header h4 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.chart-header p {
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
}

.chart-area {
  position: relative;
}

.chart-bars {
  display: flex;
  align-items: end;
  justify-content: space-between;
  height: 200px;
  gap: 0.5rem;
  padding: 0 1rem;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.bar-fill {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.5s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.bar-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 0.5rem;
}

.bar-value {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.recent-activity h3 {
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
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background: #f1f5f9;
  transform: translateX(2px);
}

.activity-item.active-session {
  background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
  border-left-color: #0ea5e9;
  animation: pulse 2s infinite;
}

.activity-item.warning {
  background: linear-gradient(135deg, #fef3c7, #fefce8);
  border-left-color: #f59e0b;
}

.activity-item.overtime {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border-left-color: #10b981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  margin: 0 0 0.25rem 0;
  color: #1e293b;
  font-weight: 500;
}

.activity-time {
  color: #64748b;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .gm-overview {
    padding: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-section {
    padding: 1.5rem;
  }

  .quick-actions-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .header-content h3 {
    font-size: 1.5rem;
  }

  .action-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-card {
    padding: 1.25rem;
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .card-arrow {
    align-self: flex-end;
    margin-top: -1rem;
  }

  .week-overview-section {
    padding: 1.5rem;
  }

  .week-overview-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .week-overview-header .header-content h3 {
    font-size: 1.5rem;
  }

  .week-stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .week-stat-card {
    padding: 1.25rem;
    flex-direction: column;
    text-align: center;
  }

  .bar-fill {
    max-width: 30px;
  }
}

.alerts-section {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.alerts-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
}

.alerts-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: space-between;
}

.alerts-header .header-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.alerts-count {
  margin-left: auto;
}

.count-badge {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.no-alerts {
  text-align: center;
  padding: 3rem 2rem;
  color: #64748b;
}

.no-alerts-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-alerts h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.no-alerts p {
  margin: 0;
  font-size: 0.9rem;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.alert-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.alert-item:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.alert-high {
  border-color: rgba(239, 68, 68, 0.3);
}

.alert-high::before {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.alert-high:hover {
  border-color: #ef4444;
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.15);
}

.alert-medium {
  border-color: rgba(245, 158, 11, 0.3);
}

.alert-medium::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.alert-medium:hover {
  border-color: #f59e0b;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.15);
}

.alert-low {
  border-color: rgba(16, 185, 129, 0.3);
}

.alert-low::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.alert-low:hover {
  border-color: #10b981;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.15);
}

.alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.alert-high .alert-icon {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
}

.alert-medium .alert-icon {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.alert-low .alert-icon {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

/* Special styling for extreme overtime alerts */
.alert-item:has(.alert-icon:contains('🚨')) {
  border-color: rgba(220, 38, 38, 0.4);
  background: linear-gradient(135deg, #ffffff, #fef2f2);
}

.alert-item:has(.alert-icon:contains('🚨')) .alert-icon {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
  animation: urgent-pulse 1.5s ease-in-out infinite alternate;
}

@keyframes urgent-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.alert-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.alert-content h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.alert-content p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  line-height: 1.4;
}

.alert-time {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.alert-action {
  position: relative;
  z-index: 2;
}

.alert-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f1f5f9;
  color: #475569;
}

.alert-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.alert-high .alert-btn {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #dc2626;
}

.alert-high .alert-btn:hover {
  background: linear-gradient(135deg, #fecaca, #fca5a5);
}

.alert-medium .alert-btn {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.alert-medium .alert-btn:hover {
  background: linear-gradient(135deg, #fde68a, #fcd34d);
}

.alert-low .alert-btn {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.alert-low .alert-btn:hover {
  background: linear-gradient(135deg, #a7f3d0, #6ee7b7);
}

.recent-activity {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
</style>
