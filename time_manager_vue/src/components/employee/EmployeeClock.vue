<template>
  <div class="employee-dashboard">
    <!-- Modern Header with Gradient -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <h1>
            <span class="wave">👋</span>
            <span class="greeting">Welcome Back</span>
          </h1>
          <p class="subtitle">{{ currentUser?.name || 'Employee' }}</p>
          <p class="description">Track your time, manage breaks, and view your work history</p>
        </div>
        <div class="header-stats">
          <div class="stat-badge">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <span class="stat-label">Today</span>
              <span class="stat-value">{{ todaysHours }}h</span>
            </div>
          </div>
          <div class="stat-badge">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <span class="stat-label">This Week</span>
              <span class="stat-value">{{ weeklyHours || '0' }}h</span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitializing" class="loading-container">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your workspace...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-content">
      <!-- Clock Control Section -->
      <div class="clock-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">⏰</span>
            Time Tracking
          </h2>
          <div class="live-indicator">
            <span class="pulse-dot"></span>
            Live
          </div>
        </div>
        <ClockControl user-role="employee" />
      </div>

      <!-- Recent Activity Section -->
      <div class="activity-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">📊</span>
            Recent Activity
          </h2>
          <span class="activity-count">{{ recentLogs?.length || 0 }} entries</span>
        </div>

        <div v-if="recentLogs && recentLogs.length > 0" class="activity-grid">
          <div v-for="log in recentLogs.slice(0, 5)" :key="log.id" class="activity-card">
            <div class="card-header">
              <div class="date-badge">
                <span class="date-icon">📆</span>
                <span class="date-text">{{ formatDate(log.date) }}</span>
              </div>
              <div class="status-badge" :class="log.status">
                <span class="status-dot"></span>
                {{ log.status === 'active' ? 'Active' : 'Complete' }}
              </div>
            </div>
            
            <div class="card-content">
              <div class="time-row">
                <div class="time-item">
                  <span class="time-label">Clock In</span>
                  <span class="time-value">{{ log.clockIn || '--:--' }}</span>
                </div>
                <div class="time-divider">→</div>
                <div class="time-item">
                  <span class="time-label">Clock Out</span>
                  <span class="time-value">{{ log.clockOut || 'Active' }}</span>
                </div>
              </div>
              
              <div class="hours-display">
                <span class="hours-icon">⏱️</span>
                <span class="hours-value">{{ formatHours(log.totalHours) }}</span>
                <span class="hours-unit">hours</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Activity Yet</h3>
          <p>Start tracking your time by clocking in</p>
          <div class="empty-decoration">
            <div class="deco-line"></div>
            <div class="deco-circle"></div>
            <div class="deco-line"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { recentLogs, initializeEmployeeData, currentUser, weeklyHours, todaysLog } from '@/composables/useEmployeeStore.js';
import ClockControl from '@/components/shared/ClockControl.vue';

const isInitializing = ref(true);

// Computed for today's hours
const todaysHours = computed(() => {
  if (!todaysLog || !todaysLog.value) return '0.0';
  const hours = todaysLog.value.totalHours || 0;
  return typeof hours === 'number' ? hours.toFixed(1) : parseFloat(hours || 0).toFixed(1);
});

onMounted(async () => {
  try {
    await initializeEmployeeData();
    console.log('✅ Employee data initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize employee data:', err);
  } finally {
    isInitializing.value = false;
  }
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
        day: 'numeric'
      });
    }
  } catch (error) {
    return dateString;
  }
};

const formatHours = (hours) => {
  if (!hours && hours !== 0) return '0.0';
  return typeof hours === 'number' ? hours.toFixed(1) : parseFloat(hours || 0).toFixed(1);
};
</script>

<style scoped>
.employee-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 3rem;
}

/* ===== HEADER SECTION ===== */
.dashboard-header {
  position: relative;
  padding: 3rem 2rem;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-text {
  flex: 1;
  min-width: 300px;
}

.header-text h1 {
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  line-height: 1.2;
}

.wave {
  animation: wave 2s ease-in-out infinite;
  display: inline-block;
  font-size: 2.5rem;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.greeting {
  background: linear-gradient(to right, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  opacity: 0.95;
  color: #fef3c7;
}

.description {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.85;
  font-weight: 400;
  max-width: 500px;
  line-height: 1.6;
}

.header-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 160px;
  transition: all 0.3s ease;
}

.stat-badge:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1;
}

.header-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: -75px;
  right: 30%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.1); }
}

/* ===== MAIN CONTENT ===== */
.dashboard-content {
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: 0 2rem;
  position: relative;
  z-index: 3;
}

.loading-container {
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: 0 2rem;
}

.loading-card {
  background: white;
  border-radius: 24px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #f3f4f6;
  border-top: 6px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-text {
  font-size: 1.2rem;
  color: #64748b;
  font-weight: 600;
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.5rem;
  display: inline-block;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #16a34a;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.activity-count {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

/* ===== CLOCK SECTION ===== */
.clock-section {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
}

/* ===== ACTIVITY SECTION ===== */
.activity-section {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.activity-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.date-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.date-icon {
  font-size: 1rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-badge.active {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

.status-badge.active .status-dot {
  background: #22c55e;
}

.status-badge.complete {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.status-badge.complete .status-dot {
  background: #3b82f6;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.time-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.time-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.time-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', monospace;
}

.time-divider {
  color: #cbd5e1;
  font-size: 1.2rem;
  font-weight: 300;
}

.hours-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.hours-icon {
  font-size: 1.5rem;
}

.hours-value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.hours-unit {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
}

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #94a3b8;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
  animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #64748b;
  margin: 0 0 0.75rem 0;
}

.empty-state p {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
}

.empty-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.deco-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
}

.deco-circle {
  width: 8px;
  height: 8px;
  background: #cbd5e1;
  border-radius: 50%;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 2rem 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-text h1 {
    font-size: 2rem;
  }

  .wave {
    font-size: 1.75rem;
  }

  .subtitle {
    font-size: 1.25rem;
  }

  .description {
    font-size: 1rem;
  }

  .header-stats {
    flex-direction: column;
  }

  .stat-badge {
    width: 100%;
  }

  .dashboard-content,
  .loading-container {
    padding: 0 1rem;
  }

  .clock-section,
  .activity-section {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .activity-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>