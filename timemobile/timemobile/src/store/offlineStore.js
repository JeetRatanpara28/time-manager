// src/store/offlineStore.js
import { ref } from "vue";

// Network state
export const isOnline = ref(navigator.onLine);
export const isSyncing = ref(false);

// Pending operations queue
const pendingOperations = ref([]);

/**
 * Update online status
 */
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    isOnline.value = true;
  });

  window.addEventListener("offline", () => {
    isOnline.value = false;
  });
}

/**
 * Add operation to pending queue
 */
export const addPendingOperation = (operation) => {
  pendingOperations.value.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...operation,
  });
  savePendingOperations();
};

/**
 * Save pending operations to localStorage
 */
const savePendingOperations = () => {
  localStorage.setItem(
    "pendingOperations",
    JSON.stringify(pendingOperations.value)
  );
};

/**
 * Load pending operations from localStorage
 */
export const loadPendingOperations = () => {
  const saved = localStorage.getItem("pendingOperations");
  if (saved) {
    try {
      pendingOperations.value = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading pending operations:", e);
      pendingOperations.value = [];
    }
  }
};

/**
 * Sync pending operations with server
 */
export const syncPendingOperations = async () => {
  if (!isOnline.value || pendingOperations.value.length === 0) {
    return;
  }

  isSyncing.value = true;

  try {
    console.log("🔄 Syncing", pendingOperations.value.length, "operations...");

    // Process each pending operation
    const results = await Promise.allSettled(
      pendingOperations.value.map(async (op) => {
        // Execute the operation based on type
        // This is a placeholder - implement based on your needs
        console.log("Syncing operation:", op);
        return op;
      })
    );

    // Remove successfully synced operations
    const successfulOps = results
      .map((result, index) => (result.status === "fulfilled" ? index : null))
      .filter((i) => i !== null);

    pendingOperations.value = pendingOperations.value.filter(
      (_, index) => !successfulOps.includes(index)
    );

    savePendingOperations();
    console.log("✅ Sync complete");
  } catch (error) {
    console.error("❌ Sync failed:", error);
  } finally {
    isSyncing.value = false;
  }
};

/**
 * Clear all pending operations
 */
export const clearPendingOperations = () => {
  pendingOperations.value = [];
  savePendingOperations();
};

// Initialize on load
loadPendingOperations();
