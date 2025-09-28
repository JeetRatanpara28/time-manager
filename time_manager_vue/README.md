# Vue 3 + TypeScript + Vite

## Main Concept

This frontend is a Vue 3 single‑page app that talks to the Phoenix backend JSON API. `src/main.ts` boots the app and `src/router.ts` defines routes for listing users and viewing per‑user working times and clocks. The primary UI is implemented in `src/App.vue` and `src/views/Users.vue`, which fetch and render users, allow creating/updating/deleting users, and provide an inline dashboard to add/filter working times and toggle clock in/out. Data fetching uses the browser `fetch` API against `/api/*` endpoints, local component state is handled with Vue refs and computed properties, and UI timing features (e.g., live session timers and break tracking) are derived client‑side for responsive feedback.

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
