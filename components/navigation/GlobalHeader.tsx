'use client';

/**
 * CR-020: Primary navigation and client/date context are rendered once by the
 * authoritative application shell in app/layout.tsx.
 * GlobalHeader returns null to prevent duplicate nested headers inside route pages.
 */
export default function GlobalHeader() {
  return null;
}
