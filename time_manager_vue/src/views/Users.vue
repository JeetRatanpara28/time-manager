<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from "vue";

type User = { id: string; username: string; email: string };

// WorkingTime filter helpers
function openWtFilter() {
  const y1 = new Date();
  y1.setDate(y1.getDate() - 1);
  y1.setHours(0, 0, 0, 0);
  const y2 = new Date();
  y2.setDate(y2.getDate() - 1);
  y2.setHours(23, 59, 59, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  wtFilterStart.value = toLocal(y1);
  wtFilterEnd.value = toLocal(y2);
  showWtFilter.value = true;
}
function toQueryDateTime(dtl: string) {
  if (!dtl) return "";
  const base = dtl.replace("T", " ");
  return base.length === 16 ? `${base}:00` : base;
}
async function applyWtFilter() {
  if (!activeUserId.value) return;
  if (!wtFilterStart.value || !wtFilterEnd.value) {
    alert("Please select start and end");
    return;
  }
  const qs = new URLSearchParams({
    start: toQueryDateTime(wtFilterStart.value),
    end: toQueryDateTime(wtFilterEnd.value),
  });
  const res = await fetch(
    `/api/workingtime/${activeUserId.value}?${qs.toString()}`
  );
  const json = await res.json();
  wtResultsList.value = Array.isArray(json)
    ? json
    : json && Array.isArray(json.data)
    ? json.data
    : [];
  showWtResults.value = true;
}
function closeWtFilter() {
  showWtFilter.value = false;
}
function closeWtResults() {
  showWtResults.value = false;
}
const users = ref<User[]>([]);
const username = ref("");
const email = ref("");
const newUsername = ref("");
const newEmail = ref("");
const selectedId = ref<string | null>(null);
const editUsername = ref("");
const editEmail = ref("");
let searchTimer: number | undefined;
// Single-page dashboard panel state
const activeUserId = ref<string | null>(null);
const expandPanels = ref(false);
const activeUserName = ref("");

// WorkingTime state for active user
type WT = { id: string; start: string; end: string; user_id: string };
const wtList = ref<WT[]>([]);
const wtStart = ref("");
const wtEnd = ref("");
const wtCustomStart = ref(""); // datetime-local
const wtCustomEnd = ref(""); // datetime-local
// WorkingTime filter modal state
const showWtFilter = ref(false);
const wtFilterStart = ref(""); // datetime-local
const wtFilterEnd = ref(""); // datetime-local
const showWtResults = ref(false);
const wtResultsList = ref<WT[]>([]);

// Clocks state for active user
type Clock = { id: string; time: string; status: boolean };
const clocks = ref<Clock[]>([]);
const clocksError = ref("");
const toggling = ref(false);
const panelWrap = ref<HTMLElement | null>(null);
const clockRange = ref<"day" | "week" | "month" | "year" | "all">("day");

// Dashboard computed summaries
const currentStatus = computed(() => {
  if (!clocks.value.length) return "Unknown";
  const first = clocks.value[0];
  return first && first.status ? "IN" : "OUT";
});

// (Removed temporary donut computation and rendering)

const lastClockTime = computed(() => {
  const first = clocks.value[0];
  return first ? first.time : "—";
});

// Live timers
// Global tick increments every second to refresh time-based computed values
const tick = ref(0);
let tickId: number | undefined;

// Current IN session elapsed time (only while status is IN)
const currentSessionMs = computed(() => {
  if (!clocks.value.length) return 0;
  const latest = clocks.value[0];
  if (!latest || !latest.status) return 0;
  const since = new Date(latest.time as any).getTime();
  void tick.value; // update every second
  const now = Date.now(); // tick triggers recompute but we use Date.now for accuracy
  if (isNaN(since) || now <= since) return 0;
  return now - since;
});
const pad2 = (n: number) => n.toString().padStart(2, "0");
const sessionHMS = computed(() => {
  const ms = currentSessionMs.value;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
});

function stopTick() {
  if (tickId) {
    window.clearInterval(tickId);
    tickId = undefined;
  }
  tick.value = 0;
}

// Always run a 1s ticker so stopwatch and session views update in real-time
onMounted(() => {
  tickId = window.setInterval(() => {
    tick.value = (tick.value + 1) % 86400; // seconds, reset daily
  }, 1000);
});
onUnmounted(stopTick);

// Daily stopwatch (resets at local midnight). Accumulates IN intervals today and, if currently IN, adds running time.
function getTodayStart(): number {
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  return d.getTime();
}
const dailyElapsedMs = computed(() => {
  const startMs = getTodayStart();
  // sort ascending by time
  const events = [...clocks.value].sort(
    (a, b) =>
      new Date(a.time as any).getTime() - new Date(b.time as any).getTime()
  );
  let total = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    const t = new Date(e.time as any).getTime();
    if (isNaN(t) || t < startMs) continue;
    const next = events[i + 1];
    void tick.value; // ensure updates each second
    const nextT = next ? new Date(next.time as any).getTime() : Date.now();
    if (isNaN(nextT) || nextT <= t) continue;
    if (e.status) total += nextT - t;
  }
  // If currently IN and last event is IN, ensure we add from its time to now (already handled above with next as now)
  return total;
});
const dailyHMS = computed(() => {
  const ms = dailyElapsedMs.value; // tick triggers recompute
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
});

