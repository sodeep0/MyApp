// Base store utilities and UUID generation
export function generateUUID(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 5)}`;
}

/**
 * Generic array store — loads, saves, and mutates an array of items in storage.
 */
export function createArrayStore<T extends { id: string }>(storageKey: string) {
  return {
    key: storageKey,

    async getAll(): Promise<T[]> {
      const { storage } = await import('../storage/asyncStorage');
      return (await storage.getItem<T[]>(storageKey)) ?? [];
    },

    async getById(id: string): Promise<T | undefined> {
      const items = await this.getAll();
      return items.find((item) => item.id === id);
    },

    async setAll(items: T[]): Promise<void> {
      const { storage } = await import('../storage/asyncStorage');
      await storage.setItem(storageKey, items);
    },

    async add(item: T): Promise<T[]> {
      const items = await this.getAll();
      const updated = [...items, item];
      await this.setAll(updated);
      return updated;
    },

    async update(id: string, updates: Partial<T>): Promise<T | null> {
      const items = await this.getAll();
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      const updated = { ...items[idx], ...updates };
      items[idx] = updated;
      await this.setAll(items);
      return updated;
    },

    async delete(id: string): Promise<T[]> {
      const items = await this.getAll();
      const filtered = items.filter((item) => item.id !== id);
      await this.setAll(filtered);
      return filtered;
    },
  };
}
