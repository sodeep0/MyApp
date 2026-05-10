import type { JournalEntry } from '../types/models';

export function normalizeJournalEntries(value: unknown): JournalEntry[] {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is JournalEntry => (
    !!entry
    && typeof entry === 'object'
    && typeof (entry as Partial<JournalEntry>).id === 'string'
    && typeof (entry as Partial<JournalEntry>).date === 'string'
  ));
}
