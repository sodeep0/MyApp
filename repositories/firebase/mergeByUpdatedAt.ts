/**
 * Per-entity last-write-wins merge by comparing `updatedAt` ISO strings.
 *
 * Tie-break / missing rules:
 * - Later `updatedAt` wins.
 * - Equal timestamps: prefer remote (cloud is authoritative on ties).
 * - One side missing `updatedAt`: treat missing as older than present.
 * - Both missing: prefer remote.
 *
 * Soft-delete (`isDeleted`) is not modeled on current Habit/Goal/Activity/
 * HabitCompletion types, so deleted-vs-local exclusion is not applied here.
 */

export type WithUpdatedAt = {
  id: string;
  updatedAt?: string | null;
};

function updatedAtRank(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Compare two updatedAt values for LWW.
 * Returns > 0 if `a` is newer, < 0 if `b` is newer, 0 if equal (including both missing).
 */
export function compareUpdatedAt(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const left = updatedAtRank(a);
  const right = updatedAtRank(b);

  if (left === null && right === null) return 0;
  if (left === null) return -1;
  if (right === null) return 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/**
 * Pick the newer of two entities by updatedAt.
 * Prefer remote on equal or both-missing timestamps.
 */
export function pickNewerByUpdatedAt<T extends { updatedAt?: string | null }>(
  local: T | null | undefined,
  remote: T | null | undefined,
): T | null {
  if (!local && !remote) return null;
  if (!local) return remote ?? null;
  if (!remote) return local;

  const cmp = compareUpdatedAt(local.updatedAt, remote.updatedAt);
  // Equal (including both missing): prefer remote.
  return cmp > 0 ? local : remote;
}

/**
 * Union local + remote by id with per-entity LWW on updatedAt.
 */
export function mergeByUpdatedAt<T extends WithUpdatedAt>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();

  for (const item of local) {
    if (!item?.id) continue;
    byId.set(item.id, item);
  }

  for (const item of remote) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    const winner = pickNewerByUpdatedAt(existing, item);
    if (winner) {
      byId.set(item.id, winner);
    }
  }

  return Array.from(byId.values());
}