// (removed unused parseIsoSafe)

// Simple header countdown controlled by preset buttons (Full/Half Day)
const targetDurationMs = ref<number | null>(null);
const lastRemainingTargetMs = ref(0);
const headerRemainingMs = computed(() => {
  void tick.value;
  if (!targetDurationMs.value) return 0;
  const used = dailyElapsedMs.value;
  let rem = Math.max(0, targetDurationMs.value - used);
  if (currentStatus.value !== "IN") return lastRemainingTargetMs.value;
  lastRemainingTargetMs.value = rem;
  return rem;
});
const headerRemainingHMS = computed(() => {
  let sec = Math.max(0, Math.floor(headerRemainingMs.value / 1000));
  const h = Math.floor(sec / 3600);
  sec -= h * 3600;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
});

const totalHoursText = computed(() => {
  if (!wtList.value.length) return "0h 00m";
  let ms = 0;
  for (const w of wtList.value) {
    if (!w.start || !w.end) continue;
    const s = new Date(w.start as any).getTime();
    const e = new Date(w.end as any).getTime();
    if (!isNaN(s) && !isNaN(e) && e > s) ms += e - s;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  const mm = m.toString().padStart(2, "0");
  return `${h}h ${mm}m`;
});

// Human-friendly datetime formatting for employees
function formatDT(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso as any);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const lastClockTimePretty = computed(() => formatDT(lastClockTime.value));

// Filter clocks client-side by selected range without removing original logs
const filteredClocks = computed(() => {
  if (clockRange.value === "all") return clocks.value;
  const now = new Date();
  let from = new Date(now);
  switch (clockRange.value) {
    case "day":
      from = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      break;
    case "week": {
      const day = now.getDay() || 7; // Monday-based if needed
      from = new Date(now);
      from.setDate(now.getDate() - (day - 1));
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      break;
  }
  const fromMs = from.getTime();
  return clocks.value.filter((c) => {
    const t = new Date(c.time as any).getTime();
    return !isNaN(t) && t >= fromMs;
  });
});

async function fetchUsers() {
  const q = new URLSearchParams();
  if (username.value) q.set("username", username.value);
  if (email.value) q.set("email", email.value);
  const res = await fetch(
    "/api/users" + (q.toString() ? `?${q.toString()}` : "")
  );
  const json = await res.json();
  users.value = Array.isArray(json)
    ? json
    : json && Array.isArray(json.data)
    ? json.data
    : [];
}

onMounted(fetchUsers);

// Debounce search on input changes
watch([username, email], () => {
  if (searchTimer) window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    fetchUsers();
  }, 300);
});

async function createUser() {
  if (!newUsername.value || !newEmail.value) return;
  await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: { username: newUsername.value, email: newEmail.value },
    }),
  });
  newUsername.value = "";
  newEmail.value = "";
  await fetchUsers();
}

