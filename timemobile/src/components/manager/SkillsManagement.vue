<template>
  <div class="skills-management">
    <div class="header">
      <h2>📊 Working Time Statistics</h2>
      <p>Comprehensive analysis of employee working hours and patterns</p>
    </div>

    <!-- Filter Controls -->
    <div class="filters">
      <div class="filter-group">
        <label>Time Period:</label>
        <select v-model="selectedPeriod" class="filter-select">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div
        class="filter-group"
        v-if="userRole === 'gm' || userRole === 'manager'"
      >
        <label>Department:</label>
        <select v-model="selectedDepartment" class="filter-select">
          <option value="all">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-content">
          <h3>Total Hours</h3>
          <p class="stat-value">{{ totalHours }}h</p>
          <span class="stat-change positive">+12% from last period</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>Active Employees</h3>
          <p class="stat-value">{{ activeEmployees }}</p>
          <span class="stat-change">{{ filteredUsers.length }} total</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h3>Avg Hours/Day</h3>
          <p class="stat-value">{{ averageHoursPerDay }}h</p>
          <span class="stat-change neutral">Standard: 8h</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <h3>Overtime</h3>
          <p class="stat-value">{{ overtimeHours }}h</p>
          <span
            class="stat-change"
            :class="overtimeHours > 20 ? 'negative' : 'neutral'"
          >
            {{ overtimeHours > 20 ? "High" : "Normal" }}
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <!-- Working Hours Trend Chart -->
      <div class="chart-card">
        <h3>📈 Working Hours Trend</h3>
        <div class="chart-container">
          <canvas ref="trendChart"></canvas>
        </div>
      </div>

      <!-- Department Distribution Chart -->
      <div
        class="chart-card"
        v-if="userRole === 'gm' || userRole === 'manager'"
      >
        <h3>🏢 Hours by Department</h3>
        <div class="chart-container">
          <canvas ref="departmentChart"></canvas>
        </div>
      </div>

      <!-- Employee Hours Comparison -->
      <div class="chart-card wide">
        <h3>👤 Employee Hours Comparison</h3>
        <div class="chart-container">
          <canvas ref="employeeChart"></canvas>
        </div>
      </div>

      <!-- Clock In/Out Patterns -->
      <div class="chart-card">
        <h3>🕐 Clock In/Out Patterns</h3>
        <div class="chart-container">
          <canvas ref="patternsChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Detailed Table -->
    <div class="table-section">
      <h3>📋 Detailed Working Time Records</h3>
      <div class="table-controls">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or department..."
          class="search-input"
        />
        <button @click="exportData" class="export-btn">📥 Export CSV</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Total Hours</th>
              <th>Days Worked</th>
              <th>Avg Hours/Day</th>
              <th>Overtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredRecords" :key="record.userId">
              <td class="employee-cell">
                <div class="employee-info">
                  <span class="employee-avatar">{{ record.initials }}</span>
                  <span>{{ record.name }}</span>
                </div>
              </td>
              <td>{{ record.department }}</td>
              <td class="hours-cell">{{ record.totalHours }}h</td>
              <td>{{ record.daysWorked }}</td>
              <td>{{ record.avgHours }}h</td>
              <td class="overtime-cell" :class="{ high: record.overtime > 10 }">
                {{ record.overtime }}h
              </td>
              <td>
                <span class="status-badge" :class="record.status">
                  {{ record.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { users, timeLogs } from "@/composables/useTimeStore.js";
import {
  user as authUser,
  userRole as authUserRole,
} from "@/store/authStore.js";
import Chart from "chart.js/auto";

// Refs
const selectedPeriod = ref("week");
const selectedDepartment = ref("all");
const searchQuery = ref("");
const trendChart = ref(null);
const departmentChart = ref(null);
const employeeChart = ref(null);
const patternsChart = ref(null);

let trendChartInstance = null;
let departmentChartInstance = null;
let employeeChartInstance = null;
let patternsChartInstance = null;

// User role
const userRole = computed(() => authUserRole.value);

// Departments list
const departments = computed(() => {
  const depts = new Set(users.value.map((u) => u.department).filter(Boolean));
  return Array.from(depts).sort();
});

// Filtered users based on role and department
const filteredUsers = computed(() => {
  let filtered = users.value;

  // Filter by role permissions
  if (userRole.value === "employee") {
    filtered = filtered.filter((u) => u.id === authUser.value?.id);
  } else if (userRole.value === "manager") {
    // Managers see their team (employees)
    filtered = filtered.filter(
      (u) => u.role === "employee" || u.id === authUser.value?.id
    );
  }

  // Filter by department
  if (selectedDepartment.value !== "all") {
    filtered = filtered.filter(
      (u) => u.department === selectedDepartment.value
    );
  }

  return filtered;
});

// Calculate statistics
const totalHours = computed(() => {
  const logs = getFilteredLogs();
  return logs.reduce((sum, log) => sum + (log.totalHours || 0), 0).toFixed(1);
});

const activeEmployees = computed(() => {
  const today = new Date().toISOString().split("T")[0];
  return timeLogs.value.filter(
    (log) => log.date === today && log.status === "active"
  ).length;
});

const averageHoursPerDay = computed(() => {
  const logs = getFilteredLogs();
  const daysWithLogs = new Set(logs.map((log) => log.date)).size;
  if (daysWithLogs === 0) return "0.0";
  return (
    logs.reduce((sum, log) => sum + (log.totalHours || 0), 0) / daysWithLogs
  ).toFixed(1);
});

const overtimeHours = computed(() => {
  const logs = getFilteredLogs();
  return logs
    .reduce((sum, log) => {
      const hours = log.totalHours || 0;
      return sum + (hours > 8 ? hours - 8 : 0);
    }, 0)
    .toFixed(1);
});

// Employee records for table
const filteredRecords = computed(() => {
  let records = filteredUsers.value.map((user) => {
    const userLogs = getFilteredLogs().filter((log) => log.userId === user.id);
    const totalHours = userLogs.reduce(
      (sum, log) => sum + (log.totalHours || 0),
      0
    );
    const daysWorked = new Set(userLogs.map((log) => log.date)).size;
    const avgHours = daysWorked > 0 ? totalHours / daysWorked : 0;
    const overtime = userLogs.reduce((sum, log) => {
      const hours = log.totalHours || 0;
      return sum + (hours > 8 ? hours - 8 : 0);
    }, 0);

    return {
      userId: user.id,
      name: user.name || user.email,
      initials: (user.name || user.email)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      department: user.department || "N/A",
      totalHours: totalHours.toFixed(1),
      daysWorked,
      avgHours: avgHours.toFixed(1),
      overtime: overtime.toFixed(1),
      status: user.status || "offline",
    };
  });

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    records = records.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query)
    );
  }

  return records;
});

