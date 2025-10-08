<template>
  <div class="status-monitor">
    <div class="monitor-header">
      <h2>Status Monitor</h2>
      <div class="status-summary">
        <div class="status-item online">
          <span class="status-count">{{ onlineUsers?.length || 0 }}</span>
          <span class="status-label">Online</span>
        </div>
        <div class="status-item offline">
          <span class="status-count">{{ offlineUsers?.length || 0 }}</span>
          <span class="status-label">Offline</span>
        </div>
      </div>
    </div>

    <div class="status-grid">
      <!-- Online Users -->
      <div class="status-section">
        <div class="section-header">
          <h3>
            <span class="status-icon online">🟢</span>
            Online Users ({{ onlineUsers?.length || 0 }})
          </h3>
        </div>

        <div class="users-grid">
          <div v-for="user in onlineUsers || []" :key="user?.id" class="user-card online">
            <div class="user-avatar">
              {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="user-info">
              <h4>{{ user?.name || 'Unknown' }}</h4>
              <p>{{ user?.role?.replace('_', ' ') || 'No role' }}</p>
              <span class="last-seen">
                Last seen: {{ user?.lastSeen ? formatLastSeen(user.lastSeen) : 'Never' }}
              </span>
            </div>
            <div class="user-status">
              <span class="status-badge online">Online</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Offline Users -->
      <div class="status-section">
        <div class="section-header">
          <h3>
            <span class="status-icon offline">⚫</span>
            Offline Users ({{ offlineUsers?.length || 0 }})
          </h3>
        </div>

        <div class="users-grid">
          <div v-for="user in offlineUsers || []" :key="user?.id" class="user-card offline">
            <div class="user-avatar">
              {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div class="user-info">
              <h4>{{ user?.name || 'Unknown' }}</h4>
              <p>{{ user?.role?.replace('_', ' ') || 'No role' }}</p>
              <span class="last-seen">
                Last seen: {{ user?.lastSeen ? formatLastSeen(user.lastSeen) : 'Never' }}
              </span>
            </div>
            <div class="user-status">
              <span class="status-badge offline">Offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Department Breakdown -->
    <div class="department-breakdown">
      <h3>By Department</h3>
      <div class="department-stats">
        <div v-for="[department, users] in departmentStats" :key="department" class="dept-stat">
          <div class="dept-info">
            <h4>{{ department }}</h4>
            <p>{{ users.total }} users</p>
          </div>
          <div class="dept-status">
            <span class="online-count">{{ users.online }} online</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { users, onlineUsers, offlineUsers } from '@/composables/useGmStore.js';

// Computed properties
const departmentStats = computed(() => {
  if (!users.value || !users.value.length) return [];

  const departments = {};
  users.value.forEach(user => {
    if (!departments[user?.department]) {
      departments[user?.department] = { total: 0, online: 0 };
    }
    departments[user?.department].total++;
    if (user?.status === 'online') {
      departments[user?.department].online++;
    }
  });
  return Object.entries(departments);
});

// Methods
const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never';

  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  const diffMs = now - lastSeenDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return diffMinutes <= 0 ? 'Just now' : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};
</script>

<style scoped>
.status-monitor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.monitor-header h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.status-summary {
  display: flex;
  gap: 2rem;
}

.status-item {
  text-align: center;
}

.status-count {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.status-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.status-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  font-size: 1.5rem;
}

.users-grid {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.user-card {
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.user-card.online {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-color: #bbf7d0;
}

.user-card.offline {
  background: #f9fafb;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.user-info p {
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.last-seen {
  color: #9ca3af;
  font-size: 0.8rem;
}

.user-status {
  text-align: right;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.online {
  background: #dcfce7;
  color: #166534;
}

.status-badge.offline {
  background: #f3f4f6;
  color: #374151;
}

.department-breakdown {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.department-breakdown h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.department-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.dept-stat {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dept-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.dept-info p {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.online-count {
  color: #059669;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .status-monitor {
    padding: 1rem;
  }

  .monitor-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .status-summary {
    justify-content: center;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .department-stats {
    grid-template-columns: 1fr;
  }

  .dept-stat {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}
</style>
