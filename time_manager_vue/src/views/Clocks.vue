<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

type Clock = { id: string; time: string; status: boolean };
const route = useRoute();
const clocks = ref<Clock[]>([]);
const loading = ref(false);
const missingUser = ref(false);
const errorMsg = ref("");

async function fetchClocks() {
  const userId = route.params.userId as string | undefined;
  if (!userId || userId === "undefined") {
    missingUser.value = true;
    return;
  }
  errorMsg.value = "";
  const res = await fetch(`/api/clocks/${userId}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    errorMsg.value = `Failed to load clocks (status ${res.status}). ${txt}`;
    clocks.value = [];
    return;
  }
  try {
    const json = await res.json();
    clocks.value = Array.isArray(json)
      ? json
      : json && Array.isArray(json.data)
      ? json.data
      : [];
  } catch (e) {
    errorMsg.value = "Failed to parse clocks response as JSON.";
    clocks.value = [];
  }
}

async function toggleClock() {
  const userId = route.params.userId as string | undefined;
  if (!userId || userId === "undefined") {
    missingUser.value = true;
    return;
  }
  loading.value = true;
  const resp = await fetch(`/api/clocks/${userId}`, { method: "POST" });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to toggle clock (status ${resp.status}). ${txt}`);
    loading.value = false;
    return;
  }
  await fetchClocks();
  loading.value = false;
}

onMounted(fetchClocks);
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h2 class="title">Clocks</h2>
      <div class="actions">
        <button class="btn primary" @click="toggleClock" :disabled="loading">
          {{ loading ? "Working..." : "Toggle Clock" }}
        </button>
      </div>
    </div>

    <div v-if="missingUser" class="alert error">
      Missing or invalid user. Go back to Users and click a user's Clocks link.
    </div>
    <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>

    <div class="card">
      <div class="card-head">
        <h3>History</h3>
      </div>
      <div v-if="!clocks.length" class="muted">
        No clock events yet. Click "Toggle Clock" to create one.
      </div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Time (UTC)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in clocks" :key="c.id">
            <td>{{ c.time }}</td>
            <td>
              <span :class="['badge', c.status ? 'in' : 'out']">{{
                c.status ? "IN" : "OUT"
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.title {
  margin: 0;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.card {
  background: #fff;
  border: 1px solid #e9e9ef;
  border-radius: 12px;
  padding: 14px;
  margin: 8px 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.btn {
  padding: 8px 12px;
  border: 1px solid #c8c8d4;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}
.btn:hover {
  background: #f6f6f9;
}
.btn.primary {
  background: #1f3fd1;
  border-color: #1f3fd1;
  color: #fff;
}
.btn.primary:hover {
  background: #1936b7;
}
.alert {
  padding: 10px 12px;
  border-radius: 8px;
}
.alert.error {
  background: #fff1f1;
  color: #b40000;
  border: 1px solid #ffd3d3;
}
.muted {
  color: #666;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f5;
  text-align: left;
}
.table thead th {
  background: #fafbff;
  font-weight: 600;
  color: #555;
}
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge.in {
  background: #e7f6ec;
  color: #137b2b;
  border: 1px solid #bfe8cc;
}
.badge.out {
  background: #fff5e6;
  color: #8a4b00;
  border: 1px solid #ffd9a8;
}
</style>
