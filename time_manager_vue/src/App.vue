<script setup lang="ts">
// minimal shell with a top navigation bar
function onSignUp() {
  alert("Sign Up clicked");
}

function addExtraMinutes(mins: number = 30) {
  const startStr = ensureStart();
  const base = wtEnd.value ? new Date(wtEnd.value) : new Date(startStr);
  const newEnd = new Date(base.getTime() + mins * 60 * 1000);
  const candidate = toInputLocal(newEnd);
  if (durationHours(wtStart.value, candidate) > 8) {
    errorMsg.value = "Cannot exceed 8 hours";
    return;
  }
  wtEnd.value = candidate;
}

function msToHMS(ms: number): string {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toInputLocal(dt: Date) {
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate()
  )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function ensureStart(): string {
  if (wtStart.value) return wtStart.value;
  const now = new Date();
  wtStart.value = toInputLocal(now);
  return wtStart.value;
}
function setDurationHours(hours: number) {
  const startStr = ensureStart();
  const start = new Date(startStr);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  wtEnd.value = toInputLocal(end);
}
function setHalfTime() {
  setDurationHours(4);
}
function setFullTime() {
  setDurationHours(8);
}

function durationHours(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const s = parseDt(startIso);
  const e = parseDt(endIso);
  if (!s || !e || e <= s) return 0;
  return (e - s) / (1000 * 60 * 60);
}

type SessionRow = {
  in?: string;
  out?: string;
  breakIn?: string;
  breakOut?: string;
};
const sessionHistory = ref<SessionRow[]>([]);

function saveSessionHistory() {
  if (!selectedId.value) return;
  localStorage.setItem(
    sessionStorageKey(selectedId.value),
    JSON.stringify(sessionHistory.value)
  );
}
function loadSessionHistory(uid: number) {
  try {
    const raw = localStorage.getItem(sessionStorageKey(uid));
    sessionHistory.value = raw ? JSON.parse(raw) || [] : [];
  } catch {
    sessionHistory.value = [];
  }
}

function selectWorkingTime(wt: WorkingTime) {
  wtStart.value = wt.start;
  wtEnd.value = wt.end;
  selectedWTId.value = wt.id;
  // Prepare clocking panel: set planned clock-in time (does not clock in yet)
  workStartIso.value = wt.start || workStartIso.value;
  workEndIso.value = null;
  workIn.value = false;
  onBreak.value = false;
}

// Working Time edit modal state & handlers
const showWtEditModal = ref(false);
const wtEditId = ref<number | null>(null);
const wtEditStart = ref("");
const wtEditEnd = ref("");

function openWtEdit(wt: WorkingTime) {
  errorMsg.value = "";
  successMsg.value = "";
  wtEditId.value = wt.id;
  wtEditStart.value = wt.start;
  wtEditEnd.value = wt.end;
  showWtEditModal.value = true;
}

function cancelWtEdit() {
  showWtEditModal.value = false;
  wtEditId.value = null;
}

async function saveWtEdit() {
  if (wtEditId.value == null) return;
  if (!wtEditStart.value || !wtEditEnd.value) {
    errorMsg.value = "Please provide start and end";
    return;
  }
  if (durationHours(wtEditStart.value, wtEditEnd.value) > 8) {
    errorMsg.value = "Maximum allowed duration is 8 hours";
    return;
  }
  try {
    const res = await fetch(`${PHX_BASE}/api/workingtime/${wtEditId.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        working_time: { start: wtEditStart.value, end: wtEditEnd.value },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to update working time");
    }
    successMsg.value = "Working time updated";
    showWtEditModal.value = false;
    wtEditId.value = null;
    await loadWorkingTimes();
  } catch (e: any) {
    errorMsg.value = e?.message || "Update working time failed";
  }
}

async function deleteWorkingTime(wt: WorkingTime) {
  if (!wt?.id) return;
  try {
    const res = await fetch(`${PHX_BASE}/api/workingtime/${wt.id}`, {
      method: "DELETE",
    });
    if (!(res.status === 204 || res.ok)) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to delete working time");
    }
    successMsg.value = "Working time deleted";
    await loadWorkingTimes();
    if (selectedWTId.value === wt.id) {
      selectedWTId.value = null;
      wtStart.value = "";
      wtEnd.value = "";
    }
  } catch (e: any) {
    errorMsg.value = e?.message || "Delete working time failed";
  }
}

// Working Time delete modal state & handlers
const showWtDeleteModal = ref(false);
const wtDeleteId = ref<number | null>(null);
const wtDeleteLabel = ref("");

function openWtDelete(wt: WorkingTime) {
  errorMsg.value = "";
  successMsg.value = "";
  wtDeleteId.value = wt.id;
  wtDeleteLabel.value = `${fmtDate(wt.start)} ${fmtTime(wt.start)} → ${fmtDate(
    wt.end
  )} ${fmtTime(wt.end)}`;
  showWtDeleteModal.value = true;
}

function cancelWtDelete() {
  showWtDeleteModal.value = false;
  wtDeleteId.value = null;
}

async function confirmWtDelete() {
  if (wtDeleteId.value == null) return;
  try {
    const res = await fetch(`${PHX_BASE}/api/workingtime/${wtDeleteId.value}`, {
      method: "DELETE",
    });
    if (!(res.status === 204 || res.ok)) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to delete working time");
    }
    successMsg.value = "Working time deleted";
    showWtDeleteModal.value = false;
    // clear selection if needed
    if (selectedWTId.value === wtDeleteId.value) {
      selectedWTId.value = null;
      wtStart.value = "";
      wtEnd.value = "";
    }
    wtDeleteId.value = null;
    await loadWorkingTimes();
  } catch (e: any) {
    errorMsg.value = e?.message || "Delete working time failed";
  }
}

// Selected user & view state
const selectedId = ref<number | null>(null);
const showUserDetail = ref(false);

// ========== Working Time & Clocks (detail view) ==========
type WorkingTime = { id: number; start: string; end: string };
type Clock = {
  id: number;
  time: string;
  status: boolean;
  type?: "work" | "break";
  break?: boolean;
};

const workingTimes = ref<WorkingTime[]>([]);
const wtLoading = ref(false);
const wtStart = ref("");
const wtEnd = ref("");
const selectedWTId = ref<number | null>(null);

const clocks = ref<Clock[]>([]);
const clockLoading = ref(false);
// Local clocked-in state used by UI to avoid backend-side anomalies
const workIn = ref(false);
// Track current session boundaries for correct timing display
const workStartIso = ref<string | null>(null);
const workEndIso = ref<string | null>(null);
const onBreak = ref(false);
const breakIns = ref<string[]>([]);
const breakOuts = ref<string[]>([]);

// Live clock ticker
const nowTs = ref<number>(Date.now());
let tickId: any = null;

function breakStorageKey(uid: number) {
  return `breakEvents:${uid}`;
}
function sessionStorageKey(uid: number) {
  return `sessionHistory:${uid}`;
}
function saveBreakLocal() {
  if (!selectedId.value) return;
  const payload = {
    onBreak: onBreak.value,
    ins: breakIns.value,
    outs: breakOuts.value,
  };
  localStorage.setItem(
    breakStorageKey(selectedId.value),
    JSON.stringify(payload)
  );
}
function loadBreakLocal(uid: number) {
  try {
    const raw = localStorage.getItem(breakStorageKey(uid));
    if (!raw) {
      onBreak.value = false;
      breakIns.value = [];
      breakOuts.value = [];
      return;
    }
    const parsed = JSON.parse(raw || "{}");
    onBreak.value = Boolean(parsed.onBreak);
    breakIns.value = Array.isArray(parsed.ins) ? parsed.ins : [];
    breakOuts.value = Array.isArray(parsed.outs) ? parsed.outs : [];
  } catch {
    onBreak.value = false;
    breakIns.value = [];
    breakOuts.value = [];
  }
}

async function loadWorkingTimes() {
  if (!selectedId.value) return;
  wtLoading.value = true;
  try {
    const res = await fetch(`${PHX_BASE}/api/workingtime/${selectedId.value}`);
    if (!res.ok) throw new Error("Failed to fetch working times");
    const json = await res.json();
    workingTimes.value = json.data || [];
  } catch (e: any) {
    errorMsg.value = e?.message || "Unable to load working times";
  } finally {
    wtLoading.value = false;
  }
}

async function toggleBreak() {
  if (!selectedId.value) return;
  // Allow break toggle whenever the user is in work context (clocked-in or currently on break)
  if (!isClockedInUi.value) {
    errorMsg.value = "You can only use Break when Clocked In";
    return;
  }
  const nowIso = new Date().toISOString();
  // Optimistic toggle & record for immediate UI feedback
  const next = !onBreak.value;
  const revert = () => {
    // Revert optimistic changes
    if (next) {
      // we had added a break-in at the head; remove it
      if (breakIns.value[0] === nowIso) breakIns.value.shift();
    } else {
      // we had added a break-out at the head; remove it
      if (breakOuts.value[0] === nowIso) breakOuts.value.shift();
    }
    onBreak.value = !next;
    saveBreakLocal();
  };
  if (next) {
    breakIns.value = [nowIso, ...breakIns.value];
  } else {
    breakOuts.value = [nowIso, ...breakOuts.value];
  }
  onBreak.value = next;
  saveBreakLocal();

  try {
    const res = await fetch(
      `${PHX_BASE}/api/clocks/${selectedId.value}?type=break`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ break: next }),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      errorMsg.value =
        text || "Break endpoint not implemented on API; kept local state";
    }
    successMsg.value = onBreak.value ? "Break started" : "Break ended";
  } catch (e: any) {
    revert();
    errorMsg.value = e?.message || "Break action failed";
  }
}

async function addWorkingTime() {
  if (!selectedId.value) return;
  if (!wtStart.value || !wtEnd.value) {
    errorMsg.value = "Please provide start and end";
    return;
  }
  if (durationHours(wtStart.value, wtEnd.value) > 8) {
    errorMsg.value = "Maximum allowed duration is 8 hours";
    return;
  }
  try {
    const res = await fetch(`${PHX_BASE}/api/workingtime/${selectedId.value}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        working_time: { start: wtStart.value, end: wtEnd.value },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to add working time");
    }
    wtStart.value = "";
    wtEnd.value = "";
    await loadWorkingTimes();
    successMsg.value = "Working time added";
  } catch (e: any) {
    errorMsg.value = e?.message || "Add working time failed";
  }
}

async function loadClocks() {
  if (!selectedId.value) return;
  clockLoading.value = true;
  try {
    const res = await fetch(`${PHX_BASE}/api/clocks/${selectedId.value}`);
    if (!res.ok) throw new Error("Failed to fetch clocks");
    const json = await res.json();
    const arr = (json.data || []) as Clock[];
    // normalize: ensure clocks are sorted by time ascending so our pairing is predictable
    clocks.value = arr
      .slice()
      .sort((a, b) => parseDt(a.time) - parseDt(b.time));
    // infer local work state if possible and session boundaries
    const lw = latestWork.value;
    if (lw && typeof lw.status === "boolean") {
      workIn.value = Boolean(lw.status);
      if (workIn.value) {
        // find latest clock-in time
        const lastIn = [...clocks.value]
          .filter((c) => !isBreakEvent(c) && c.status)
          .reduce(
            (acc, c) => (parseDt(c.time) > parseDt(acc?.time) ? c : acc),
            undefined as any
          );
        workStartIso.value = lastIn?.time || workStartIso.value;
        workEndIso.value = null;
      } else {
        // find latest clock-out time
        const lastOut = [...clocks.value]
          .filter((c) => !isBreakEvent(c) && !c.status)
          .reduce(
            (acc, c) => (parseDt(c.time) > parseDt(acc?.time) ? c : acc),
            undefined as any
          );
        workEndIso.value = lastOut?.time || workEndIso.value;
      }
    }
    // Optional: infer break state from API if provided. For now, keep local.
  } catch (e: any) {
    errorMsg.value = e?.message || "Unable to load clocks";
  } finally {
    clockLoading.value = false;
  }
}

async function toggleClock() {
  if (!selectedId.value) return;
  // Prevent clocking out while on break
  if (isClockedIn.value && onBreak.value) {
    errorMsg.value = "Break Out first, then Clock Out";
    return;
  }
  try {
    const res = await fetch(`${PHX_BASE}/api/clocks/${selectedId.value}`, {
      method: "POST",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Clock action failed");
    }
    // Flip local clocked-in state and stamp session times
    const nowIso = new Date().toISOString();
    if (!workIn.value) {
      // going to clock in
      workStartIso.value = nowIso;
      workEndIso.value = null;
      workIn.value = true;
    } else {
      // going to clock out
      workEndIso.value = nowIso;
      workIn.value = false;
      // Persist completed session to history
      const afterStart = (t?: string) =>
        !!(
          t &&
          workStartIso.value &&
          parseDt(t) >= parseDt(workStartIso.value)
        );
      const binsAll = breakIns.value.filter((t) => afterStart(t));
      const boutsAll = breakOuts.value.filter((t) => afterStart(t));
      const completed: SessionRow = {
        in: workStartIso.value || undefined,
        out: workEndIso.value || undefined,
        breakIn: lastDefined(binsAll),
        breakOut: lastDefined(boutsAll),
      };
      sessionHistory.value = [completed, ...sessionHistory.value];
      saveSessionHistory();
      // Reset current session fields to show an empty row for the next session
      workStartIso.value = null;
      workEndIso.value = null;
      onBreak.value = false;
      breakIns.value = [];
      breakOuts.value = [];
      saveBreakLocal();
      // Also clear planned Working Time inputs so the live clock target resets
      wtStart.value = "";
      wtEnd.value = "";
      selectedWTId.value = null;
    }
    await loadClocks();
    // If we just clocked out, ensure break reset
    if (!workIn.value) {
      onBreak.value = false;
      saveBreakLocal();
    }
    successMsg.value = workIn.value ? "Clocked in" : "Clocked out";
  } catch (e: any) {
    errorMsg.value = e?.message || "Clock failed";
  }
}

watch(selectedId, async (id) => {
  if (id) {
    await Promise.all([loadWorkingTimes(), loadClocks()]);
    loadBreakLocal(id);
    loadSessionHistory(id);
  }
});

function openDelete(u: User) {
  errorMsg.value = "";
  successMsg.value = "";
  deleteId.value = u.id;
  deleteName.value = u.username || u.email;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (deleteId.value == null) return;
  try {
    const res = await fetch(`${PHX_BASE}/api/users/${deleteId.value}`, {
      method: "DELETE",
    });
    if (!(res.status === 204 || res.ok)) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Delete failed");
    }
    if (selectedId.value === deleteId.value) selectedId.value = null;
    successMsg.value = "User deleted";
    showDeleteModal.value = false;
    deleteId.value = null;
    await loadUsers(query.value.trim());
  } catch (e: any) {
    errorMsg.value = e?.message || "Delete failed";
  }
}

function cancelDelete() {
  showDeleteModal.value = false;
  deleteId.value = null;
}
function editUser(u: User) {
  errorMsg.value = "";
  successMsg.value = "";
  editId.value = u.id;
  editName.value = u.username;
  editEmail.value = u.email;
  showEditModal.value = true;
}

function cancelEdit() {
  showEditModal.value = false;
  editId.value = null;
}

function selectUser(id: number) {
  selectedId.value = id;
  showUserDetail.value = true;
}
function onLogin() {
  alert("Login clicked");
}

function backToList() {
  showUserDetail.value = false;
}

import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";

// Use Vite dev proxy for API calls in development (configured in vite.config.ts)
const PHX_BASE = "";

type User = { id: number; username: string; email: string };

const users = ref<User[]>([]);
const loading = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// Search
const query = ref("");
let debounceTimer: any;
function debounce(fn: (...args: any[]) => void, ms: number) {
  return (...args: any[]) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fn(...args), ms);
  };
}
const onSearch = debounce(async () => {
  await loadUsers(query.value.trim());
}, 250);

