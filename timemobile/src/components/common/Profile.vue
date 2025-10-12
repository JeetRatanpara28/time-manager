<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="avatar-section">
          <img :src="userAvatar" :alt="userName" class="profile-avatar" />
          <button @click="changeAvatar" class="avatar-edit-btn">📷</button>
        </div>

        <div class="user-details">
          <h1 class="user-name">{{ userName }}</h1>
          <p class="user-email">{{ userEmail }}</p>
          <div class="user-role-badge" :class="userRole">
            {{ getRoleLabel(userRole) }}
          </div>
        </div>
      </div>

      <!-- Profile Stats -->
      <div class="stats-section">
        <h2>📊 Your Stats</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalHours }}h</div>
              <div class="stat-label">Total Hours</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalDays }}</div>
              <div class="stat-label">Days Worked</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.avgHours }}h</div>
              <div class="stat-label">Avg/Day</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.thisWeek }}h</div>
              <div class="stat-label">This Week</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="settings-section">
        <h2>⚙️ Account Settings</h2>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Email</div>
            <div class="setting-value">{{ userEmail }}</div>
          </div>
          <button @click="editEmail" class="btn-edit-small">Edit</button>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Password</div>
            <div class="setting-value">••••••••</div>
          </div>
          <button @click="changePassword" class="btn-edit-small">Change</button>
        </div>

        <div v-if="userDepartment" class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Department</div>
            <div class="setting-value">{{ userDepartment }}</div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">Member Since</div>
            <div class="setting-value">{{ memberSince }}</div>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="danger-section">
        <h2>⚠️ Danger Zone</h2>

        <div class="danger-item">
          <div class="danger-info">
            <div class="danger-label">Clear Local Data</div>
            <div class="danger-description">Remove all locally stored data</div>
          </div>
          <button @click="clearLocalData" class="btn-danger-small">
            Clear
          </button>
        </div>

        <div class="danger-item">
          <div class="danger-info">
            <div class="danger-label">Logout</div>
            <div class="danger-description">Sign out from your account</div>
          </div>
          <button @click="handleLogout" class="btn-danger">Logout</button>
        </div>
      </div>

      <!-- App Info -->
      <div class="app-info">
        <p>Time Manager Pro v1.0.0</p>
        <p class="info-small">Made with ❤️ for productivity</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { user as currentUser, logout } from "@/store/authStore";
import db from "@/db/database";

const router = useRouter();
const stats = ref({
  totalHours: 0,
  totalDays: 0,
  avgHours: 0,
  thisWeek: 0,
});

const userName = computed(() => {
  return (
    currentUser.value?.name ||
    currentUser.value?.username ||
    currentUser.value?.email ||
    "User"
  );
});

const userEmail = computed(() => currentUser.value?.email || "");
const userRole = computed(() => currentUser.value?.role || "employee");
const userDepartment = computed(() => currentUser.value?.department || "");

const userAvatar = computed(() => {
  const name = userName.value;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=667eea&color=fff&size=256`;
});

const memberSince = computed(() => {
  const insertedAt =
    currentUser.value?.inserted_at || currentUser.value?.created_at;
  if (!insertedAt) return "N/A";

  try {
    const date = new Date(insertedAt);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
});

function getRoleLabel(role) {
  const labels = {
    employee: "Employee",
    manager: "Manager",
    gm: "General Manager",
    general_manager: "General Manager",
  };
  return labels[role] || role;
}

function changeAvatar() {
  alert("Avatar upload feature coming soon!");
}

function editEmail() {
  const newEmail = prompt("Enter new email address:", userEmail.value);
  if (newEmail && newEmail !== userEmail.value) {
    alert("Email update feature coming soon!");
  }
}

function changePassword() {
  router.push("/change-password");
}

function clearLocalData() {
  const confirmed = confirm(
    "Are you sure you want to clear all local data?\n\nThis will remove all cached information. You can sync again when online."
  );

  if (confirmed) {
    try {
      // Clear all local storage except auth data
      const authKeys = [
        "timemanager_token",
        "timemanager_refresh_token",
        "timemanager_user",
      ];
      const allKeys = Object.keys(localStorage);

      allKeys.forEach((key) => {
        if (!authKeys.includes(key) && key.startsWith("timemanager_")) {
          localStorage.removeItem(key);
        }
      });

      alert("Local data cleared successfully!");
      loadStats();
    } catch (err) {
      console.error("Failed to clear local data:", err);
      alert("Failed to clear local data");
    }
  }
}

async function handleLogout() {
  const confirmed = confirm("Are you sure you want to logout?");

  if (confirmed) {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }
}

function loadStats() {
  try {
    const userId = currentUser.value?.id;
    if (!userId) return;

    const workingTimes = db
      .getWorkingTimes()
      .filter((wt) => (wt.user_id || wt.userId) === userId);

    if (workingTimes.length === 0) {
      return;
    }

    // Calculate total hours
    let totalMinutes = 0;
    const daysWorked = new Set();
    let weekMinutes = 0;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    workingTimes.forEach((wt) => {
      const start = wt.start || wt.clock_in;
      const end = wt.end || wt.clock_out;

      if (start && end) {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const minutes = (endTime - startTime) / (1000 * 60);

        totalMinutes += minutes;

        // Track unique days
        const day = startTime.toISOString().split("T")[0];
        daysWorked.add(day);

        // This week
        if (startTime >= weekAgo) {
          weekMinutes += minutes;
        }
      }
    });

    const totalHours = totalMinutes / 60;
    const avgHours = daysWorked.size > 0 ? totalHours / daysWorked.size : 0;
    const weekHours = weekMinutes / 60;

    stats.value = {
      totalHours: Math.round(totalHours * 10) / 10,
      totalDays: daysWorked.size,
      avgHours: Math.round(avgHours * 10) / 10,
      thisWeek: Math.round(weekHours * 10) / 10,
    };
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  padding-bottom: 100px;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.avatar-section {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: #667eea;
  border: 3px solid white;
  border-radius: 50%;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
  background: #764ba2;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.user-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.user-email {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.user-role-badge {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-role-badge.employee {
  background: #dbeafe;
  color: #1e40af;
}

.user-role-badge.manager {
  background: #fef3c7;
  color: #92400e;
}

.user-role-badge.gm,
.user-role-badge.general_manager {
  background: #fce7f3;
  color: #9f1239;
}

.stats-section,
.settings-section,
.danger-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-section h2,
.settings-section h2,
.danger-section h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.setting-item,
.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item:last-child,
.danger-item:last-child {
  border-bottom: none;
}

.setting-info,
.danger-info {
  flex: 1;
}

.setting-label,
.danger-label {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.setting-value {
  color: #64748b;
  font-size: 0.9rem;
}

.danger-description {
  color: #64748b;
  font-size: 0.85rem;
}

.btn-edit-small,
.btn-danger-small {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-small {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit-small:hover {
  background: #bfdbfe;
}

.btn-danger-small {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger-small:hover {
  background: #fecaca;
}

.btn-danger {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.danger-section {
  border: 2px solid #fee2e2;
}

.danger-section h2 {
  color: #dc2626;
}

.app-info {
  text-align: center;
  color: white;
  padding: 1rem;
  opacity: 0.9;
}

.app-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.info-small {
  font-size: 0.8rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .user-name {
    font-size: 1.5rem;
  }

  .setting-item,
  .danger-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-edit-small,
  .btn-danger-small,
  .btn-danger {
    width: 100%;
  }
}
</style>
