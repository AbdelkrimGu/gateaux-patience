"use client";

import { useEffect } from "react";
import { INTERNAL_FLAG, setInternalCookie } from "@/lib/analytics-flag";

/**
 * Mounted in the admin layout: any device that opens /admin is the owner's,
 * so its visits to the public site are no longer counted in analytics.
 */
export default function MarkInternalDevice() {
  useEffect(() => {
    try {
      window.localStorage.setItem(INTERNAL_FLAG, "1");
    } catch {
      // storage blocked: the cookie below still covers the QR page
    }
    setInternalCookie(true);
  }, []);
  return null;
}
