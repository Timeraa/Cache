import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";

interface CacheManagerOptions {
	memoryOnly?: boolean;
	checkInterval?: number;
	cacheDirectory: string;
}

export default class CacheManager {
	private internalCache: any = {};
	private listeners: Array<{
		event: string;
		callback: Function;
	}> = [];

	/**
	 * Stores the cache only in memory, if disabled will create a cache on disk to serve as redundancy layer in case of an unexpected shutdown.
	 * Will restore the cache on startup and load its expire times
	 */
	memoryOnly = true;
	/**
	 * Changes the default cache folder from __dirname + .cache
	 * Will be ingored when memoryOnly is true
	 */
	cacheDirectory = resolve(join(__dirname, ".cache/"));
	/**
	 * The time in miliseconds for when a new cache without an assigned expire date is counted as outdated, if it's outdated it will fire an outdated event
	 */
	defaultExpire = 5 * 60 * 1000;
	/**
	 * Expire check interval
	 */
	checkInterval = 250;

	constructor(options?: CacheManagerOptions) {
		if (typeof options?.memoryOnly !== "undefined")
			this.memoryOnly = options.memoryOnly;
		if (options?.cacheDirectory)
			this.cacheDirectory = resolve(options.cacheDirectory);
		if (options?.checkInterval) this.checkInterval = options.checkInterval;

		setInterval(() => {
			for (let i = 0; this.keys().length > i; i++) {
				if (Date.now() > this.values()[i].expires)
					this.listeners
						.filter(l => l.event === "outdated")
						.forEach(
							l => l.callback(Object.keys(this.internalCache)[i]),
							Object.values(this.internalCache)[i]
						);
			}
		}, this.checkInterval);

		if (this.memoryOnly) return;

		if (!existsSync(this.cacheDirectory)) mkdirSync(this.cacheDirectory);
		else {
			const cachesToRead = readdirSync(this.cacheDirectory);

			cachesToRead.forEach(cTR => {
				let data = readFileSync(
					join(this.cacheDirectory, cTR, "data"),
					"utf-8"
				);

				try {
					data = JSON.parse(data);
				} catch (_) {}

				this.internalCache[cTR] = {
					data: data,
					expires: parseInt(
						readFileSync(join(this.cacheDirectory, cTR, "expires"), "utf-8")
					)
				};
			});
		}
	}

	set(name: string, data: any, expires: number = this.defaultExpire) {
		if (!this.internalCache[name]) this.internalCache[name] = { data, expires };
		else {
			this.internalCache[name].data = data;
			this.internalCache[name].expires = Date.now() + expires;
		}

		this.listeners
			.filter(l => l.event === "update")
			.forEach(l => {
				l.callback(name, data);
			});

		if (this.memoryOnly) return;

		if (!existsSync(join(this.cacheDirectory, name)))
			mkdirSync(join(this.cacheDirectory, name));

		writeFileSync(
			join(this.cacheDirectory, name, "data"),
			JSON.stringify({ data: data })
		);
		writeFileSync(
			join(this.cacheDirectory, name, "expires"),
			(Date.now() + expires).toString()
		);
	}

	get(name: string) {
		return this.internalCache[name];
	}

	isExpired(name: string) {
		return Date.now() > this.internalCache[name].expires;
	}

	keys(): any {
		return Object.keys(this.internalCache);
	}

	values(): any {
		return Object.values(this.internalCache);
	}

	on(event: "update" | "outdated", callback: Function) {
		this.listeners.push({ event, callback });
	}
}
