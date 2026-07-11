// Journal entry store (local-only by policy; never sync to Firebase)
import type { JournalEntry } from '../types/models';
import { generateUUID } from '@/utils/id';
import { invalidate } from '@/stores/invalidate';
import { normalizeJournalEntries, normalizeJournalEntry } from './journalEntryNormalization';
import { enforceCountLimitedFeatureGate } from '@/services/featureAccess';
import { getSensitiveItem, setSensitiveItem } from '@/storage/secureDataStorage';

const JOURNAL_KEY = 'kaarma_journal_entries';
const JOURNAL_SECURE_KEY = 'kaarma_secure_journal_entries_v1';

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const entries = await getSensitiveItem<unknown>({
    secureKey: JOURNAL_SECURE_KEY,
    legacyKey: JOURNAL_KEY,
    defaultValue: [],
  });
  return normalizeJournalEntries(entries).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | undefined> {
  const entries = await getAllJournalEntries();
  return entries.find((e) => e.id === id);
}

export async function getJournalEntriesByDate(date: string): Promise<JournalEntry[]> {
  const entries = await getAllJournalEntries();
  // date is ISO "YYYY-MM-DD"
  return entries.filter((e) => e.date.startsWith(date));
}

export async function saveJournalEntries(entries: JournalEntry[]): Promise<void> {
  await setSensitiveItem({
    secureKey: JOURNAL_SECURE_KEY,
    legacyKey: JOURNAL_KEY,
    value: normalizeJournalEntries(entries),
  });
  invalidate('journal');
}

export async function addJournalEntry(
  data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<JournalEntry> {
  await enforceCountLimitedFeatureGate('journalEntries', countJournalEntries);

  const entries = await getAllJournalEntries();
  const now = new Date().toISOString();
  const entry = normalizeJournalEntry({
    ...data,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  });
  if (!entry) {
    throw new Error('Invalid journal entry payload.');
  }
  const updated = [...entries, entry].sort((a, b) => b.date.localeCompare(a.date));
  await saveJournalEntries(updated);
  return entry;
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
  const entries = await getAllJournalEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const merged = {
    ...entries[idx],
    ...updates,
    id: entries[idx].id,
    updatedAt: new Date().toISOString(),
  };
  const normalized = normalizeJournalEntry(merged);
  if (!normalized) return null;
  entries[idx] = normalized;
  await saveJournalEntries(entries);
  return entries[idx];
}

export async function upsertJournalEntryForDate(
  date: string,
  data: { moodScore: number; contentJson: string; tags: string[] },
): Promise<JournalEntry> {
  const existing = await getJournalEntriesByDate(date);
  if (existing.length > 0) {
    return updateJournalEntry(existing[0].id, {
      ...data,
      updatedAt: new Date().toISOString(),
    }) as Promise<JournalEntry>;
  }
  return addJournalEntry({
    ...data,
    date,
    photoUris: [],
    userId: 'local',
  });
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const entries = await getAllJournalEntries();
  await saveJournalEntries(entries.filter((e) => e.id !== id));
}

export function countJournalEntries(): Promise<number> {
  return getAllJournalEntries().then((entries) => entries.length);
}
