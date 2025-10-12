// src/syncQueue.js
// FIFO queue to sync offline actions when online
import { isOnline } from "@/store/offlineStore.js";
import { post, put, del } from "@/utils/api.js";
import db from "@/db/database.js";

const QUEUE_COLLECTION = "pendingActions";

/**
 * Add an action to the offline queue
 * action: { method: 'POST'|'PUT'|'DELETE', url: string, data: object|null, meta?: {} }
 */
function enqueue(action) {
  try {
    if (!db || typeof db[QUEUE_COLLECTION] !== "function") return;
    const col = db[QUEUE_COLLECTION]();
    col.insert({ ...action, createdAt: new Date().toISOString() });
    db.db.saveDatabase();
  } catch (e) {
    console.warn("syncQueue.enqueue error", e);
  }
}

/**
 * Process the queue sequentially
 */
async function processQueue() {
  if (!isOnline.value) return;
  if (!db || typeof db[QUEUE_COLLECTION] !== "function") return;

  const col = db[QUEUE_COLLECTION]();
  const items = col
    .find({})
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  for (const item of items) {
    try {
      if (!item.method || !item.url) continue;

      switch (item.method.toUpperCase()) {
        case "POST":
          await post(item.url, item.data);
          break;
        case "PUT":
          await put(item.url, item.data);
          break;
        case "DELETE":
          await del(item.url, item.data);
          break;
        default:
          console.warn("syncQueue unknown method", item.method);
      }

      col.remove(item);
      db.db.saveDatabase();
    } catch (e) {
      console.warn("syncQueue.processQueue item failed, will retry later", e);
      // Stop processing further to avoid conflicts
      break;
    }
  }
}

/**
 * Auto start the queue on reconnect
 */
function startQueue() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    processQueue();
  });

  // Optionally, process immediately if online at start
  if (isOnline.value) processQueue();
}

export { enqueue, processQueue, startQueue };
