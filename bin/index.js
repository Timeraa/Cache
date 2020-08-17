"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chokidar_1 = require("chokidar");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
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
        const watcher = chokidar_1.watch(this.cacheDirectory, {
            ignoreInitial: true,
            awaitWriteFinish: true,
            ignorePermissionErrors: true,
            cwd: this.cacheDirectory
        });
        watcher.on("all", (e, path) => __awaiter(this, void 0, void 0, function* () {
            const cacheName = path_1.basename(path_1.dirname(path)).replace(".", "");
            if (cacheName.length === 0)
                return;
            this.internalCache[cacheName] = {
                data: JSON.parse(yield promises_1.readFile(path_1.join(this.cacheDirectory, cacheName, "data"), "utf-8")).data,
                expires: Number(yield promises_1.readFile(path_1.join(this.cacheDirectory, cacheName, "expires"), "utf-8"))
            };
            this.listeners
                .filter(l => {
                var _a;
                return l.event === "diskCacheUpdate" &&
                    (((_a = l.options) === null || _a === void 0 ? void 0 : _a.only) ? Array.isArray(l.options.only)
                        ? l.options.only.find(o => o === name)
                        : l.options.only === name
                        : true);
            })
                .forEach(l => l.callback(cacheName, this.internalCache[cacheName].data));
        }));
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
        promises_1.writeFile(path_1.join(this.cacheDirectory, name, "data"), JSON.stringify({ data }));
        promises_1.writeFile(path_1.join(this.cacheDirectory, name, "expires"), (Date.now() + expires).toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBaUM7QUFDakMsMkJBQXFGO0FBQ3JGLDBDQUEyRDtBQUMzRCwrQkFBd0Q7QUFzQ3hELE1BQXFCLFlBQVk7SUFtQ2hDLFlBQVksT0FBNkI7UUFsQ3pDLGtCQUFhLEdBQWdDLEVBQUUsQ0FBQztRQUN4QyxjQUFTLEdBSVosRUFBRSxDQUFDO1FBTVIsZUFBVSxHQUFHLElBQUksQ0FBQztRQUtsQixtQkFBYyxHQUFHLGNBQU8sQ0FBQyxXQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFJekQsa0JBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUk5QixrQkFBYSxHQUFHLEdBQUcsQ0FBQztRQUlwQix5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFPNUIsSUFBSSxRQUFPLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxVQUFVLENBQUEsS0FBSyxXQUFXO1lBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUV0QyxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxjQUFjO1lBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBRTFFLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGFBQWE7WUFBRSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFFdkUsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsYUFBYTtZQUFFLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUV2RSxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxvQkFBb0I7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