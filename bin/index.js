"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
class CacheManager {
    constructor(options) {
        this.internalCache = {};
        this.listeners = [];
        this.memoryOnly = true;
        this.cacheDirectory = path_1.resolve(path_1.join(process.cwd(), ".cache/"));
        this.defaultExpire = 5 * 60 * 1000;
        this.checkInterval = 250;
        this.discardTamperedCache = false;
        if (typeof options?.memoryOnly !== "undefined")
            this.memoryOnly = options.memoryOnly;
        if (options?.cacheDirectory)
            this.cacheDirectory = options.cacheDirectory;
        if (options?.defaultExpire)
            this.defaultExpire = options.defaultExpire;
        if (options?.checkInterval)
            this.checkInterval = options.checkInterval;
        if (options?.discardTamperedCache)
            this.discardTamperedCache = options.discardTamperedCache;
        setInterval(() => {
            for (let i = 0; this.keys().length > i; i++) {
                if (Date.now() > this.values()[i].expires)
                    this.listeners
                        .filter(l => l.event === "outdated" &&
                        (l.options?.only
                            ? Array.isArray(l.options.only)
                                ? l.options.only.find(o => o === Object.keys(this.internalCache)[i])
                                : l.options.only === Object.keys(this.internalCache)[i]
                            : true))
                        .forEach(l => l.callback(Object.keys(this.internalCache)[i], Object.values(this.internalCache)[i].data));
            }
        }, this.checkInterval);
        if (this.memoryOnly)
            return;
        if (!fs_1.existsSync(this.cacheDirectory))
            fs_1.mkdirSync(this.cacheDirectory);
        else {
            const cachesToRead = fs_1.readdirSync(this.cacheDirectory);
            cachesToRead.forEach(cTR => {
                try {
                    let data = JSON.parse(fs_1.readFileSync(path_1.join(this.cacheDirectory, cTR, "data"), "utf-8"));
                    this.internalCache[cTR] = {
                        data,
                        expires: parseInt(fs_1.readFileSync(path_1.join(this.cacheDirectory, cTR, "expires"), "utf-8"))
                    };
                }
                catch (err) {
                    if (this.discardTamperedCache) {
                        fs_1.unlinkSync(path_1.join(this.cacheDirectory, cTR, "data"));
                        fs_1.unlinkSync(path_1.join(this.cacheDirectory, cTR, "expires"));
                        fs_1.rmdirSync(path_1.join(this.cacheDirectory, cTR));
                    }
                }
            });
        }
    }
    set(name, data, expires = this.defaultExpire) {
        if (!this.internalCache[name])
            this.internalCache[name] = { data, expires };
        else {
            this.internalCache[name] = {
                data,
                expires: Date.now() + expires
            };
        }
        this.listeners
            .filter(l => l.event === "update" &&
            (l.options?.only
                ? Array.isArray(l.options.only)
                    ? l.options.only.find(o => o === name)
                    : l.options.only === name
                : true))
            .forEach(l => {
            l.callback(name, data);
        });
        if (this.memoryOnly)
            return;
        if (!fs_1.existsSync(path_1.join(this.cacheDirectory, name)))
            fs_1.mkdirSync(path_1.join(this.cacheDirectory, name));
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "data"), JSON.stringify({ data: data }));
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "expires"), expires.toString());
    }
    get(name) {
        return this.internalCache[name]?.data;
    }
    isExpired(name) {
        return this.internalCache[name]
            ? Date.now() > this.internalCache[name].expires
            : true;
    }
    keys() {
        return Object.keys(this.internalCache);
    }
    values() {
        return Object.values(this.internalCache);
    }
    entires() {
        return Object.entries(this.internalCache);
    }
    on(event, callback, options) {
        this.listeners.push({ event, callback, options });
    }
}
exports.default = CacheManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFBNEc7QUFDNUcsK0JBQXFDO0FBc0NyQyxNQUFxQixZQUFZO0lBbUNoQyxZQUFZLE9BQTZCO1FBbENqQyxrQkFBYSxHQUFnQyxFQUFFLENBQUM7UUFDaEQsY0FBUyxHQUlaLEVBQUUsQ0FBQztRQU1SLGVBQVUsR0FBRyxJQUFJLENBQUM7UUFLbEIsbUJBQWMsR0FBRyxjQUFPLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBSXpELGtCQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFJOUIsa0JBQWEsR0FBRyxHQUFHLENBQUM7UUFJcEIseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBTzVCLElBQUksT0FBTyxPQUFPLEVBQUUsVUFBVSxLQUFLLFdBQVc7WUFDN0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksT0FBTyxFQUFFLGNBQWM7WUFBRSxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFFMUUsSUFBSSxPQUFPLEVBQUUsYUFBYTtZQUFFLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUV2RSxJQUFJLE9BQU8sRUFBRSxhQUFhO1lBQUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBRXZFLElBQUksT0FBTyxFQUFFLG9CQUFvQjtZQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDO1FBRTFELFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FB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