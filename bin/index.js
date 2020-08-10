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
        if (typeof (options === null || options === void 0 ? void 0 : options.memoryOnly) !== "undefined")
            this.memoryOnly = options.memoryOnly;
        if (options === null || options === void 0 ? void 0 : options.cacheDirectory)
            this.cacheDirectory = options.cacheDirectory;
        if (options === null || options === void 0 ? void 0 : options.defaultExpire)
            this.defaultExpire = options.defaultExpire;
        if (options === null || options === void 0 ? void 0 : options.checkInterval)
            this.checkInterval = options.checkInterval;
        if (options === null || options === void 0 ? void 0 : options.discardTamperedCache)
            this.discardTamperedCache = options.discardTamperedCache;
        setInterval(() => {
            for (let i = 0; this.keys().length > i; i++) {
                if (Date.now() > this.values()[i].expires)
                    this.listeners
                        .filter(l => {
                        var _a;
                        return l.event === "outdated" &&
                            (((_a = l.options) === null || _a === void 0 ? void 0 : _a.only) ? Array.isArray(l.options.only)
                                ? l.options.only.find(o => o === Object.keys(this.internalCache)[i])
                                : l.options.only === Object.keys(this.internalCache)[i]
                                : true);
                    })
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
                    let data = JSON.parse(fs_1.readFileSync(path_1.join(this.cacheDirectory, cTR, "data"), "utf-8")).data;
                    this.internalCache[cTR] = {
                        data,
                        expires: parseInt(fs_1.readFileSync(path_1.join(this.cacheDirectory, cTR, "expires"), "utf-8"))
                    };
                }
                catch (err) {
                    if (this.discardTamperedCache) {
                        fs_1.unlink(path_1.join(this.cacheDirectory, cTR, "data"), () => { });
                        fs_1.unlink(path_1.join(this.cacheDirectory, cTR, "expires"), () => { });
                        fs_1.rmdir(path_1.join(this.cacheDirectory, cTR), () => { });
                    }
                }
            });
        }
    }
    set(name, data, expires = this.defaultExpire) {
        this.internalCache[name] = {
            data,
            expires: Date.now() + expires
        };
        this.listeners
            .filter(l => {
            var _a;
            return l.event === "update" &&
                (((_a = l.options) === null || _a === void 0 ? void 0 : _a.only) ? Array.isArray(l.options.only)
                    ? l.options.only.find(o => o === name)
                    : l.options.only === name
                    : true);
        })
            .forEach(l => {
            l.callback(name, data);
        });
        if (this.memoryOnly)
            return;
        if (!fs_1.existsSync(path_1.join(this.cacheDirectory, name)))
            fs_1.mkdirSync(path_1.join(this.cacheDirectory, name));
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "data"), JSON.stringify({ data }));
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "expires"), (Date.now() + expires).toString());
    }
    get(name) {
        var _a;
        return (_a = this.internalCache[name]) === null || _a === void 0 ? void 0 : _a.data;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFRWTtBQUNaLCtCQUFxQztBQXNDckMsTUFBcUIsWUFBWTtJQW1DaEMsWUFBWSxPQUE2QjtRQWxDekMsa0JBQWEsR0FBZ0MsRUFBRSxDQUFDO1FBQ3hDLGNBQVMsR0FJWixFQUFFLENBQUM7UUFNUixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBS2xCLG1CQUFjLEdBQUcsY0FBTyxDQUFDLFdBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUl6RCxrQkFBYSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBSTlCLGtCQUFhLEdBQUcsR0FBRyxDQUFDO1FBSXBCLHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQU81QixJQUFJLFFBQU8sT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFVBQVUsQ0FBQSxLQUFLLFdBQVc7WUFDN0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBRXRDLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGNBQWM7WUFBRSxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7UUFFMUUsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsYUFBYTtZQUFFLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUV2RSxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxhQUFhO1lBQUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBRXZFLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLG9CQUFvQjtZQUNoQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFD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