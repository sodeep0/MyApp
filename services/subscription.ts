import { storage } from '@/storage/asyncStorage';

export const PREMIUM_KEY = 'kaarma_premium';

export async function getStoredPremiumState(): Promise<boolean> {
  return (await storage.getItem<boolean>(PREMIUM_KEY, false)) === true;
}

export async function setStoredPremiumState(isPremium: boolean): Promise<void> {
  await storage.setItem(PREMIUM_KEY, isPremium);
}