// Helper to get filtered logs based on period
function getFilteredLogs() {
  const now = new Date();
  let startDate;

  if (selectedPeriod.value === "week") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (selectedPeriod.value === "month") {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  }

  return timeLogs.value.filter((log) => {
    const logDate = new Date(log.date);
    const userMatch = filteredUsers.value.some((u) => u.id === log.userId);
    return logDate >= startDate && userMatch;
  });
}

// Create charts
function createTrendChart() {
  if (!trendChart.value) return;

  const ctx = trendChart.value.getContext("2d");
  const logs = getFilteredLogs();

  // Group by date
  const dateMap = {};
  logs.forEach((log) => {
    if (!dateMap[log.date]) dateMap[log.date] = 0;
    dateMap[log.date] += log.totalHours || 0;
  });

  const dates = Object.keys(dateMap).sort().slice(-14); // Last 14 days
  const hours = dates.map((date) => dateMap[date].toFixed(1));

  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates.map((d) =>
        new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Total Hours",
          data: hours,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Hours" } },
      },
    },
  });
}

function createDepartmentChart() {
  if (!departmentChart.value) return;

  const ctx = departmentChart.value.getContext("2d");
  const logs = getFilteredLogs();

  // Group by department
  const deptMap = {};
  logs.forEach((log) => {
    const user = users.value.find((u) => u.id === log.userId);
    const dept = user?.department || "Unknown";
    if (!deptMap[dept]) deptMap[dept] = 0;
    deptMap[dept] += log.totalHours || 0;
  });

  const depts = Object.keys(deptMap);
  const hours = Object.values(deptMap);

  if (departmentChartInstance) departmentChartInstance.destroy();

  departmentChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: depts,
      datasets: [
        {
          data: hours,
          backgroundColor: [
            "#667eea",
            "#764ba2",
            "#f093fb",
            "#4facfe",
            "#43e97b",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

function createEmployeeChart() {
  if (!employeeChart.value) return;

  const ctx = employeeChart.value.getContext("2d");
  const logs = getFilteredLogs();

  // Group by user
  const userMap = {};
  logs.forEach((log) => {
    if (!userMap[log.userId]) userMap[log.userId] = 0;
    userMap[log.userId] += log.totalHours || 0;
  });

  const topUsers = Object.entries(userMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const names = topUsers.map(([userId]) => {
    const user = users.value.find((u) => u.id === parseInt(userId));
    return user?.name || user?.email || "Unknown";
  });
  const hours = topUsers.map(([, hours]) => hours.toFixed(1));

  if (employeeChartInstance) employeeChartInstance.destroy();

  employeeChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: names,
      datasets: [
        {
          label: "Total Hours",
          data: hours,
          backgroundColor: "#667eea",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Hours" } },
      },
    },
  });
}

function createPatternsChart() {
  if (!patternsChart.value) return;

  const ctx = patternsChart.value.getContext("2d");
  const logs = getFilteredLogs().filter((log) => log.clockIn);

  // Group by hour
  const hourMap = Array(24).fill(0);
  logs.forEach((log) => {
    if (log.clockIn) {
      const hour = parseInt(log.clockIn.split(":")[0]);
      hourMap[hour]++;
    }
  });

  if (patternsChartInstance) patternsChartInstance.destroy();

  patternsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: "Clock-ins",
          data: hourMap,
          backgroundColor: "#10b981",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
      },
    },
  });
}

