export type InvalidateDomain =
  | 'habits'
  | 'goals'
  | 'activities'
  | 'journal'
  | 'badHabits'
  | 'user'
  | 'profile';

type Listener = () => void;

const listeners = new Map<InvalidateDomain | '*', Set<Listener>>();

export function subscribe(
  domain: InvalidateDomain | '*',
  listener: Listener,
): () => void {
  let set = listeners.get(domain);
  if (!set) {
    set = new Set();
    listeners.set(domain, set);
  }
  set.add(listener);

  return () => {
    set!.delete(listener);
    if (set!.size === 0) {
      listeners.delete(domain);
    }
  };
}

export function invalidate(domain: InvalidateDomain): void {
  const domainListeners = listeners.get(domain);
  if (domainListeners) {
    for (const listener of domainListeners) {
      try {
        listener();
      } catch (error) {
        console.warn(`Invalidate listener failed for "${domain}"`, error);
      }
    }
  }

  const wildcardListeners = listeners.get('*');
  if (wildcardListeners) {
    for (const listener of wildcardListeners) {
      try {
        listener();
      } catch (error) {
        console.warn('Invalidate wildcard listener failed', error);
      }
    }
  }
}
