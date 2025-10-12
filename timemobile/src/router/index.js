import { createRouter, createWebHistory } from "vue-router";
const AuthLogin = () => import("@/components/auth/Login.vue");
const AuthRegister = () => import("@/components/auth/Register.vue");
const TasksList = () => import("@/components/common/TasksList.vue");
const TaskDetail = () => import("@/components/common/TaskDetail.vue");
const Profile = () => import("@/components/common/Profile.vue");
const UserManagement = () => import("@/components/manager/UserManagement.vue");
const UserDetail = () => import("@/components/manager/UserDetail.vue");
const SkillsManagement = () =>
  import("@/components/manager/SkillsManagement.vue");
const ClockControl = () => import("@/components/employee/ClockControl.vue");
import { isAuthenticated, userRole } from "@/store/authStore";

const routes = [
  { path: "/login", name: "Login", component: AuthLogin },
  {
    path: "/register",
    name: "Register",
    component: AuthRegister,
    meta: { requiresAuth: true },
  },
  { path: "/", redirect: "/tasks" },
  {
    path: "/tasks",
    name: "TasksList",
    component: TasksList,
    meta: { requiresAuth: true },
  },
  {
    path: "/workingtime/:id",
    name: "TaskDetail",
    component: TaskDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/clock",
    name: "ClockControl",
    component: ClockControl,
    meta: {
      requiresAuth: true,
      roles: ["employee", "manager", "gm", "general_manager"],
    },
  },
  {
    path: "/manager/users",
    name: "UserManagement",
    component: UserManagement,
    meta: { requiresAuth: true, roles: ["manager", "gm", "general_manager"] },
  },
  {
    path: "/user/:id",
    name: "UserDetail",
    component: UserDetail,
    meta: { requiresAuth: true, roles: ["manager", "gm", "general_manager"] },
  },
  {
    path: "/manager/skills",
    name: "SkillsManagement",
    component: SkillsManagement,
    meta: { requiresAuth: true, roles: ["manager", "gm", "general_manager"] },
  },
  { path: "/:catchAll(.*)", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next("/login");
  }

  if (to.meta.roles) {
    const role = userRole.value;
    // Normalize role: treat general_manager as gm
    const normalizedRole = role === "general_manager" ? "gm" : role;
    if (!normalizedRole || !to.meta.roles.includes(normalizedRole)) {
      return next("/tasks");
    }
  }

  next();
});

export default router;
