interface CacheEntry<T> {
	readonly value: T;
	readonly expiry: number;
}

export class ObjectsCache {
	private readonly _cache = new Map<string, CacheEntry<unknown>>();
	private _ttlMs: number;

	constructor(ttlMs: number) {
		this._ttlMs = ttlMs;
	}

	get<T>(key: string): T | null {
		const entry = this._cache.get(key);
		if (!entry) return null;
		if (Date.now() > entry.expiry) {
			this._cache.delete(key);
			return null;
		}
		return entry.value as T;
	}

	set<T>(key: string, value: T): void {
		this._cache.set(key, {
			value,
			expiry: Date.now() + this._ttlMs,
		});
	}

	clear(): void {
		this._cache.clear();
	}

	setTtl(ttlMs: number): void {
		this._ttlMs = ttlMs;
	}
}

export function parseCacheTime(timeStr: string): number {
	const match = timeStr.match(/^(\d+)\s*(s|m|h|d)$/);
	if (!match) return 15 * 60 * 1000; // default 15m

	const value = parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case "s": return value * 1000;
		case "m": return value * 60 * 1000;
		case "h": return value * 60 * 60 * 1000;
		case "d": return value * 24 * 60 * 60 * 1000;
		default: return 15 * 60 * 1000;
	}
}
