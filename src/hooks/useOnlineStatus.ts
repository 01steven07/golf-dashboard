"use client";

import { useSyncExternalStore, useEffect } from "react";
import { processQueue, getQueueLength } from "@/lib/offline-queue";

// --- Online status ---
// navigator.onLine is unreliable (returns false in some environments even when online).
// Start optimistically as "online" and only react to browser offline/online events.

let onlineState = true;

function subscribeOnline(callback: () => void) {
  const handleOnline = () => {
    onlineState = true;
    callback();
  };
  const handleOffline = () => {
    onlineState = false;
    callback();
  };
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

function getOnlineSnapshot() {
  return onlineState;
}

function getServerOnlineSnapshot() {
  return true;
}

// --- Queue length (localStorage polling) ---

function subscribeQueue(callback: () => void) {
  const interval = setInterval(callback, 3000);
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
    getServerOnlineSnapshot
  );

  const queueLength = useSyncExternalStore(
    subscribeQueue,
    getQueueSnapshot,
    getServerQueueSnapshot
  );

  // Auto-sync when back online
  useEffect(() => {
    if (isOnline && getQueueLength() > 0) {
      processQueue();
    }
  }, [isOnline]);

  return { isOnline, queueLength };
}
