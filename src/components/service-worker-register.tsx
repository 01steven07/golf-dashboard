"use client";

import { useEffect } from "react";

const CACHE_NAME = "golf-dashboard-v2";

/** SW有効化後に現在のページと読み込み済みリソースをキャッシュに保存 */
async function warmCache() {
  // ページ読み込み完了を待つ
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const cache = await caches.open(CACHE_NAME);

  // 1. 現在のページHTMLをキャッシュ
  try {
    const res = await fetch(window.location.pathname);
    if (res.ok) {
      await cache.put(window.location.pathname, res);
    }
  } catch {
    /* ignore */
  }

  // 2. 読み込み済みの同一オリジンリソース（JSチャンク等）をキャッシュ
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  for (const entry of resources) {
    try {
      const url = new URL(entry.name);
      if (url.origin !== window.location.origin) continue;
      if (url.pathname.startsWith("/api/")) continue;

      const existing = await cache.match(url.pathname);
      if (existing) continue;

      const res = await fetch(entry.name);
      if (res.ok) {
        await cache.put(entry.name, res);
      }
    } catch {
      /* ignore */
    }
  }

  // 3. スコア入力ページをバックグラウンドでプリキャッシュ
  const pages = ["/input", "/input/detailed"];
  for (const page of pages) {
    try {
      const existing = await cache.match(page);
      if (existing) continue;
      const res = await fetch(page);
      if (res.ok) {
        await cache.put(page, res);
      }
    } catch {
      /* ignore */
    }
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      const sw = reg.active || reg.installing || reg.waiting;
      if (!sw) return;

      if (sw.state === "activated") {
        warmCache();
      } else {
        sw.addEventListener("statechange", function handler() {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", handler);
            warmCache();
          }
        });
      }
    });
  }, []);

  return null;
}
