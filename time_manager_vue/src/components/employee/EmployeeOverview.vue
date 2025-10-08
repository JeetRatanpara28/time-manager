<template>
  <div class="employee-overview">
    <div class="welcome-section">
      <h2>Welcome back, {{ currentUser?.name || 'Employee' }}!</h2>
      <p>Track your time and view your work summary</p>
    </div>

    <!-- Current Status Card -->
    <div class="status-card">
      <div class="status-header">
        <h3>Today's Status</h3>
        <div class="status-indicator" :class="currentStatus.class">
          {{ currentStatus.text }}
        </div>
      </div>

      <div class="status-details">
        <div class="detail-item">
          <span class="label">Clock In:</span>
          <span class="value">{{ todaysLog?.clockIn || '--:--' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Clock Out:</span>
          <span class="value">{{ todaysLog?.clockOut || '--:--' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Total Hours:</span>
          <span class="value">{{ todaysLog?.totalHours || 0 }}h</span>
        </div>
        <div class="detail-item">
          <span class="label">Break Time:</span>
          <span class="value">{{ breakDuration }}m</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h4>{{ weeklyHours }}</h4>
          <p>This Week</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h4>{{ monthlyHours }}</h4>
          <p>This Month</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-content">
          <h4>{{ averageDailyHours }}</h4>
          <p>Daily Average</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div v-for="log in recentLogs" :key="log.id" class="activity-item">
          <div class="activity-date">
            {{ formatDate(log.date) }}
          </div>
          <div class="activity-details">
            <div class="activity-times">
              <span class="time">{{ log.clockIn }} - {{ log.clockOut || 'Active' }}</span>
              <span class="hours">{{ log.totalHours }}h</span>
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

    <!-- Quick Actions -->
    <div class="quick-actions">
      <button
        class="action-btn primary"
        @click="handleStartWorking"
        :disabled="isLoading || todaysLog?.status === 'active'"
      >
        <span class="btn-icon">⏰</span>
        {{ todaysLog?.status === 'active' ? 'Continue Working' : 'Start Working' }}
      </button>

      <button
        class="action-btn secondary"
        @click="handleViewLogs"
      >
        <span class="btn-icon">📋</span>
        View All Logs
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  currentUser,
  todaysLog,
  weeklyHours,
  monthlyHours,
  recentLogs,
  isLoading
} from '@/composables/useEmployeeStore.js';

// Define emits for Vue 3
const emit = defineEmits(['navigate']);

const currentStatus = computed(() => {
  if (!todaysLog.value) return { text: 'Not Started', class: 'not-started' };
  if (todaysLog.value?.status === 'active') return { text: 'Working', class: 'working' };
  return { text: 'Completed', class: 'completed' };
});

const breakDuration = computed(() => {
  if (!todaysLog.value?.breakStart) return 0;

  const breakStart = new Date(`2000-01-01T${todaysLog.value.breakStart}:00`);
  const now = new Date();
  const diffMs = now - breakStart;
  return Math.floor(diffMs / (1000 * 60));
});

const averageDailyHours = computed(() => {
  if (!monthlyHours.value) return '0.0';
  const total = parseFloat(monthlyHours.value);

  // Calculate days in current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const average = total / Math.max(daysInMonth, 1);
  return average.toFixed(1);
});

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
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
      year: 'numeric'
    });
  }
};

// Action handlers with safeguards
const handleStartWorking = () => {
  console.log('handleStartWorking called - navigating to clock view');
  // Check if already active to prevent double navigation
  if (todaysLog.value?.status === 'active') {
    console.log('Already active, not navigating');
    return;
  }
  // Emit navigation event to parent component
  emit('navigate', 'clock');
};

const handleViewLogs = () => {
  console.log('handleViewLogs called - navigating to logs view');
  // Emit navigation event to parent component
  emit('navigate', 'logs');
};
</script>

<style scoped>
.employee-overview {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: #64748b;
  font-size: 1.2rem;
}

.status-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-indicator.not-started {
  background: #f3f4f6;
  color: #6b7280;
}

.status-indicator.working {
  background: #dcfce7;
  color: #166534;
}

.status-indicator.completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-item .label {
  font-weight: 500;
  color: #64748b;
}

.detail-item .value {
  font-weight: 600;
  color: #1e293b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
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

.stat-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.stat-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.recent-activity {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
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
  min-width: 100px;
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

.activity-times .time {
  font-size: 0.9rem;
  color: #64748b;
}

.activity-times .hours {
  font-weight: 600;
  color: #1e293b;
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

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s ease;
  min-width: 200px;
  justify-content: center;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.action-btn.secondary {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.action-btn.secondary:hover {
  background: #e2e8f0;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .employee-overview {
    padding: 1rem;
  }

  .welcome-section h2 {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .status-details {
    grid-template-columns: 1fr;
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

  .quick-actions {
    flex-direction: column;
  }

  .action-btn {
    min-width: auto;
  }
}
</style>
