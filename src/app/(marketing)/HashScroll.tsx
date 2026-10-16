"use client";

import { useEffect } from "react";

// Arriving from another page (e.g. /pricing → /#features): jump to the section
// once the page has rendered. Same-page clicks use native smooth scrolling.
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    go();
    // Images above the section can shift layout as they load.
    const t = setTimeout(go, 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
