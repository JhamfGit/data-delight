/**
 * lib/statusTransitions.js — open-vocabulary status transition policy.
 *
 * `registros.status` is a plain string column with no ENUM/CHECK constraint
 * (confirmed live, see openspec tasks.md Phase 0). This module MUST stay
 * data-driven: an unmapped/unknown source status yields zero allowed
 * transitions on read (never throws) and rejects every write attempt,
 * instead of hardcoding a binary NO/SI branch. Extend by adding data to
 * TRANSITIONS, never by adding conditional branches.
 */

const TRANSITIONS = {
  NO: ["SI"],
  SI: ["NO"],
};

/**
 * @param {string} status - current registro status
 * @returns {string[]} every status this record MAY transition to; `[]` for
 *   an unknown/unmapped status (open vocabulary — never throws)
 */
export const allowedFrom = (status) => TRANSITIONS[status] ?? [];

/**
 * @param {string} from - current registro status
 * @param {string} to - requested new status
 * @returns {boolean} whether `from -> to` is an allowed transition
 */
export const canTransition = (from, to) => allowedFrom(from).includes(to);
