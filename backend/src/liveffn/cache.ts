/**
 * In-memory cache for LiveFFN data.
 * Provides TTL-based caching to avoid excessive scraping.
 */

import type { CacheEntry, CacheKey } from './types';

interface CacheStore {
  [key: string]: CacheEntry<unknown>;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const COMPETITION_LIST_TTL_MS = 10 * 60 * 1000; // 10 minutes
const COMPETITION_DETAIL_TTL_MS = 30 * 60 * 1000; // 30 minutes
const PROGRAM_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESULTS_TTL_MS = 2 * 60 * 1000; // 2 minutes (during live meets)

const store: CacheStore = {};

// Track pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<unknown>>();

function getCacheKeyTTL(key: CacheKey): number {
  if (key === 'competition_list') return COMPETITION_LIST_TTL_MS;
  if (key.startsWith('competition_') && (key.endsWith('_program') || key.endsWith('_events'))) return PROGRAM_TTL_MS;
  if (key.startsWith('competition_') && key.includes('_results_')) return RESULTS_TTL_MS;
  if (key.startsWith('competition_')) return COMPETITION_DETAIL_TTL_MS;
  return DEFAULT_TTL_MS;
}

export function getFromCache<T>(key: CacheKey): T | null {
  const entry = store[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > new Date(entry.expiresAt).getTime()) {
    delete store[key];
    return null;
  }
  return entry.data;
}

export function setCache<T>(key: CacheKey, data: T, customTTL?: number): void {
  const ttl = customTTL ?? getCacheKeyTTL(key);
  const now = Date.now();
  store[key] = {
    data,
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
  };
}

export function invalidateCache(key: CacheKey): void {
  delete store[key];
}

export function invalidateAllCache(): void {
  Object.keys(store).forEach(key => delete store[key]);
}

/**
 * Generic cached fetch: checks cache first, then fetches and caches.
 * Deduplicates concurrent requests for the same key.
 */
export async function cachedFetch<T>(
  key: CacheKey,
  fetcher: () => Promise<T>,
  ttl?: number,
  persistFn?: (data: T) => Promise<void>,
): Promise<T> {
  // Check cache
  const cached = getFromCache<T>(key);
  if (cached !== null) return cached;

  // Deduplicate concurrent requests
  const pending = pendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    try {
      const data = await fetcher();
      setCache(key, data, ttl);
      // Non-blocking persist to DB
      if (persistFn) {
        persistFn(data).catch(err => console.error(`[cache] persist error for ${key}:`, err));
      }
      return data;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, promise);
  return promise;
}

/** Get cache stats */
export function getCacheStats(): { keys: number; entries: Array<{ key: string; expiresIn: number }> } {
  const now = Date.now();
  const entries = Object.entries(store)
    .filter(([, entry]) => now < new Date(entry.expiresAt).getTime())
    .map(([key, entry]) => ({
      key,
      expiresIn: Math.round((new Date(entry.expiresAt).getTime() - now) / 1000),
    }));

  return { keys: entries.length, entries };
}
