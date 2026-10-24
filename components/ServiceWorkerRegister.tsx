"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (public/sw.js) once on mount. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* service worker unavailable — app still works without it */
      });
    }
  }, []);

  return null;
}
