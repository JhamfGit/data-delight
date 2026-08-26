/**
 * src/lib/statusTransitions.ts — frontend UI-hint mirror of the backend's
 * `lib/statusTransitions.js` open-vocabulary policy (design D2).
 *
 * This is presentation-only: it drives which transitions the status-
 * correction dialog offers and whether the control is disabled. It is NOT
 * the enforcement boundary — the server (`lib/statusTransitions.js`) is
 * the source of truth and re-validates every transition on write. Keeping
 * this data-driven (never a hardcoded NO/SI branch) satisfies the spec's
 * "Constrained Status Transition Table" requirement on the render/filter
 * side: an unknown status MUST display and filter using the actual value,
 * not a binary NO/SI fallback.
 */

const TRANSITIONS: Record<string, string[]> = {
  NO: ["SI"],
  SI: ["NO"],
};

/**
 * @param status - current registro status
 * @returns every status this record MAY transition to; `[]` for an
 *   unknown/unmapped status (open vocabulary — never throws)
 */
export const allowedFrom = (status: string): string[] => TRANSITIONS[status] ?? [];

/**
 * @param status - a registro status value
 * @returns whether this status is part of the known vocabulary
 */
export const isKnownStatus = (status: string): boolean => status in TRANSITIONS;
