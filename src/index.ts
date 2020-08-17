import { watch } from "chokidar";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdir, unlink } from "fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";

interface CacheManagerOptions {
	/**
	 * Stores the cache only in memory, if disabled will create a cache on disk to serve as a redundancy layer in case of an unexpected shutdown.
	 * Will restore the cache on startup and load its expire times
	 */
	memoryOnly?: boolean;
	/**
	 * Expire check interval
	 */
	checkInterval?: number;
	/**
	 * The time in miliseconds for when a new cache without an assigned expire date is counted as outdated, if it's outdated it will fire an outdated event
	 */
	defaultExpire?: number;
	/**
	 * Changes the default cache folder from process.cwd() + .cache
	 * Will be ingored when memoryOnly is true
	 */
	cacheDirectory?: string;
	/**
	 * Whether to discard any corrupt cache files on startup.
	 */
	discardTamperedCache?: boolean;
}

interface CacheListenerOptions {
	only?: string | Array<string>;
}

interface CacheEntry {
	// Any json object
	data: { [x: string]: any };
	// When the obkect will expire
	expires: number;
}

export default class CacheManager {
	internalCache: { [x: string]: CacheEntry } = {};
	private listeners: Array<{
		event: string;
		callback: Function;
		options?: CacheListenerOptions;
	}> = [];

	/**
	 * Stores the cache only in memory, if disabled will create a cache on disk to serve as a redundancy layer in case of an unexpected shutdown.
	 * Will restore the cache on startup and load its expire times
	 */
	memoryOnly = true;
	/**
	 * Changes the default cache folder from process.cwd() + .cache
	 * Will be ingored when memoryOnly is true
	 */
	cacheDirectory = resolve(join(process.cwd(), ".cache/"));
	/**
	 * The time in miliseconds for when a new cache without an assigned expire date is counted as outdated, if it's outdated it will fire an outdated event
	 */
	defaultExpire = 5 * 60 * 1000;
	/**
	 * Expire check interval
	 */
	checkInterval = 250;
	/**
	 * Whether to discard any corrupt cache files on startup.
	 */
	discardTamperedCache = false;

	/**
	 * Creates a new instance of CacheManager
	 * @param options CacheManager options
	 */
	constructor(options?: CacheManagerOptions) {
		if (typeof options?.memoryOnly !== "undefined")
			this.memoryOnly = options.memoryOnly;

		if (options?.cacheDirectory) this.cacheDirectory = options.cacheDirectory;

		if (options?.defaultExpire) this.defaultExpire = options.defaultExpire;

		if (options?.checkInterval) this.checkInterval = options.checkInterval;

		if (options?.discardTamperedCache)
			this.discardTamperedCache = options.discardTamperedCache;

		const watcher = watch(this.cacheDirectory, {
			ignoreInitial: true,
			awaitWriteFinish: true,
			ignorePermissionErrors: true,
			cwd: this.cacheDirectory
		});

		watcher.on("all", async (e, path) => {
			const cacheName = basename(dirname(path)).replace(".", "");

			if (cacheName.length === 0) return;

			this.internalCache[cacheName] = {
				data: JSON.parse(
					await readFile(join(this.cacheDirectory, cacheName, "data"), "utf-8")
				).data,
				expires: Number(
					await readFile(
						join(this.cacheDirectory, cacheName, "expires"),
						"utf-8"
					)
				)
			};

			this.listeners
				.filter(
					l =>
						l.event === "diskCacheUpdate" &&
						(l.options?.only
							? Array.isArray(l.options.only)
								? l.options.only.find(o => o === name)
								: l.options.only === name
							: true)
				)
				.forEach(l =>
					l.callback(cacheName, this.internalCache[cacheName].data)
				);
		});

		setInterval(() => {
			for (let i = 0; this.keys().length > i; i++) {
				if (Date.now() > this.values()[i].expires)
					this.listeners
						.filter(
							l =>
								l.event === "outdated" &&
								(l.options?.only
									? Array.isArray(l.options.only)
										? l.options.only.find(
												o => o === Object.keys(this.internalCache)[i]
										  )
										: l.options.only === Object.keys(this.internalCache)[i]
									: true)
						)
						.forEach(l =>
							l.callback(
								Object.keys(this.internalCache)[i],
								(<CacheEntry>Object.values(this.internalCache)[i]).data
							)
						);
			}
		}, this.checkInterval);

		if (this.memoryOnly) return;

		if (!existsSync(this.cacheDirectory)) mkdirSync(this.cacheDirectory);
		else {
			const cachesToRead = readdirSync(this.cacheDirectory);

			cachesToRead.forEach(cTR => {
				try {
					let data: CacheEntry = JSON.parse(
						readFileSync(join(this.cacheDirectory, cTR, "data"), "utf-8")
					).data;

					this.internalCache[cTR] = {
						data,
						expires: parseInt(
							readFileSync(join(this.cacheDirectory, cTR, "expires"), "utf-8")
						)
					};
				} catch (err) {
					if (this.discardTamperedCache) {
						unlink(join(this.cacheDirectory, cTR, "data"), () => {});
						unlink(join(this.cacheDirectory, cTR, "expires"), () => {});
						rmdir(join(this.cacheDirectory, cTR), () => {});
					}
				}
			});
		}
	}

	/**
	 * Set a value in the cache.
	 * @param name cache name
	 * @param data cache's data
	 * @param expires expire time of cache in miliseconds
	 */
	set(name: string, data: any, expires: number = this.defaultExpire) {
		this.internalCache[name] = {
			data,
			expires: Date.now() + expires
		};

		this.listeners
			.filter(
				l =>
					l.event === "update" &&
					(l.options?.only
						? Array.isArray(l.options.only)
							? l.options.only.find(o => o === name)
							: l.options.only === name
						: true)
			)
			.forEach(l => {
				l.callback(name, data);
			});

		if (this.memoryOnly) return;

		if (!existsSync(join(this.cacheDirectory, name)))
			mkdirSync(join(this.cacheDirectory, name));

		writeFile(
			join(this.cacheDirectory, name, "data"),
			JSON.stringify({ data })
		);
		writeFile(
			join(this.cacheDirectory, name, "expires"),
			(Date.now() + expires).toString()
		);
	}

	/**
	 * Get the data of a cached object
	 * @param name cache name
	 */
	get(name: string) {
		return this.internalCache[name]?.data;
	}

	/**
	 * Check if the given cache has expired
	 * @param name cache name
	 */
	isExpired(name: string) {
		return this.internalCache[name]
			? Date.now() > this.internalCache[name].expires
			: true;
	}

	/**
	 * Returns all cached keys
	 */
	keys() {
		return Object.keys(this.internalCache);
	}

	/**
	 * Returns all cached values
	 */
	values() {
		return Object.values(this.internalCache);
	}

	/**
	 * Returns all entries
	 */
	entires() {
		return Object.entries(this.internalCache);
	}

	/**
	 * Listen to events
	 * @param event event name
	 * @param callback callback function
	 * @param options options
	 */
	on(
		event: "update" | "outdated" | "diskCacheUpdate",
		callback: (name: string, data?: any) => void,
		options?: CacheListenerOptions
	) {
		this.listeners.push({ event, callback, options });
	}
}
