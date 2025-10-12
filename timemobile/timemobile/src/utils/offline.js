// src/store/offline.js
// Handles offline storage and queuing operations for sync
import db from "@/db/database.js";
import { isOnline } from "@/store/offlineStore.js";
import { enqueue } from "@/syncQueue.js";

/**
 * Save current user data in local database
 * @param {object} user
 */
export function saveCurrentUser(user) {
  if (!db || typeof db.users !== "function") return;
  const col = db.users();
  const existing = col.findOne({ id: user.id });
  if (existing) Object.assign(existing, user);
  else col.insert(user);
  db.db.saveDatabase();
}

/**
 * Clear current user data
 */
export function clearCurrentUser() {
  if (!db || typeof db.users !== "function") return;
  const col = db.users();
  col.clear();
  db.db.saveDatabase();
}

/**
 * Queue an operation for offline sync
 * @param {string} type - operation type (e.g., CREATE_TASK, UPDATE_USER)
 * @param {string} url - API endpoint
 * @param {string} method - HTTP method (POST, PUT, DELETE)
 * @param {object} data - request body
 */
export function queueOperation(type, url, method, data) {
  enqueue({ type, url, method, data });
}

/**
 * Initialize offline store (ensure collections exist)
 */
export async function initializeOfflineStore() {
  if (!db) return;
  if (!db.users()) db.addCollection("users", { unique: ["id"] });
  if (!db.pendingActions())
    db.addCollection("pendingActions", { indices: ["createdAt"] });
}

/**
 * Refresh local data from server (example)
 * @param {object[]} usersData
 */
export async function refreshDataFromServer(usersData = []) {
  if (!db || !isOnline.value) return;
  const col = db.users();
  col.clear();
  usersData.forEach((u) => col.insert(u));
  db.db.saveDatabase();
}

// Export reactive user reference if needed
export const currentUser = null;
