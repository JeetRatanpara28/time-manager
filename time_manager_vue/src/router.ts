import { createRouter, createWebHistory } from 'vue-router'
import Users from './views/Users.vue'
import WorkingTime from './views/WorkingTime.vue'
import Clocks from './views/Clocks.vue'

const routes = [
  { path: '/', redirect: '/users' },
  { path: '/users', component: Users },
  // Single-page user dashboard route (Users.vue will open inline panels)
  { path: '/user/:userId', component: Users, props: true },
  { path: '/workingtime/:userId', component: WorkingTime, props: true },
  { path: '/clocks/:userId', component: Clocks, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router



