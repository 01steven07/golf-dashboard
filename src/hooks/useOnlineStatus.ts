"use client";

import { useSyncExternalStore, useEffect } from "react";
import { processQueue, getQueueLength } from "@/lib/offline-queue";

// --- Online status (navigator.onLine) ---

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

// --- Queue length (localStorage polling) ---

function subscribeQueue(callback: () => void) {
  const interval = setInterval(callback, 3000);
  // Also refresh on online event (after sync completes)
  window.addEventListener("online", callback);
  return () => {
    clearInterval(interval);
    window.removeEventListener("online", callback);
  };
}

function getQueueSnapshot() {
  return getQueueLength();
}

function getServerQueueSnapshot() {
  return 0;
}

// --- Hook ---

export function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  const queueLength = useSyncExternalStore(
    subscribeQueue,
    getQueueSnapshot,
    getServerQueueSnapshot,
  );

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && getQueueLength() > 0) {
      processQueue();
    }
  }, [isOnline]);

  return { isOnline, queueLength };
}
