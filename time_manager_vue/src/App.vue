<script setup lang="ts">
import { ref } from 'vue'
const collapsed = ref(false)

function isFullscreen() {
  return !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
}

async function toggleBrowserFullscreen() {
  try {
    if (!isFullscreen()) {
      await document.documentElement.requestFullscreen?.()
    } else {
      await document.exitFullscreen?.()
    }
  } catch (_) {
    // no-op
  }
}
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand">Time Manager</div>
      <nav class="topnav">
        <button class="iconbtn" @click="toggleBrowserFullscreen" title="Enter/Exit fullscreen">⛶</button>
        <button class="iconbtn" @click="collapsed = !collapsed" :title="collapsed ? 'Show sidebar' : 'Hide sidebar'">☰</button>
        <router-link to="/users">Users</router-link>
      </nav>
    </header>
    <div class="content no-sidebar">
      <main class="main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout { display:flex; flex-direction:column; min-height:100vh; background:#f6f7fb; }
.topbar { height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 16px; background:#fff; border-bottom:1px solid #e9e9ef; position:sticky; top:0; z-index:10; }
.brand { font-weight:700; letter-spacing:.2px; }
.topnav a { margin-left:12px; color:#444; text-decoration:none; }
.topnav a.router-link-active { font-weight:600; }
.content { display:flex; flex:1; }
.content.no-sidebar { margin-left:0; }
.sidebar { width:220px; background:#fff; border-right:1px solid #e9e9ef; padding:16px; }
.section { font-size:12px; font-weight:700; text-transform:uppercase; color:#888; margin-bottom:8px; }
.nav-link { display:block; padding:8px 10px; border-radius:8px; color:#333; text-decoration:none; }
.nav-link.router-link-active { background:#eef2ff; color:#1f3fd1; font-weight:600; }
.divider { height:1px; background:#eee; margin:12px 0; }
.muted { color:#777; }
.small { font-size:12px; }
.main { flex:1; padding:20px; }
.iconbtn { border:1px solid #c8c8d4; background:#fff; border-radius:8px; padding:6px 10px; cursor:pointer; margin-right:8px; }
.iconbtn:hover { background:#f6f6f9; }
</style>
