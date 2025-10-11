<template>
  <div class="employee-dashboard">
    <div class="dashboard-header">
      <h1>Employee Dashboard</h1>
      <p>Manage your work hours and breaks</p>
    </div>

    <!-- Loading state -->
    <div v-if="!currentUser" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading employee data...</p>
    </div>

    <!-- Clock Control Component -->
    <div v-else class="clock-section">
      <ClockControl user-role="employee" />
    </div>

    <!-- Recent Activity -->
    <div v-if="currentUser" class="employee-specific-content">
      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div class="activity-list">
          <div v-for="log in recentLogs" :key="log.id" class="activity-item">
            <div class="activity-date">{{ new Date(log.date).toLocaleDateString() }}</div>
            <div class="activity-details">
              <span class="activity-time">{{ log.clockIn }} - {{ log.clockOut || 'Active' }}</span>
              <span class="activity-hours">{{ log.totalHours || 0 }}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { recentLogs, initializeEmployeeData, currentUser } from '@/composables/useEmployeeStore.js';
import ClockControl from '@/components/shared/ClockControl.vue';

// FIXED: Initialize inside onMounted callback, not as async onMounted
onMounted(() => {
  initializeEmployeeData()
    .then(() => {
      console.log('✅ Employee data initialized successfully');
    })
    .catch((err) => {
      console.error('❌ Failed to initialize employee data:', err);
    });
});
</script>

<style scoped>
.employee-dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.clock-section {
  margin-bottom: 2rem;
}

.employee-specific-content {
  margin-top: 2rem;
}

.recent-activity h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.activity-date {
  font-weight: 600;
  color: #1e293b;
}

.activity-details {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.activity-time {
  color: #64748b;
  font-size: 0.9rem;
}

.activity-hours {
  font-weight: 600;
  color: #059669;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .employee-dashboard {
    padding: 1rem;
  }

  .dashboard-header h1 {
    font-size: 1.5rem;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .activity-details {
    width: 100%;
    justify-content: space-between;
  }
}
</style>