function selectForEdit(u: User) {
  selectedId.value = u.id;
  editUsername.value = u.username;
  editEmail.value = u.email;
}

async function updateUser() {
  if (!selectedId.value) return;
  await fetch(`/api/users/${selectedId.value}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: { username: editUsername.value, email: editEmail.value },
    }),
  });
  selectedId.value = null;
  editUsername.value = "";
  editEmail.value = "";
  await fetchUsers();
}

async function deleteUser(id: string) {
  if (!confirm("Delete this user? This action cannot be undone.")) return;
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    alert(`Failed to delete user (status ${res.status}). ${txt}`);
    return;
  }
  await fetchUsers();
}

async function setActiveUserMeta(id: string) {
  // Try to get name from the loaded list first
  const found = users.value.find((u) => u.id === id);
  if (found) {
    activeUserName.value = found.username;
    return;
  }
  // Fallback: fetch single user
  try {
    const res = await fetch(`/api/users/${id}`);
    if (res.ok) {
      const json = await res.json();
      const data = Array.isArray(json) ? json[0] : json && (json.data || json);
      if (data && data.username) activeUserName.value = data.username;
    }
  } catch (_) {
    // ignore
  }
}

async function openPanels(id: string) {
  activeUserId.value = id;
  // Open inline by default (no fullscreen overlay)
  expandPanels.value = false;
  await setActiveUserMeta(id);
  // Default date range = today
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  wtStart.value = fmt(start);
  wtEnd.value = fmt(end);
  const d1 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9,
    0,
    0
  );
  const d2 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    17,
    0,
    0
  );
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  wtCustomStart.value = toLocal(d1);
  wtCustomEnd.value = toLocal(d2);
  await loadWT();
  await loadClocks();
  nextTick().then(() => {
    panelWrap.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function closePanels() {
  activeUserId.value = null;
  expandPanels.value = false;
  wtList.value = [];
  clocks.value = [];
  clocksError.value = "";
}

async function loadWT() {
  if (!activeUserId.value) return;
  const q = new URLSearchParams({ start: wtStart.value, end: wtEnd.value });
  const res = await fetch(
    `/api/workingtime/${activeUserId.value}?${q.toString()}`
  );
  const json = await res.json();
  wtList.value = Array.isArray(json)
    ? json
    : json && Array.isArray(json.data)
    ? json.data
    : [];
}

async function addWT() {
  if (!activeUserId.value) return;
  if (!wtCustomStart.value || !wtCustomEnd.value) {
    alert("Pick start and end");
    return;
  }
  const startIso =
    wtCustomStart.value.length === 16
      ? `${wtCustomStart.value}:00Z`
      : `${wtCustomStart.value}Z`;
  const endIso =
    wtCustomEnd.value.length === 16
      ? `${wtCustomEnd.value}:00Z`
      : `${wtCustomEnd.value}Z`;
  const resp = await fetch(`/api/workingtime/${activeUserId.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to create working time (status ${resp.status}). ${txt}`);
    return;
  }
  // Set the header target based on this custom interval duration (ms)
  try {
    const s = new Date(startIso as any).getTime();
    const e = new Date(endIso as any).getTime();
    if (!isNaN(s) && !isNaN(e) && e > s) {
      targetDurationMs.value = e - s;
    }
  } catch (_) {}
  await loadWT();
}

async function deleteWT(id: string) {
  const resp = await fetch(`/api/workingtime/${id}`, { method: "DELETE" });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to delete working time (status ${resp.status}). ${txt}`);
    return;
  }
  await loadWT();
}

// Preset helpers for WorkingTime (professional quick actions)
async function addPresetFullDay() {
  if (!activeUserId.value) return;
  const d = new Date();
  const s = new Date(d);
  s.setHours(9, 0, 0, 0);
  const e = new Date(d);
  e.setHours(17, 0, 0, 0);
  const startIso = s.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endIso = e.toISOString().replace(/\.\d{3}Z$/, "Z");
  const resp = await fetch(`/api/workingtime/${activeUserId.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to add full day (status ${resp.status}). ${txt}`);
    return;
  }
  // Set header countdown for Full Day (8h)
  targetDurationMs.value = 8 * 3600000;
  await loadWT();
}