// Export data
function exportData() {
  const headers = [
    "Employee",
    "Department",
    "Total Hours",
    "Days Worked",
    "Avg Hours/Day",
    "Overtime",
    "Status",
  ];
  const rows = filteredRecords.value.map((r) => [
    r.name,
    r.department,
    r.totalHours,
    r.daysWorked,
    r.avgHours,
    r.overtime,
    r.status,
  ]);

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `working_time_stats_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// Watch for changes and update charts
watch(
  [selectedPeriod, selectedDepartment, timeLogs, users],
  async () => {
    await nextTick();
    createTrendChart();
    createDepartmentChart();
    createEmployeeChart();
    createPatternsChart();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  createTrendChart();
  createDepartmentChart();
  createEmployeeChart();
  createPatternsChart();
});
</script>

<style scoped>
.skills-management {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.header p {
  color: #64748b;
  font-size: 1.1rem;
}

.filters {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #667eea;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.stat-change.positive {
  background: #dcfce7;
  color: #16a34a;
}

.stat-change.negative {
  background: #fee2e2;
  color: #dc2626;
}

.stat-change.neutral {
  background: #f1f5f9;
  color: #64748b;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-card.wide {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.chart-container {
  height: 300px;
  position: relative;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-section h3 {
  font-size: 1.2rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.export-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.employee-cell {
  font-weight: 500;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.hours-cell {
  font-weight: 600;
  color: #667eea;
}

.overtime-cell {
  font-weight: 600;
}

.overtime-cell.high {
  color: #dc2626;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.online {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.offline {
  background: #f1f5f9;
  color: #64748b;
}

@media (max-width: 768px) {
  .skills-management {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .chart-card.wide {
    grid-column: 1;
  }

  .table-controls {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }
}
</style>
