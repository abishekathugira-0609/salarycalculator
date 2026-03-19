/**
 * lib/cache.ts
 *
 * In-memory data cache with TTL.
 * Used by dynamic ISR pages to avoid redundant JSON reads / computations.
 * The singleton is scoped to the Node.js process lifetime — Vercel creates
 * a fresh process per deployment and per cold-start, so this acts as a
 * request-level warm cache between hot-reloads in the same Lambda instance.
 */

export const TTL = {
  HOUR_1:  1 * 60 * 60 * 1000,
  HOUR_24: 24 * 60 * 60 * 1000,
  WEEK_1:  7 * 24 * 60 * 60 * 1000,
} as const;

interface CacheEntry<T> {
  value: T;
  /** Absolute epoch-ms at which this entry expires */
  expiresAt: number;
  /** When this entry was created (for debugging) */
  createdAt: number;
  /** How many times this entry has been hit */
  hits: number;
}

export interface CacheStats {
  size: number;
  keys: string[];
  entries: Array<{
    key: string;
    createdAt: number;
    expiresAt: number;
    hits: number;
    ttlRemainingMs: number;
  }>;
}

// ── Core cache class ──────────────────────────────────────────────────────────

class DataCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  readonly defaultTTL: number;

  constructor(defaultTTL = TTL.HOUR_24) {
    this.defaultTTL = defaultTTL;
  }

  /** Store a value under `key` with an optional TTL in milliseconds. */
  set<T>(key: string, value: T, ttlMs: number = this.defaultTTL): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      expiresAt: now + ttlMs,
      createdAt: now,
      hits: 0,
    });
  }

  /**
   * Retrieve a cached value, or `null` if missing / expired.
   * Expired entries are deleted on access (lazy eviction).
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hits++;
    return entry.value as T;
  }

  /** Returns true only if the entry exists and has not expired. */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Remove a single entry. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Wipe all entries. */
  clear(): void {
    this.store.clear();
  }

  /** Remove all entries that have already expired. */
  evictExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /** Current number of (possibly stale) entries. */
  size(): number {
    return this.store.size;
  }

  /** Diagnostic snapshot after evicting expired entries. */
  stats(): CacheStats {
    this.evictExpired();
    const now = Date.now();
    const entries = [...this.store.entries()].map(([key, e]) => ({
      key,
      createdAt: e.createdAt,
      expiresAt: e.expiresAt,
      hits: e.hits,
      ttlRemainingMs: e.expiresAt - now,
    }));
    return {
      size: this.store.size,
      keys: entries.map((e) => e.key),
      entries,
    };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

/** Global application cache — import and use directly in any module. */
export const cache = new DataCache(TTL.HOUR_24);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get from cache, or run `fetcher` once, cache the result, and return it.
 *
 * @example
 * const data = await cached("rent:austin", () => getRent("austin"));
 */
export async function cached<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  ttlMs: number = TTL.HOUR_24
): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== null) return hit;

  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

/**
 * Synchronous version — only use when the fetcher is guaranteed synchronous.
 */
export function cachedSync<T>(
  key: string,
  fetcher: () => T,
  ttlMs: number = TTL.HOUR_24
): T {
  const hit = cache.get<T>(key);
  if (hit !== null) return hit;

  const value = fetcher();
  cache.set(key, value, ttlMs);
  return value;
}

/**
 * Wrap an entire module's export function so results are cached automatically.
 *
 * @example
 * export const getRent = withCache("rent", (city: string) => _getRent(city));
 */
export function withCache<Args extends unknown[], R>(
  namespace: string,
  fn: (...args: Args) => R,
  ttlMs: number = TTL.HOUR_24
): (...args: Args) => R {
  return (...args: Args): R => {
    const key = `${namespace}:${JSON.stringify(args)}`;
    return cachedSync(key, () => fn(...args), ttlMs);
  };
}