async function addPresetHalfDay() {
  if (!activeUserId.value) return;
  const d = new Date();
  const s = new Date(d);
  s.setHours(9, 0, 0, 0);
  const e = new Date(d);
  e.setHours(13, 0, 0, 0);
  const startIso = s.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endIso = e.toISOString().replace(/\.\d{3}Z$/, "Z");
  const resp = await fetch(`/api/workingtime/${activeUserId.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to add half day (status ${resp.status}). ${txt}`);
    return;
  }
  // Set header countdown for Half Day (4h)
  targetDurationMs.value = 4 * 3600000;
  await loadWT();
}

async function loadClocks() {
  if (!activeUserId.value) return;
  clocksError.value = "";
  const res = await fetch(`/api/clocks/${activeUserId.value}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    clocksError.value = `Failed to load clocks (status ${res.status}). ${txt}`;
    clocks.value = [];
    return;
  }
  const json = await res.json();
  clocks.value = Array.isArray(json)
    ? json
    : json && Array.isArray(json.data)
    ? json.data
    : [];
}

async function toggleClockInline() {
  if (!activeUserId.value) return;
  toggling.value = true;
  const resp = await fetch(`/api/clocks/${activeUserId.value}`, {
    method: "POST",
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    alert(`Failed to toggle clock (status ${resp.status}). ${txt}`);
    toggling.value = false;
    return;
  }
  await loadClocks();
  toggling.value = false;
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <h2 class="title">Users</h2>
      <div class="actions">
        <div class="header-timer">
          <div class="header-row">
            <span class="label">Remaining</span>
            <span class="digits big">{{ headerRemainingHMS }}</span>
          </div>
          <div class="header-row subtle">
            <span class="label">Today</span>
            <span class="digits small">{{ dailyHMS }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="summary">
      <div class="muted" v-if="!users.length">No users found.</div>
      <div v-else>
        <strong>{{ users.length }}</strong> user(s) found
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <h3>Create user</h3>
      </div>
      <div class="row">
        <input v-model="newUsername" class="input" placeholder="username" />
        <input v-model="newEmail" class="input" placeholder="email" />
        <button class="btn primary" @click="createUser">Create</button>
      </div>
    </div>

    <div class="table-wrap table-scroll users-scroll" v-if="users.length">
      <table class="table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th style="width: 260px">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td>
              <button class="btn" @click="selectForEdit(u)">Edit</button>
              <button class="btn danger" @click="deleteUser(u.id)">
                Delete
              </button>
              <span class="sep">|</span>
              <button class="btn primary" @click="openPanels(u.id)">
                Select
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedId" class="card">
      <div class="card-head">
        <h3>Edit user</h3>
      </div>
      <div class="row">
        <input v-model="editUsername" class="input" placeholder="username" />
        <input v-model="editEmail" class="input" placeholder="email" />
        <button class="btn primary" @click="updateUser">Save</button>
        <button class="btn" @click="selectedId = null">Cancel</button>
      </div>
    </div>
    <!-- Integrated single-page panels (dashboard style, no popups) -->
    <div class="dashboard-area">
      <div v-if="activeUserId" class="panel-wrap" ref="panelWrap">
        <div class="panel-head simple">
          <h3 class="title" style="margin: 0">
            User: {{ activeUserName || "..." }}
          </h3>
          <button class="btn" @click="closePanels">Clear selection</button>
        </div>
        <div class="panel-grid">
          <!-- WorkingTime panel -->
          <div class="card">
            <div class="card-head">
              <h3>WorkingTime</h3>
            </div>
            <div class="row" style="justify-content: space-between">
              <div class="muted small">Add entries</div>
              <div style="display: flex; gap: 8px">
                <button class="btn" @click="addPresetFullDay">
                  Full office working time
                </button>
                <button class="btn" @click="addPresetHalfDay">
                  Half working time
                </button>
              </div>
            </div>
            <div class="row">
              <input
                type="datetime-local"
                v-model="wtCustomStart"
                class="input"
              />
              <input
                type="datetime-local"
                v-model="wtCustomEnd"
                class="input"
              />
              <button class="btn primary" @click="addWT">Add</button>
            </div>
            <div class="row" style="margin-top: -6px">
              <button class="btn" @click="openWtFilter">Filter</button>
            </div>
            <div class="table-scroll" v-if="wtList.length">
              <table class="table">
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>End</th>
                    <th style="width: 80px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="w in wtList" :key="w.id">
                    <td>{{ formatDT(w.start) }}</td>
                    <td>{{ formatDT(w.end) }}</td>
                    <td>
                      <button class="btn danger" @click="deleteWT(w.id)">
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="muted">No working times in range.</div>
          </div>

          <!-- Clocks panel -->
          <div class="card">
            <div class="card-head">
              <h3>Clock In/Out</h3>
            </div>
            <div
              class="row"
              style="justify-content: space-between; align-items: center"
            >
              <div class="status">
                <span class="muted small">Current status:</span>
                <span
                  :class="['badge', currentStatus === 'IN' ? 'in' : 'out']"
                  >{{ currentStatus }}</span
                >
                <span class="muted small" style="margin-left: 8px"
                  >Last event:</span
                >
                {{ lastClockTimePretty }}
                <div class="timer" v-if="currentStatus === 'IN'">
                  <span class="muted small">Elapsed:</span>
                  <strong class="time-digits">{{ sessionHMS }}</strong>
                </div>
              </div>
              <button
                class="punch-btn"
                :class="currentStatus === 'IN' ? 'out' : 'in'"
                @click="toggleClockInline"
                :disabled="toggling"
              >
                {{
                  toggling
                    ? "Processing..."
                    : currentStatus === "IN"
                    ? "Punch OUT"
                    : "Punch IN"
                }}
              </button>
            </div>
            <div
              class="row"
              style="
                justify-content: space-between;
                align-items: center;
                margin-top: 8px;
              "
            >
              <div class="muted small">View punching history</div>
              <div class="seg">
                <button
                  :class="['seg-btn', clockRange === 'day' ? 'active' : '']"
                  @click="clockRange = 'day'"
                >
                  1 day
                </button>
                <button
                  :class="['seg-btn', clockRange === 'week' ? 'active' : '']"
                  @click="clockRange = 'week'"
                >
                  1 week
                </button>
                <button
                  :class="['seg-btn', clockRange === 'month' ? 'active' : '']"
                  @click="clockRange = 'month'"
                >
                  1 month
                </button>
                <button
                  :class="['seg-btn', clockRange === 'year' ? 'active' : '']"
                  @click="clockRange = 'year'"
                >
                  1 year
                </button>
                <button
                  :class="['seg-btn', clockRange === 'all' ? 'active' : '']"
                  @click="clockRange = 'all'"
                >
                  Overall
                </button>
              </div>
            </div>
            <div class="muted" v-if="clocksError">{{ clocksError }}</div>
            <div class="table-scroll" v-if="filteredClocks.length">
              <table class="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in filteredClocks" :key="c.id">
                    <td>{{ formatDT(c.time) }}</td>
                    <td>
                      <span :class="['badge', c.status ? 'in' : 'out']">{{
                        c.status ? "IN" : "OUT"
                      }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="muted">No clock events in this range.</div>
          </div>
          <div class="cards-row">
            <div class="mini-card">
              <div class="label">Today Total</div>
              <div class="value">{{ totalHoursText }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="muted placeholder">
        Select a user to view their dashboard.
      </div>
    </div>
  </div>

  <!-- Working Time Filter Modal -->
  <div v-if="showWtFilter" class="modal-overlay" @click.self="closeWtFilter">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wtFilterTitle"
    >
      <div class="modal-header">
        <h3 id="wtFilterTitle">Filter Working Time</h3>
        <button class="btn small ghost" @click="closeWtFilter">✕</button>
      </div>
      <div class="modal-body">
        <div class="row">
          <label style="min-width: 80px">Start</label>
          <input type="datetime-local" v-model="wtFilterStart" class="input" />
        </div>
        <div class="row">
          <label style="min-width: 80px">End</label>
          <input type="datetime-local" v-model="wtFilterEnd" class="input" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="closeWtFilter">Close</button>
        <button class="btn primary" @click="applyWtFilter">Apply</button>
      </div>
    </div>
  </div>

  <!-- Working Time Results Modal -->
  <div v-if="showWtResults" class="modal-overlay" @click.self="closeWtResults">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wtResultsTitle"
    >
      <div class="modal-header">
        <h3 id="wtResultsTitle">Filtered Results</h3>
        <button class="btn small ghost" @click="closeWtResults">✕</button>
      </div>
      <div class="modal-body">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in wtResultsList" :key="r.id">
                <td>{{ formatDT(r.start) }}</td>
                <td>{{ formatDT(r.end) }}</td>
              </tr>
              <tr v-if="wtResultsList.length === 0">
                <td colspan="2" class="muted">No data in this range</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="closeWtResults">Close</button>
      </div>
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
  justify-content: center;
  gap: 12px;
}
.page-head .actions {
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-head .title {
  display: none;
}
.title {
  margin: 0;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.summary {
  color: #666;
}
.row {
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
.input {
  padding: 8px 10px;
  border: 1px solid #d8d8e0;
  border-radius: 8px;
  background: #fff;
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
.btn.danger {
  border-color: #e56;
  color: #e11;
}
.btn.danger:hover {
  background: #fff1f1;
}
.table-wrap {
  background: #fff;
  border: 1px solid #e9e9ef;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
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
.link {
  color: #1f3fd1;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.sep {
  color: #999;
  margin: 0 6px;
}
.panel-wrap {
  margin-top: 8px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 10px;
}
.panel-head.simple {
  background: #fff;
  border: 1px solid #e9e9ef;
  border-radius: 10px;
  padding: 10px 12px;
}
.panel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 900px) {
  .panel-grid {
    grid-template-columns: 1fr 1fr;
  }
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
.panel-wrap.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  padding: 20px;
  overflow: auto;
}
.panel-wrap.overlay .panel-grid > .card {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}
.panel-wrap.overlay .panel-head {
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 12px;
}
.punch-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.punch-btn.in {
  background: #137b2b;
}
.punch-btn.in:hover {
  background: #0f6a24;
}
.punch-btn.out {
  background: #b40000;
}
.punch-btn.out:hover {
  background: #9a0000;
}
.cards-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.mini-card {
  background: #fff;
  border: 1px solid #e9e9ef;
  border-radius: 10px;
  padding: 12px 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.mini-card .label {
  font-size: 12px;
  color: #777;
}
.mini-card .value {
  font-size: 20px;
  font-weight: 700;
}
/* Reduce page scrolling by constraining tables to scroll inside cards */
.table-scroll {
  max-height: 260px;
  overflow: auto;
}
.users-scroll {
  max-height: 220px;
}
@media (min-height: 900px) {
  .table-scroll {
    max-height: 360px;
  }
  .users-scroll {
    max-height: 300px;
  }
}
/* Two-column layout: left (users), right (dashboard) */
.page-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 1000px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
.col.left,
.col.right {
  min-width: 0;
}
.timer {
  margin-top: 6px;
}
.time-digits {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 18px;
  margin-left: 6px;
}

/* Floating top-left timer */
.top-timer {
  position: fixed;
  top: 64px;
  left: 16px;
  z-index: 20;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
}
.top-timer .label {
  font-size: 12px;
  opacity: 0.8;
}
.top-timer .digits {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 16px;
  font-weight: 700;
}

/* Header centered timer styles */
.header-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 10px;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.header-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.header-row.subtle {
  opacity: 0.85;
  margin-top: 2px;
}
.digits.big {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 20px;
  font-weight: 700;
}
.digits.small {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  font-weight: 600;
}

/* Timer mode controls */
.header-row.controls {
  margin-top: 6px;
}
.timer-mode,
.timer-input {
  padding: 6px 8px;
  border: 1px solid #394150;
  background: #0f172a;
  color: #e5e7eb;
  border-radius: 8px;
}
.timer-mode {
  margin-right: 8px;
}
</style>