// Create form
const username = ref("");
const email = ref("");

// Edit modal state
const showEditModal = ref(false);
const editId = ref<number | null>(null);
const editName = ref("");
const editEmail = ref("");

// Delete modal state
const showDeleteModal = ref(false);
const deleteId = ref<number | null>(null);
const deleteName = ref("");

// Prevent page scroll when modal is open and handle ESC to close
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && showEditModal.value) {
    cancelEdit();
  }
}

watch(showEditModal, (open) => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = open ? "hidden" : "";
  }
});

function initialsOf(nameOrEmail: string): string {
  const t = String(nameOrEmail || "").trim();
  if (!t) return "ZZZ";
  const parts = t.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return t.slice(0, 2).toUpperCase();
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  const a = (parts[0] ?? "").charAt(0);
  const b = (parts[1] ?? "").charAt(0);
  return (a + b).toUpperCase();
}

const sortedUsers = computed<User[]>(() => {
  return [...users.value].sort((a, b) => {
    const ai = initialsOf(a.username || a.email);
    const bi = initialsOf(b.username || b.email);
    return ai.localeCompare(bi);
  });
});

const selectedUser = computed<User | undefined>(() => {
  return (
    sortedUsers.value.find((u) => u.id === selectedId.value) ||
    users.value.find((u) => u.id === selectedId.value)
  );
});

