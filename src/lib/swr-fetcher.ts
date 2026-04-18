import type { User } from 'firebase/auth';

/**
 * Returns a SWR-compatible fetcher that attaches the Firebase auth token.
 * Pass this as the second argument to useSWR.
 *
 * Usage:
 *   const fetcher = useAuthFetcher(user);
 *   const { data } = useSWR(user ? '/api/...' : null, fetcher);
 *
 * The key should be null when the user is not yet authenticated — SWR will
 * suspend the fetch until the key becomes truthy.
 */
export function createAuthFetcher(user: User) {
  return async (url: string) => {
    const token = await user.getIdToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${url}`);
      throw err;
    }
    return res.json();
  };
}

/** Default SWR options for authenticated pages — no revalidation on focus/reconnect. */
export const SWR_AUTH_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 30_000,
} as const;
