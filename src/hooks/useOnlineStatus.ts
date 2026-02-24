"use client";

import { useState, useEffect, useCallback } from "react";
import { processQueue, getQueueLength } from "@/lib/offline-queue";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
  );
  const [queueLength, setQueueLength] = useState(
    () => (typeof localStorage !== "undefined" ? getQueueLength() : 0),
  );

  const refreshQueueLength = useCallback(() => {
    setQueueLength(getQueueLength());
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-sync when back online
      const pending = getQueueLength();
      if (pending > 0) {
        await processQueue();
        refreshQueueLength();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Poll queue length periodically (catches enqueue from other code)
    const interval = setInterval(refreshQueueLength, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [refreshQueueLength]);

  return { isOnline, queueLength };
}