const selectedInitials = computed<string>(() => {
  const u = selectedUser.value;
  return initialsOf((u?.username || u?.email) ?? "");
});

function isBreakEvent(c: Clock): boolean {
  return c.type === "break" || typeof c.break === "boolean";
}

function parseDt(s?: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

const latestWork = computed<Clock | undefined>(() => {
  // consider only WORK events (non-break) and pick the latest by time
  const workEvents = clocks.value.filter((c) => !isBreakEvent(c));
  if (!workEvents.length) return undefined;
  return workEvents.reduce((a, b) =>
    parseDt(a.time) >= parseDt(b.time) ? a : b
  );
});

const isClockedIn = computed<boolean>(() => {
  return workIn.value;
});

// UI perspective: while onBreak, we still treat the user as clocked-in (work paused)
const isClockedInUi = computed<boolean>(() => {
  return isClockedIn.value || onBreak.value;
});

function fmt(dt: string | undefined): string {
  if (!dt) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dt));
  } catch {
    return dt;
  }
}

function fmtDate(dt: string | undefined): string {
  if (!dt) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(dt));
  } catch {
    return dt;
  }
}

function fmtTime(dt: string | undefined): string {
  if (!dt) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(dt));
  } catch {
    return dt;
  }
}

type ClockRow = {
  in?: string;
  out?: string;
  breakIn?: string;
  breakOut?: string;
};
const clockRows = computed<ClockRow[]>(() => {
  const ins: string[] = [];
  const outs: string[] = [];
  // derive work ins/outs from clocks
  for (const c of clocks.value) {
    if (isBreakEvent(c)) continue;
    if (c.status) ins.push(c.time);
    else outs.push(c.time);
  }
  // break columns come from local persisted events to ensure visibility even if API doesn't send them
  const bins = breakIns.value.slice();
  const bouts = breakOuts.value.slice();
  const n = Math.max(ins.length, outs.length, bins.length, bouts.length);
  const rows: ClockRow[] = [];
  for (let i = 0; i < n; i++) {
    rows.push({
      in: ins[i],
      out: outs[i],
      breakIn: bins[i],
      breakOut: bouts[i],
    });
  }
  return rows;
});

