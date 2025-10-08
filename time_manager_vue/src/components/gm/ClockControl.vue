<template>
  <div class="gm-dashboard">
    <div class="dashboard-header">
      <h1>General Manager Dashboard</h1>
      <p>Manage team time tracking and oversee operations</p>
    </div>

    <!-- Universal Clock Control Component -->
    <ClockControl user-role="gm" />

    <!-- GM-specific content can go here -->
    <div class="gm-specific-content">
      <div class="system-overview">
        <h2>System Overview</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <h3>All Users</h3>
              <p class="card-value">{{ users.length }}</p>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">⏰</div>
            <div class="card-content">
              <h3>Active Sessions</h3>
              <p class="card-value">{{ activeSessionsCount }}</p>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>Total Hours (Week)</h3>
              <p class="card-value">{{ totalWeeklyHours }}h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { users, timeLogs, initializeGmData } from '@/composables/useGmStore.js';
import ClockControl from '@/components/shared/ClockControl.vue';

// GM-specific computed properties
const activeSessionsCount = computed(() => {
  return timeLogs.value.filter(log => log.status === 'active').length;
});

const totalWeeklyHours = computed(() => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekLogs = timeLogs.value.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && log.totalHours;
  });

  return weekLogs.reduce((total, log) => total + (log.totalHours || 0), 0).toFixed(1);
});

onMounted(() => {
  // Initialize GM data (keeping legacy compatibility)
  initializeGmData().catch((err) => {
    console.error('Failed to initialize GM data:', err);
  });
});
</script>

<style scoped>
.gm-dashboard {
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

.gm-specific-content {
  margin-top: 2rem;
}

.system-overview h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

@media (max-width: 768px) {
  .gm-dashboard {
    padding: 1rem;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .overview-card {
    padding: 1rem;
  }
}
</style>
