"use client";
import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function snapshot() {
  return window.matchMedia(query).matches;
}
// A consistent server snapshot avoids hydration mismatches when the browser
// has reduced motion enabled. CSS also suppresses transforms before hydration.
export default function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
