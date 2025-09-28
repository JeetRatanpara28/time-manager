<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

type WT = { id: string; start: string; end: string; user_id: string }
const route = useRoute()
const list = ref<WT[]>([])
function fmt(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}
const now = new Date()
const dayStart = new Date(now); dayStart.setHours(0,0,0,0)
const dayEnd = new Date(now); dayEnd.setHours(23,59,59,0)
const start = ref(fmt(dayStart))
const end = ref(fmt(dayEnd))
const formStart = ref(fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)))
const formEnd = ref(fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0)))
const missingUser = ref(false)

// UI-only toggle to hide items older than today (strictly show only today's items)
const hideOld = ref(true)
const todayStr = computed(() => {
  const t = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`
})
function datePart(s: string) {
  // Works for both "YYYY-MM-DD HH:mm:ss" and ISO "YYYY-MM-DDTHH:mm:ssZ"
  return (s || '').slice(0, 10)
}
const visibleList = computed(() => {
  if (!hideOld.value) return list.value
  const ts = todayStr.value
  return list.value.filter((w) => datePart(w.start) === ts)
})

// Custom add UI (dialog-like toggle)
const showCustom = ref(false)
const customStart = ref("") // HTML datetime-local value e.g. 2025-09-25T09:00
const customEnd = ref("")
function toDateTimeLocal(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
function openCustom() {
  const d1 = new Date(); d1.setHours(9,0,0,0)
  const d2 = new Date(); d2.setHours(17,0,0,0)
  customStart.value = toDateTimeLocal(d1)
  customEnd.value = toDateTimeLocal(d2)
  showCustom.value = true
}

// Filter previous data flow
const showFilter = ref(false)
const filterStart = ref("") // datetime-local
const filterEnd = ref("")
const showResults = ref(false)
const resultsList = ref<WT[]>([])
function openFilter() {
  const y1 = new Date(); y1.setDate(y1.getDate() - 1); y1.setHours(0,0,0,0)
  const y2 = new Date(); y2.setDate(y2.getDate() - 1); y2.setHours(23,59,59,0)
  filterStart.value = toDateTimeLocal(y1)
  filterEnd.value = toDateTimeLocal(y2)
  showFilter.value = true
}
function toQueryDateTime(dtl: string) {
  // Convert datetime-local to "YYYY-MM-DD HH:mm:ss" expected by list filter API
  if (!dtl) return ''
  const base = dtl.replace('T', ' ')
  return base.length === 16 ? `${base}:00` : base
}
async function applyFilter() {
  const userId = route.params.userId as string | undefined
  if (!userId || userId === 'undefined') { missingUser.value = true; return }
  if (!filterStart.value || !filterEnd.value) { alert('Please select start and end'); return }
  const qs = new URLSearchParams({ start: toQueryDateTime(filterStart.value), end: toQueryDateTime(filterEnd.value) })
  const res = await fetch(`/api/workingtime/${userId}?${qs.toString()}`)
  const json = await res.json()
  resultsList.value = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : [])
  showResults.value = true
}
function closeResults() { showResults.value = false }
function closeFilter() { showFilter.value = false }

async function fetchWT() {
  const userId = route.params.userId as string | undefined
  if (!userId || userId === 'undefined') { missingUser.value = true; return }
  const q = new URLSearchParams({ start: start.value, end: end.value })
  const res = await fetch(`/api/workingtime/${userId}?${q.toString()}`)
  const json = await res.json()
  list.value = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : [])
}

onMounted(fetchWT)

async function createWT() {
  const userId = route.params.userId as string | undefined
  if (!userId || userId === 'undefined') { missingUser.value = true; return }
  // Ecto :utc_datetime expects ISO8601. Convert "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm:ssZ".
  const startIso = formStart.value.replace(' ', 'T') + 'Z'
  const endIso = formEnd.value.replace(' ', 'T') + 'Z'
  // Validation: end must be after start
  const sDate = new Date(startIso)
  const eDate = new Date(endIso)
  if (!(sDate instanceof Date && !isNaN(sDate.getTime())) || !(eDate instanceof Date && !isNaN(eDate.getTime()))) {
    alert('Invalid start or end datetime format')
    return
  }
  if (eDate <= sDate) {
    alert('End time must be after start time')
    return
  }
  const resp = await fetch(`/api/workingtime/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } })
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    alert(`Failed to create working time (status ${resp.status}). ${txt}`)
    return
  }
  await fetchWT()
}

