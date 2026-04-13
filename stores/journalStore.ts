// Journal entry store
import type { JournalEntry } from '../types/models';
import { generateUUID } from './baseStore';

const JOURNAL_KEY = 'kaarma_journal_entries';

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const { storage } = await import('../storage/asyncStorage');
  const entries = (await storage.getItem<JournalEntry[]>(JOURNAL_KEY)) ?? [];
  return entries.sort((a, b) => b.date.localeCompare(a.date));
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
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(JOURNAL_KEY, entries);
}

export async function addJournalEntry(
  data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<JournalEntry> {
  const entries = await getAllJournalEntries();
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    ...data,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...entries, entry].sort((a, b) => b.date.localeCompare(a.date));
  await saveJournalEntries(updated);
  return entry;
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | null> {
  const entries = await getAllJournalEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() };
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
