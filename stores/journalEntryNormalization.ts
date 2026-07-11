import type { JournalEntry } from '../types/models';

export const JOURNAL_CONTENT_MAX_LENGTH = 20_000;
export const JOURNAL_TAGS_MAX_COUNT = 20;
export const JOURNAL_TAG_MAX_LENGTH = 40;

const ISO_LIKE_DATE = /^\d{4}-\d{2}-\d{2}/;

function clampMoodScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().slice(0, JOURNAL_TAG_MAX_LENGTH))
    .filter((tag) => tag.length > 0)
    .slice(0, JOURNAL_TAGS_MAX_COUNT);
}

function normalizePhotoUris(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((uri): uri is string => typeof uri === 'string');
}

/** Normalize a single journal entry; returns null when required fields are invalid. */
export function normalizeJournalEntry(value: unknown): JournalEntry | null {
  if (!value || typeof value !== 'object') return null;

  const entry = value as Partial<JournalEntry>;
  if (typeof entry.id !== 'string' || entry.id.trim().length === 0) return null;
  if (typeof entry.date !== 'string' || !ISO_LIKE_DATE.test(entry.date)) return null;

  const moodScore = clampMoodScore(entry.moodScore);
  if (moodScore === null) return null;

  const contentJson = typeof entry.contentJson === 'string'
    ? entry.contentJson.slice(0, JOURNAL_CONTENT_MAX_LENGTH)
    : '';

  const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : entry.date;
  const updatedAt = typeof entry.updatedAt === 'string' ? entry.updatedAt : createdAt;
  const userId = typeof entry.userId === 'string' && entry.userId.trim()
    ? entry.userId
    : 'local';

  return {
    id: entry.id.trim(),
    userId,
    date: entry.date,
    moodScore,
    contentJson,
    tags: normalizeTags(entry.tags),
    photoUris: normalizePhotoUris(entry.photoUris),
    createdAt,
    updatedAt,
  };
}

export function normalizeJournalEntries(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeJournalEntry(entry))
    .filter((entry): entry is JournalEntry => entry !== null);
}