function lastDefined<T>(arr: (T | undefined)[]): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

const currentRow = computed<ClockRow>(() => {
  // Use the current session boundaries for accuracy
  const inTime = workStartIso.value || undefined;
  const outTime = workEndIso.value || undefined;
  // Only consider break events that happened after the current session start
  const afterStart = (t?: string) =>
    !!(t && workStartIso.value && parseDt(t) >= parseDt(workStartIso.value));
  const binsAll = breakIns.value.filter((t) => afterStart(t));
  const boutsAll = breakOuts.value.filter((t) => afterStart(t));
  return {
    in: inTime,
    out: outTime,
    breakIn: lastDefined(binsAll),
    breakOut: lastDefined(boutsAll),
  };
});

// Target, elapsed and remaining time for the live clock
const targetDurationMs = computed<number>(() => {
  // Prefer selected working time inputs; otherwise derive from latest selected WT
  if (wtStart.value && wtEnd.value) {
    const a = parseDt(wtStart.value);
    const b = parseDt(wtEnd.value);
    if (a && b && b > a) return b - a;
  }
  // fallback to current session if both known
  if (workStartIso.value && workEndIso.value) {
    const a = parseDt(workStartIso.value);
    const b = parseDt(workEndIso.value);
    if (a && b && b > a) return b - a;
  }
  return 0;
});

const breakConsumedMs = computed<number>(() => {
  if (!workStartIso.value) return 0;
  const start = parseDt(workStartIso.value);
  if (!start) return 0;
  // Pair break ins/outs within the session
  const bins = breakIns.value.filter((t) => parseDt(t) >= start);
  const bouts = breakOuts.value.filter((t) => parseDt(t) >= start);
  let total = 0;
  const n = Math.max(bins.length, bouts.length);
  for (let i = 0; i < n; i++) {
    const bi = parseDt(bins[i]);
    const bo = parseDt(bouts[i]);
    if (bi && bo) total += Math.max(0, bo - bi);
  }
  // If currently on break, add ongoing break time
  if (onBreak.value) {
    const lastBi = parseDt(bins[bins.length - 1]);
    if (lastBi) total += Math.max(0, nowTs.value - lastBi);
  }
  return total;
});

const elapsedMs = computed<number>(() => {
  if (!workStartIso.value) return 0;
  const start = parseDt(workStartIso.value);
  if (!start) return 0;
  const endTs = workEndIso.value ? parseDt(workEndIso.value) : nowTs.value;
  if (!endTs) return 0;
  return Math.max(0, endTs - start - breakConsumedMs.value);
});

const remainingMs = computed<number>(() => {
  if (!targetDurationMs.value) return 0;
  return Math.max(0, targetDurationMs.value - elapsedMs.value);
});

// Current ongoing break duration (only counts when onBreak)
const currentBreakMs = computed<number>(() => {
  if (!workStartIso.value) return 0;
  const start = parseDt(workStartIso.value);
  if (!start) return 0;
  const bins = breakIns.value.filter((t) => parseDt(t) >= start);
  const bouts = breakOuts.value.filter((t) => parseDt(t) >= start);
  if (onBreak.value && bins.length > bouts.length) {
    const lastBi = parseDt(bins[bins.length - 1]);
    if (lastBi) return Math.max(0, nowTs.value - lastBi);
  }
  return 0;
});

const dailyLogs = computed(() => {
  // Map persisted sessions to a display-ready structure sorted by latest first
  const arr = (sessionHistory.value || []).slice().sort((a, b) => {
    return parseDt(b.in) - parseDt(a.in);
  });
  return arr.map((s) => ({
    date: fmtDate(s.in || s.out),
    in: fmt(s.in),
    out: fmt(s.out),
    breakIn: fmt(s.breakIn),
    breakOut: fmt(s.breakOut),
  }));
});

// Pagination state and logic
const currentPage = ref(1);
const pageSize = ref(8);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return sortedUsers.value.slice(start, end);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedUsers.value.length / pageSize.value))
);

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}

// Reset to first page on search/filter change
watch([sortedUsers, pageSize], () => {
  currentPage.value = 1;
});

