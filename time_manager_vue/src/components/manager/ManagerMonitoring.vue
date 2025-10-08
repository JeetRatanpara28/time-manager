<template>
  <div class="manager-monitoring">
    <div class="header">
      <h2>Employee Monitoring</h2>
      <p>Real-time status and activity monitoring of your team</p>
    </div>

    <!-- Live Status Overview -->
    <div class="status-overview">
      <div class="status-card online">
        <div class="status-icon">🟢</div>
        <div class="status-content">
          <h3>{{ onlineEmployees }}</h3>
          <p>Online Now</p>
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
          <p>Active Today</p>
        </div>
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
          <span class="status-badge" :class="getEmployeeStatus(employee)">
            {{ getEmployeeStatus(employee) === 'online' ? 'Online' :
               getEmployeeStatus(employee) === 'active' ? 'Working' : 'Offline' }}
          </span>
        </div>

        <div class="col-today">
          <div class="today-activity">
            <div class="activity-item">
              <span class="label">Clock In:</span>
              <span class="value">{{ getTodayActivity(employee).clockIn || '--:--' }}</span>
            </div>
            <div class="activity-item">
              <span class="label">Hours:</span>
              <span class="value">{{ getTodayActivity(employee).hours || 0 }}h</span>
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
        <p>No employees assigned to your team</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <h3>Today's Team Summary</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ teamStats.totalMembers }}</span>
          <span class="stat-label">Total Team</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ teamStats.activeNow }}</span>
          <span class="stat-label">Currently Working</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ teamStats.onBreak }}</span>
          <span class="stat-label">On Break</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ teamStats.completedToday }}</span>
          <span class="stat-label">Completed Today</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { users, teamStats, exportTeamLogsToCSV } from '@/composables/useManagerStore.js';

const employees = computed(() =>
  users.value.filter(u => u.role === 'employee')
);

const onlineEmployees = computed(() =>
  employees.value.filter(emp => getEmployeeStatus(emp) === 'online').length
);

const offlineEmployees = computed(() =>
  employees.value.filter(emp => getEmployeeStatus(emp) === 'offline').length
);

const activeToday = computed(() =>
  employees.value.filter(emp => getTodayActivity(emp).clockIn).length
);

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getEmployeeStatus = (employee) => {
  // For demo purposes, simulate online/offline status
  // In real implementation, this would come from a live status API
  const todayActivity = getTodayActivity(employee);
  if (todayActivity.clockIn && !todayActivity.clockOut) {
    return 'active'; // Currently working
  }
  // Simulate some employees being online
  return Math.random() > 0.6 ? 'online' : 'offline';
};

const getTodayActivity = (employee) => {
  // Mock data for demonstration - in real app this would come from API
  const today = new Date().toISOString().split('T')[0];
  const mockData = {
    '1': { clockIn: '09:00', hours: 7.5 },
    '2': { clockIn: '08:30', clockOut: '17:00', hours: 8.5 },
    '3': { clockIn: '09:15', hours: 6.0 },
    '4': { clockIn: null, hours: 0 }
  };
  return mockData[employee.id] || { clockIn: null, hours: 0 };
};

const viewEmployeeLogs = (employee) => {
  // Navigate to employee logs view
  console.log('Viewing logs for:', employee.name);
  // In real implementation, this would navigate to logs view with employee filter
};

const exportEmployeeLogs = (employee) => {
  exportTeamLogsToCSV(employee.id);
};
</script>

<style scoped>
.manager-monitoring {
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

.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.status-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.status-card:hover {
  transform: translateY(-2px);
}

.status-card.online {
  border-left: 4px solid #10b981;
}

.status-card.offline {
  border-left: 4px solid #ef4444;
}

.status-card.active {
  border-left: 4px solid #3b82f6;
}

.status-icon {
  font-size: 2rem;
}

.status-content h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.status-content p {
  color: #64748b;
  margin: 0;
  font-size: 0.9rem;
}

.employees-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr;
  gap: 1rem;
  padding: 1rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.col-employee {
  display: flex;
  align-items: center;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.employee-details {
  display: flex;
  flex-direction: column;
}

.employee-name {
  font-weight: 600;
  color: #1e293b;
}

.employee-email {
  font-size: 0.8rem;
  color: #64748b;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.online {
  background: #dcfce7;
  color: #166534;
}

.status-badge.active {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.offline {
  background: #fee2e2;
  color: #991b1b;
}

.today-activity {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-item .label {
  font-size: 0.8rem;
  color: #64748b;
}

.activity-item .value {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.action-btn.view:hover {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn.export:hover {
  background: #f3f4f6;
  color: #374151;
}

.no-employees {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.quick-stats {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.quick-stats h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .manager-monitoring {
    padding: 1rem;
  }

  .status-overview {
    grid-template-columns: 1fr;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1rem;
  }

  .col-employee,
  .col-status,
  .col-today,
  .col-actions {
    padding: 0.5rem 0;
  }

  .employee-info {
    flex-direction: column;
    text-align: center;
  }

  .today-activity {
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
