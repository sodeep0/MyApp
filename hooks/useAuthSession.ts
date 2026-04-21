import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthState } from '@/services/firebase/auth';

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAnonymous = user?.isAnonymous === true;
  const isAuthenticated = Boolean(user && !isAnonymous);

  return {
    user,
    loading,
    isAnonymous,
    isAuthenticated,
    email: isAuthenticated ? user?.email ?? null : null,
    displayName: isAuthenticated ? user?.displayName ?? null : null,
  };
}

export default useAuthSession;