async function loadUsers(q: string) {
  loading.value = true;
  errorMsg.value = "";
  try {
    const params = new URLSearchParams();
    if (q) {
      params.set("username", q);
      params.set("email", q);
    }
    const url = `${PHX_BASE}/api/users${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch users");
    const json = await res.json();
    users.value = json.data || [];
  } catch (e: any) {
    errorMsg.value = e?.message || "Unable to load users";
    users.value = [];
  } finally {
    loading.value = false;
  }
}

function isValidEmail(email: string): boolean {
  // Simple RFC 5322 compliant regex for most cases
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function createUser() {
  successMsg.value = "";
  errorMsg.value = "";
  const u = username.value.trim();
  const m = email.value.trim();
  if (!u || !m) {
    errorMsg.value = "Please fill username and email";
    return;
  }
  if (!isValidEmail(m)) {
    errorMsg.value = "Please enter a valid email address";
    return;
  }
  try {
    const res = await fetch(`${PHX_BASE}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { username: u, email: m } }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create user");
    }
    successMsg.value = "User created successfully";
    username.value = "";
    email.value = "";
    await loadUsers(query.value.trim());
  } catch (e: any) {
    errorMsg.value = e?.message || "Create failed";
  }
}

// Modal state for create user
const showCreateModal = ref(false);
function openCreateModal() {
  showCreateModal.value = true;
}
function closeCreateModal() {
  showCreateModal.value = false;
  // Optionally clear fields
  username.value = "";
  email.value = "";
}

const createModalError = ref("");
const editModalError = ref("");

// Override handleCreateUser for modal validation
async function handleCreateUser() {
  createModalError.value = "";
  if (!username.value.trim() || !email.value.trim()) {
    createModalError.value = "Please fill username and email";
    return;
  }
  if (!isValidEmail(email.value.trim())) {
    createModalError.value = "Please enter a valid email address";
    return;
  }
  await createUser();
  if (!errorMsg.value && !createModalError.value) {
    closeCreateModal();
  }
}