async function createCustomWT() {
  const userId = route.params.userId as string | undefined
  if (!userId || userId === 'undefined') { missingUser.value = true; return }
  if (!customStart.value || !customEnd.value) {
    alert('Please choose start and end')
    return
  }
  // datetime-local has no seconds nor timezone; append :00 and Z
  const startIso = customStart.value.length === 16 ? `${customStart.value}:00Z` : `${customStart.value}Z`
  const endIso = customEnd.value.length === 16 ? `${customEnd.value}:00Z` : `${customEnd.value}Z`
  // Validation: end must be after start
  const sDate = new Date(startIso)
  const eDate = new Date(endIso)
  if (!(sDate instanceof Date && !isNaN(sDate.getTime())) || !(eDate instanceof Date && !isNaN(eDate.getTime()))) {
    alert('Invalid start or end datetime')
    return
  }
  if (eDate <= sDate) {
    alert('End time must be after start time')
    return
  }
  const resp = await fetch(`/api/workingtime/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } })
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    alert(`Failed to create working time (status ${resp.status}). ${txt}`)
    return
  }
  showCustom.value = false
  await fetchWT()
}

// Quick presets
async function addPreset(hoursStart: number, hoursEnd: number) {
  const userId = route.params.userId as string | undefined
  if (!userId || userId === 'undefined') { missingUser.value = true; return }
  const d = new Date(); const s = new Date(d); const e = new Date(d)
  s.setHours(hoursStart,0,0,0)
  e.setHours(hoursEnd,0,0,0)
  const startIso = s.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const endIso = e.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const resp = await fetch(`/api/workingtime/${userId}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ working_time: { start: startIso, end: endIso } })
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    alert(`Failed to create working time (status ${resp.status}). ${txt}`)
    return
  }
  await fetchWT()
}

async function deleteWT(id: string) {
  const resp = await fetch(`/api/workingtime/${id}`, { method: 'DELETE' })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    alert(`Failed to delete working time (status ${resp.status}). ${txt}`)
    return
  }
  await fetchWT()
}
</script>
<template>
  <div style="padding:16px;">
    <h2>WorkingTime</h2>
    <div v-if="missingUser" style="color:#b00; margin-bottom:8px;">Missing or invalid user. Go back to Users and click a user's WorkingTime link.</div>
    <div style="display:flex; gap:8px; margin-bottom:8px;">
      <input v-model="start" placeholder="YYYY-MM-DD HH:mm:ss" />
      <input v-model="end" placeholder="YYYY-MM-DD HH:mm:ss" />
      <button @click="fetchWT">Filter</button>
    </div>
    <div class="row" style="margin-top:-4px;">
      <label><input type="checkbox" v-model="hideOld" /> Hide items older than today (UI only)</label>
    </div>
    <div class="row">
      <input v-model="formStart" placeholder="start (YYYY-MM-DD HH:mm:ss)" />
      <input v-model="formEnd" placeholder="end (YYYY-MM-DD HH:mm:ss)" />
      <button @click="createWT">Add</button>
      <button @click="openCustom">Add custom…</button>
    </div>
    <div class="row" style="margin-top:-4px;">
      <button @click="openFilter">Filter</button>
    </div>
    <div class="row" style="margin-top:4px;">
      <span>Quick presets:</span>
      <button @click="addPreset(9,17)">Today 09:00–17:00</button>
      <button @click="addPreset(13,17)">Today 13:00–17:00</button>
      <button @click="addPreset(new Date().getHours(), new Date().getHours()+1)">Now → +1h</button>
    </div>

    <div v-if="showCustom" class="modal">
      <div class="modal-body">
        <h3>Add custom working time</h3>
        <div class="row">
          <label style="min-width:80px;">Start</label>
          <input type="datetime-local" v-model="customStart" />
        </div>
        <div class="row">
          <label style="min-width:80px;">End</label>
          <input type="datetime-local" v-model="customEnd" />
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button @click="showCustom=false">Cancel</button>
          <button @click="createCustomWT">Create</button>
        </div>
      </div>
    </div>

    <!-- Filter modal (base) -->
    <div v-if="showFilter" class="modal filter" style="z-index:1000;">
      <div class="modal-body">
        <h3>Filter previous data</h3>
        <div class="row">
          <label style="min-width:80px;">Start</label>
          <input type="datetime-local" v-model="filterStart" />
        </div>
        <div class="row">
          <label style="min-width:80px;">End</label>
          <input type="datetime-local" v-model="filterEnd" />
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button @click="closeFilter">Close</button>
          <button @click="applyFilter">Apply</button>
        </div>
      </div>
    </div>

    <!-- Results modal stacked on top of filter modal -->
    <div v-if="showResults" class="modal results" style="z-index:1100;">
      <div class="modal-body">
        <h3>Filtered results</h3>
        <div style="max-height:50vh; overflow:auto;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Start</th>
                <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">End</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in resultsList" :key="r.id">
                <td style="border-bottom:1px solid #eee; padding:6px;">{{ r.start }}</td>
                <td style="border-bottom:1px solid #eee; padding:6px;">{{ r.end }}</td>
              </tr>
              <tr v-if="resultsList.length===0">
                <td colspan="2" style="padding:10px; color:#666;">No data in this range</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="row" style="justify-content:flex-end;">
          <button @click="closeResults">Close</button>
        </div>
      </div>
    </div>
    <ul>
      <li v-for="w in visibleList" :key="w.id" class="row">
        <span>{{w.start}} - {{w.end}}</span>
        <button @click="deleteWT(w.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
input { padding:6px 8px; border:1px solid #ccc; border-radius:6px; }
button { padding:6px 10px; border:1px solid #999; background:#fff; border-radius:6px; cursor:pointer; }
button:hover { background:#f6f6f6; }
.modal { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
.modal-body { background:#fff; border-radius:8px; padding:16px; min-width:320px; box-shadow:0 10px 24px rgba(0,0,0,0.2); }
</style>


