<template>
  <div id="app">
    <router-view />
    <div v-if="isAuthenticated" class="tab-bar">
      <button
        v-for="tab in visibleTabs"
        :key="tab.name"
        :class="['tab-item', { active: currentRoute === tab.path }]"
        @click="navigateTo(tab.path)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { user as currentUser, isAuthenticated } from "@/store/authStore";

const router = useRouter();
const route = useRoute();

const currentRoute = computed(() => route.path);

const employeeTabs = [
  { name: "home", path: "/tasks", icon: "🏠", label: "Home" },
  { name: "clock", path: "/clock", icon: "⏰", label: "Clock" },
  { name: "profile", path: "/profile", icon: "👤", label: "Profile" },
];

const managerTabs = [
  { name: "home", path: "/tasks", icon: "🏠", label: "Home" },
  { name: "clock", path: "/clock", icon: "⏰", label: "Clock" },
  { name: "profile", path: "/profile", icon: "👤", label: "Profile" },
];

const gmTabs = [
  { name: "home", path: "/tasks", icon: "🏠", label: "Home" },
  { name: "users", path: "/manager/users", icon: "👥", label: "Users" },
  { name: "clock", path: "/clock", icon: "⏰", label: "Clock" },
  { name: "profile", path: "/profile", icon: "👤", label: "Profile" },
];

const visibleTabs = computed(() => {
  if (!currentUser.value) return [];
  const role = currentUser.value.role;

  if (role === "gm" || role === "general_manager") {
    return gmTabs;
  } else if (role === "manager") {
    return managerTabs;
  } else {
    return employeeTabs;
  }
});

function navigateTo(path) {
  router.push(path);
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: #f8fafc;
}

.tab-bar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding: 0.5rem 0;
}

.tab-item {
  flex: 1;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #64748b;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}

.tab-item:hover {
  background: #f8fafc;
  color: #667eea;
}

.tab-item.active {
  background: #f1f5f9;
  color: #667eea;
  font-weight: 600;
}
</style>