// Override saveEdit for modal validation
async function saveEdit() {
  editModalError.value = "";
  if (!editName.value.trim() || !editEmail.value.trim()) {
    editModalError.value = "Please fill username and email";
    return;
  }
  if (!isValidEmail(editEmail.value.trim())) {
    editModalError.value = "Please enter a valid email address";
    return;
  }
  if (editId.value == null) return;
  const newName = editName.value.trim();
  const newEmail = editEmail.value.trim();
  try {
    const res = await fetch(`${PHX_BASE}/api/users/${editId.value}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { username: newName, email: newEmail } }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Update failed");
    }
    successMsg.value = "User updated";
    showEditModal.value = false;
    editId.value = null;
    await loadUsers(query.value.trim());
  } catch (e: any) {
    editModalError.value = e?.message || "Update failed";
  }
}

// Clear modal errors when modals are closed
watch(showCreateModal, (open) => {
  if (!open) createModalError.value = "";
});
watch(showEditModal, (open) => {
  if (!open) editModalError.value = "";
});

onMounted(() => {
  loadUsers("");
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", onKeydown);
  }
  // start ticker
  tickId = setInterval(() => {
    nowTs.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeydown);
  }
  if (tickId) clearInterval(tickId);
});
</script>

<template>
  <header class="nav" :class="{ detail: showUserDetail }">
    <div class="nav-left">
      <div class="brand" aria-label="Time Manager brand">
        <img
          src="/bat-icon.png"
          alt="Bat Icon"
          style="
            height: 24px;
            width: 24px;
            vertical-align: middle;
            margin-right: 8px;
          "
        />
        Arkham Time
      </div>
    </div>

    <!-- Working Time Delete Modal -->
    <div
      v-if="showWtDeleteModal"
      class="modal-overlay"
      @click.self="cancelWtDelete"
    >
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wtDeleteTitle"
      >
        <div class="modal-header">
          <h3 id="wtDeleteTitle">Delete Working Time</h3>
          <button class="btn small ghost" @click="cancelWtDelete">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this entry?</p>
          <p class="muted">{{ wtDeleteLabel }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn small ghost" @click="cancelWtDelete">
            Cancel
          </button>
          <button class="btn small danger" @click="confirmWtDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
    <div class="nav-center" v-if="showUserDetail">
      <div
        class="user-chip"
        :title="selectedUser?.username || selectedUser?.email || ''"
      >
        <div class="avatar-circle">{{ selectedInitials }}</div>
        <div class="user-name">
          {{ selectedUser?.username || selectedUser?.email }}
        </div>
      </div>
    </div>
    <div class="nav-center" v-else></div>

    <!-- <div class="nav-right actions">
      <button class="btn ghost" @click="onSignUp">Sign Up</button>
      <button class="btn primary" @click="onLogin">Login</button>
    </div> -->
  </header>
  <div v-if="showUserDetail" class="subbar">
    <button class="btn primary small ghost" @click="backToList">Back</button>
  </div>

  <!-- Create User Button OUTSIDE the users panel -->
  <div
    v-if="!showUserDetail"
    style="
      max-width: 1704px;
      margin: 10px 22px 0 auto;
      display: flex;
      justify-content: flex-end;
    "
  >
    <button class="btn primary" @click="openCreateModal">+ Create User</button>
  </div>

  <!-- Create User Modal -->
  <div
    v-if="showCreateModal"
    class="modal-overlay"
    @click.self="closeCreateModal"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="createUserTitle"
    >
      <div class="modal-header">
        <h3 id="createUserTitle">Create User</h3>
        <button class="btn small ghost" @click="closeCreateModal">✕</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="username">Full Name</label>
          <input
            id="username"
            v-model="username"
            class="input"
            placeholder="e.g., John Doe"
          />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            class="input"
            type="email"
            placeholder="e.g., john@example.com"
          />
        </div>
        <div
          v-if="createModalError"
          class="alert error"
          style="margin-bottom: 0"
        >
          {{ createModalError }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn small ghost" @click="closeCreateModal">
          Cancel
        </button>
        <button class="btn small primary" @click="handleCreateUser">
          Create
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Modal -->
  <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deleteTitle"
    >
      <div class="modal-header">
        <h3 id="deleteTitle">Delete User</h3>
        <button class="btn small ghost" @click="cancelDelete">✕</button>
      </div>
      <div class="modal-body">
        <p>
          Are you sure you want to delete <strong>{{ deleteName }}</strong
          >? This action cannot be undone.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn small ghost" @click="cancelDelete">Cancel</button>
        <button class="btn small danger" @click="confirmDelete">Delete</button>
      </div>
    </div>
  </div>

  <!-- Working Time Edit Modal -->
  <div v-if="showWtEditModal" class="modal-overlay" @click.self="cancelWtEdit">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wtEditTitle"
    >
      <div class="modal-header">
        <h3 id="wtEditTitle">Edit Working Time</h3>
        <button class="btn small ghost" @click="cancelWtEdit">✕</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="wtEditStart">Start</label>
          <input
            id="wtEditStart"
            v-model="wtEditStart"
            class="input"
            type="datetime-local"
          />
        </div>
        <div class="field">
          <label for="wtEditEnd">End</label>
          <input
            id="wtEditEnd"
            v-model="wtEditEnd"
            class="input"
            type="datetime-local"
          />
        </div>
        <div class="muted" style="font-size: 13px">
          Max duration allowed is 8 hours.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn small ghost" @click="cancelWtEdit">Cancel</button>
        <button class="btn small primary" @click="saveWtEdit">Save</button>
      </div>
    </div>
  </div>

  <main v-if="!showUserDetail" class="content">
    <section class="page">
      <div class="layout">
        <div class="left">
          <div class="panel">
            <!-- Compact header: Users + search input in a row -->
            <div class="panel-top users-header">
              <h2>Users</h2>
              <input
                class="input input-search"
                v-model="query"
                @input="onSearch"
                placeholder="Search by name or email"
              />
            </div>

            <div v-if="errorMsg" class="alert error">{{ errorMsg }}</div>
            <div v-if="successMsg" class="alert success">{{ successMsg }}</div>

            <div class="table-wrap">
              <table class="table" aria-label="Users table">
                <thead>
                  <tr>
                    <th style="width: 80px">No.</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th style="width: 220px">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="4">Loading…</td>
                  </tr>
                  <tr v-else-if="!paginatedUsers.length">
                    <td colspan="4">No users found</td>
                  </tr>
                  <tr
                    v-for="(u, idx) in paginatedUsers"
                    :key="u.id"
                    :class="{ 'row-selected': selectedId === u.id }"
                  >
                    <td class="muted">
                      {{ (currentPage - 1) * pageSize + idx + 1 }}
                    </td>
                    <td>{{ u.username }}</td>
                    <td class="muted email">{{ u.email }}</td>
                    <td class="actions-cell">
                      <button class="btn small warn" @click="editUser(u)">
                        Edit
                      </button>
                      <button class="btn small danger" @click="openDelete(u)">
                        Delete
                      </button>
                      <button class="btn small info" @click="selectUser(u.id)">
                        Select
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination Controls -->
            <div class="pagination" v-if="totalPages > 1">
              <button
                class="btn small ghost"
                :disabled="currentPage === 1"
                @click="prevPage"
              >
                Prev
              </button>
              <span>Page {{ currentPage }} of {{ totalPages }}</span>
              <button
                class="btn small ghost"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                Next
              </button>
            </div>
            <div style="display: none">{{ clockRows.length }}</div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <main v-else class="content">
    <!-- Detail page containers -->
    <section class="page">
      <!-- Make Working Time full width -->
      <div class="panel full-width">
        <div class="panel-top">
          <h2>Working Time</h2>
        </div>
        <div class="field-row">
          <div class="field grow">
            <label for="wtStart">Start</label>
            <input
              id="wtStart"
              v-model="wtStart"
              class="input"
              type="datetime-local"
            />
          </div>
          <div class="field grow">
            <label for="wtEnd">End</label>
            <input
              id="wtEnd"
              v-model="wtEnd"
              class="input"
              type="datetime-local"
            />
          </div>
          <div class="field actions-inline">
            <label>&nbsp;</label>
            <button class="btn primary" @click="addWorkingTime">Add</button>
          </div>
        </div>
        <div class="row-buttons" style="margin-bottom: 10px">
          <button class="btn small ghost preset" @click="setHalfTime">
            Half time
          </button>
          <button class="btn small ghost preset" @click="setFullTime">
            Full time
          </button>
          <button class="btn small ghost preset" @click="addExtraMinutes(30)">
            Add +30 min
          </button>
          <button class="btn small ghost preset" @click="addExtraMinutes(60)">
            Add +1 hr
          </button>
        </div>
        <div class="table-wrap">
          <table class="table" aria-label="Working times table">
            <thead>
              <tr>
                <th style="width: 80px">No.</th>
                <th>Start Date</th>
                <th>Start Time</th>
                <th>End Date</th>
                <th>End Time</th>
                <th style="width: 220px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="wtLoading">
                <td colspan="6">Loading…</td>
              </tr>
              <tr v-else-if="!workingTimes.length">
                <td colspan="6">No entries</td>
              </tr>
              <tr v-for="(wt, i) in workingTimes" :key="wt.id">
                <td class="muted">{{ i + 1 }}</td>
                <td>{{ fmtDate(wt.start) }}</td>
                <td>{{ fmtTime(wt.start) }}</td>
                <td>{{ fmtDate(wt.end) }}</td>
                <td>{{ fmtTime(wt.end) }}</td>
                <td class="actions-cell">
                  <button
                    class="btn small ghost"
                    @click="selectWorkingTime(wt)"
                  >
                    Select
                  </button>
                  <button class="btn small warn" @click="openWtEdit(wt)">
                    Edit
                  </button>
                  <button class="btn small danger" @click="openWtDelete(wt)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Clocking section full width and below -->
      <div class="panel full-width" style="margin-top: 24px">
        <div class="panel-top">
          <h2>Clocking</h2>
        </div>
        <div class="stack-vert">
          <div class="status-row">
            <div class="muted">
              Latest status:
              <strong>{{
                isClockedInUi
                  ? onBreak
                    ? "On Break"
                    : "Clocked-in"
                  : "Clocked-out"
              }}</strong>
            </div>
            <div
              style="
                display: flex;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;
              "
            >
              <div class="clock-box" aria-label="Daily time tracker">
                <div class="clock-line">
                  <span>Target</span
                  ><strong>{{ msToHMS(targetDurationMs) }}</strong>
                </div>
                <div class="clock-line">
                  <span>Elapsed</span><strong>{{ msToHMS(elapsedMs) }}</strong>
                </div>
                <div class="clock-line">
                  <span>Remaining</span
                  ><strong>{{ msToHMS(remainingMs) }}</strong>
                </div>
              </div>
              <div class="clock-box" aria-label="Break time tracker">
                <div class="clock-line">
                  <span>Break Total</span
                  ><strong>{{ msToHMS(breakConsumedMs) }}</strong>
                </div>
                <div class="clock-line">
                  <span>Current Break</span
                  ><strong>{{ msToHMS(currentBreakMs) }}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="row-buttons">
            <button
              class="btn small info"
              :class="{ disabled: isClockedInUi && onBreak }"
              :disabled="isClockedInUi && onBreak"
              @click="toggleClock"
            >
              {{ isClockedInUi ? "Clock Out" : "Clock In" }}
            </button>
            <button
              v-if="isClockedInUi"
              class="btn small warn"
              @click="toggleBreak"
            >
              {{ onBreak ? "Break Out" : "Break In" }}
            </button>
          </div>
          <!-- <div class="table-wrap scroll-y">
            <table class="table" aria-label="Clocks table">
              <thead>
                <tr>
                  <th style="width: 80px">No.</th>
                  <th>Clock In Date</th>
                  <th>Clock In Time</th>
                  <th>Clock Out Date</th>
                  <th>Clock Out Time</th>
                  <th>Break In Date</th>
                  <th>Break In Time</th>
                  <th>Break Out Date</th>
                  <th>Break Out Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="clockLoading">
                  <td colspan="9">Loading…</td>
                </tr>
                <tr
                  v-else-if="
                    !currentRow.in &&
                    !currentRow.out &&
                    !currentRow.breakIn &&
                    !currentRow.breakOut
                  "
                >
                  <td colspan="9">No data</td>
                </tr>
                <tr v-else>
                  <td class="muted">1</td>
                  <td>{{ fmtDate(currentRow.in) }}</td>
                  <td>{{ fmtTime(currentRow.in) }}</td>
                  <td>{{ fmtDate(currentRow.out) }}</td>
                  <td>{{ fmtTime(currentRow.out) }}</td>
                  <td>{{ fmtDate(currentRow.breakIn) }}</td>
                  <td>{{ fmtTime(currentRow.breakIn) }}</td>
                  <td>{{ fmtDate(currentRow.breakOut) }}</td>
                  <td>{{ fmtTime(currentRow.breakOut) }}</td>
                </tr>
              </tbody>
            </table>
          </div> -->

          <!-- Daily Logs (persisted sessions) -->
          <div class="panel-top" style="justify-content: center">
            <h3 style="margin: 0">Daily Logs</h3>
          </div>
          <div class="table-wrap scroll-y">
            <table class="table" aria-label="Daily logs table">
              <thead>
                <tr>
                  <th style="width: 80px">No.</th>
                  <th>Date</th>
                  <th>Check In Time</th>
                  <th>Check Out Time</th>
                  <th>Break In Time</th>
                  <th>Break Out Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!dailyLogs.length">
                  <td colspan="6">No logs yet</td>
                </tr>
                <tr v-for="(s, i) in dailyLogs" :key="i">
                  <td class="muted">{{ i + 1 }}</td>
                  <td>{{ s.date }}</td>
                  <td>{{ fmtTime(s.in) }}</td>
                  <td>{{ fmtTime(s.out) }}</td>
                  <td>{{ fmtTime(s.breakIn) }}</td>
                  <td>{{ fmtTime(s.breakOut) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </main>
  <!-- Edit Modal -->
  <div v-if="showEditModal" class="modal-overlay" @click.self="cancelEdit">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editTitle"
    >
      <div class="modal-header">
        <h3 id="editTitle">Edit {{ editName }}</h3>
        <button class="btn small ghost" @click="cancelEdit">✕</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="editName">Full Name</label>
          <input id="editName" v-model="editName" class="input" />
        </div>
        <div class="field">
          <label for="editEmail">Email</label>
          <input
            id="editEmail"
            v-model="editEmail"
            type="email"
            class="input"
          />
        </div>
        <div v-if="editModalError" class="alert error" style="margin-bottom: 0">
          {{ editModalError }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn small ghost" @click="cancelEdit">
          Cancel changes
        </button>
        <button class="btn small primary" @click="saveEdit">Done</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03);
}
.nav-left {
  justify-self: start;
}
.nav-center {
  justify-self: center;
  font-weight: 800;
}
.nav-right {
  justify-self: end;
}
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.brand {
  font-weight: 800;
  letter-spacing: 0.2px;
  color: var(--fg);
}

/* Username chip in detail mode */
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #0b1322;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04), 0 6px 24px rgba(0, 0, 0, 0.25);
}
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand), #22e3ff);
  color: #001018;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.2px;
}
.user-name {
  font-weight: 800;
  font-size: 1.05rem;
  max-width: 40vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subbar {
  padding: 8px 16px;
  background: var(--bg);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: #0f172a; /* dark surface */
  color: var(--fg);
  cursor: pointer;
  height: 36px;
  min-width: 100px;
  box-sizing: border-box;
  text-align: center;
  font-weight: 600;
  transition: background-color 0.15s ease, border-color 0.15s ease,
    transform 0.05s ease, box-shadow 0.15s ease, filter 0.15s ease;
}
.btn.small {
  height: 32px;
  min-width: 80px;
  padding: 0 10px;
  font-size: 0.9rem;
}
.btn.ghost {
  border-color: var(--border);
}
.btn.preset {
  min-width: 300px;
}
.btn.primary {
  background: var(--brand);
  color: #001018;
  border-color: rgba(6, 182, 212, 0.65);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 12px rgba(6, 182, 212, 0.25);
}
.btn.info {
  background: var(--brand);
  color: #001018;
  border-color: rgba(6, 182, 212, 0.65);
}
.btn.warn {
  background: #f59e0b;
  color: #111827;
  border-color: rgba(245, 158, 11, 0.6);
}
.btn.danger {
  background: #ef4444;
  color: #fff;
  border-color: rgba(239, 68, 68, 0.7);
}
.btn:hover {
  filter: brightness(0.97);
}
.btn.ghost:hover {
  background: rgba(34, 211, 238, 0.08);
}
.btn.primary:hover,
.btn.info:hover {
  filter: brightness(1.05);
}
.btn.warn:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
}
.btn.danger:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
}
.btn:active {
  transform: translateY(1px);
}
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.35);
}

.content {
  padding: 2px;
  background: var(--bg);
  color: var(--fg);
  min-height: calc(100vh - 60px);
}

/* Users page layout */
.page {
  max-width: 1704px;
  margin: 0 auto;
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@media (max-width: 1040px) {
  .page {
    grid-template-columns: 1fr;
  }
}

.detail-grid {
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}
@media (max-width: 1040px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.field-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.field-row .grow {
  flex: 1 1 220px;
  min-width: 0;
}
.actions-inline {
  display: flex;
}
.stack-vert {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* Prevent panel content from overflowing on small widths */
.panel,
.field,
.left,
.right {
  min-width: 0;
}

/* Make datetime inputs fully responsive */
input[type="datetime-local"] {
  width: 100%;
  box-sizing: border-box;
}

.panel {
  background: #0a0f1a;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.03);
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-height: 420px;
}
.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}
.panel h2 {
  margin: 0;
  font-size: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.field label {
  color: var(--muted);
  font-size: 14px;
}
.input {
  width: 95%;
  height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #0b1322;
  color: var(--fg);
  min-width: 0; /* allow shrinking inside flex */
}
.input::placeholder {
  color: #708099;
}
.input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.25);
}
.input-search {
  width: 100%;
  max-width: 360px;
  flex: 1 1 200px;
}

/* Create panel: reduce padding and make inputs and button full-width */
.right .panel {
  padding: 10px 10px 12px 10px;
}
.right .panel .field .input,
.right .panel .btn {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.alert {
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 14px;
}
.alert.error {
  background: #1f2937;
  color: #fecaca;
  border: 1px solid #991b1b;
}
.alert.success {
  background: #052f35;
  color: #bbf7d0;
  border: 1px solid #14532d;
}

.table-wrap {
  overflow: auto;
  border-radius: 10px;
  border: 1px solid var(--border);
  max-width: 100%;
}
.panel .table-wrap {
  flex: 1;
  min-height: 0;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  text-align: left;
  padding: 10px 12px;
}
.table thead th {
  background: #0d1728;
  color: #cbd5e1;
  font-size: 13px;
  letter-spacing: 0.3px;
}
.table tbody tr {
  border-top: 1px solid var(--border);
}
.table tbody tr:nth-child(2n) {
  background: #0a1322;
}
.table td.muted,
.muted {
  color: #9aa3af;
}
.table td.email {
  word-break: break-word;
}
.actions-cell {
  display: flex;
  gap: 8px;
  white-space: nowrap;
  align-items: center;
}

/* Make Create form elements wrap nicely on small screens */
@media (max-width: 640px) {
  .right .panel .btn {
    min-width: 0;
    width: 100%;
  }
}

/* Make specific tables scroll within a compact area */
.table-wrap.scroll-y {
  max-height: 260px;
  overflow: auto;
  flex: 1;
}
@media (max-width: 640px) {
  .table-wrap.scroll-y {
    max-height: 200px;
  }
}

/* Row buttons for clocking */
.row-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Status + clock row */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.clock-box {
  display: flex;
  gap: 16px;
  align-items: center;
  background: #0b1322;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 12px;
}
.clock-line {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.clock-line span {
  color: var(--muted);
  font-size: 13px;
}
.clock-line strong {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: 100%;
  max-width: 420px;
  background: #0a0f1a;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-body {
  padding: 14px 16px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

/* Simple fade/scale animation */
.modal-overlay {
  animation: overlayFade 0.15s ease;
}
.modal {
  animation: modalIn 0.18s ease;
}
@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Optional: fallback if system is light mode, soften contrasts slightly */
@media (prefers-color-scheme: light) {
  :root {
    /* Force dark palette even if system is light, but soften slightly */
    --bg: #030712;
    --fg: #edf1f5;
    --border: #202938;
    --muted: #a7b0bb;
    --brand: #22d3ee;
  }
}

.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.full-width {
  grid-column: 1 / -1 !important;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  margin-right: 0;
  box-sizing: border-box;
}
.page {
  max-width: 1704px;
  margin: 0 auto;
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}
@media (max-width: 1040px) {
  .page {
    grid-template-columns: 1fr;
  }
}

.users-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.users-header h2 {
  margin: 0;
  font-size: 18px;
  flex-shrink: 0;
}
.input-search {
  max-width: 320px;
  margin-bottom: 0 !important;
}
</style>

<!-- Global styles (not scoped) to enforce dark theme site-wide and visible fonts -->
<style>
:root {
  /* True dark theme tokens */
  --bg: #000000; /* pure black */
  --fg: #e5e7eb; /* light gray text */
  --muted: #9aa3af; /* muted text */
  --border: #1f2937; /* dark border */
  --brand: #06b6d4; /* brighter cyan primary */
}
html,
body,
#app {
  background: #000;
  color: #e5e7eb;
  min-height: 100%;
  overflow-x: hidden;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell,
    "Noto Sans", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  /* Fluid typography across devices */
  font-size: clamp(14px, 1.2vw, 18px);
  line-height: 1.6;
}
</style>
