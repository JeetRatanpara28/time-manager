<template>
  <div class="manager-dashboard">
    <div class="dashboard-header">
      <h1>Manager Dashboard</h1>
      <p>Manage your team and track work hours</p>
    </div>

    <!-- Universal Clock Control Component -->
    <ClockControl user-role="manager" />

    <!-- Manager-specific content can go here -->
    <div class="manager-specific-content">
      <div class="team-overview">
        <h2>Team Overview</h2>
        <div class="overview-grid">
          <div class="overview-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <h3>Team Members</h3>
              <p class="card-value">{{ teamMembersCount }}</p>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">⏰</div>
            <div class="card-content">
              <h3>Active Sessions</h3>
              <p class="card-value">{{ activeTeamSessions }}</p>
            </div>
          </div>
          <div class="overview-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>Team Hours (Week)</h3>
              <p class="card-value">{{ teamWeeklyHours }}h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { users, timeLogs, initializeManagerData } from '@/composables/useManagerStore.js';
import ClockControl from '@/components/shared/ClockControl.vue';

// Manager-specific computed properties
const teamMembersCount = computed(() => {
  return users.value.filter(user => user.role === 'employee').length;
});

const activeTeamSessions = computed(() => {
  return timeLogs.value.filter(log => log.status === 'active').length;
});

const teamWeeklyHours = computed(() => {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const weekLogs = timeLogs.value.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= weekStart && log.totalHours;
  });

  return weekLogs.reduce((total, log) => total + (log.totalHours || 0), 0).toFixed(1);
});

onMounted(() => {
  // Initialize manager data (keeping legacy compatibility)
  initializeManagerData().catch((err) => {
    console.error('Failed to initialize manager data:', err);
  });
});
</script>

<style scoped>
.manager-dashboard {
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

.manager-specific-content {
  margin-top: 2rem;
}

.team-overview h2 {
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
  .manager-dashboard {
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
