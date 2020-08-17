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
        const watcher = chokidar_1.watch(this.cacheDirectory, {
            ignoreInitial: true,
            ignorePermissionErrors: true,
            awaitWriteFinish: true,
            ignored: ["expires"],
            cwd: this.cacheDirectory
        });
        watcher.on("all", (e, path) => __awaiter(this, void 0, void 0, function* () {
            const cacheName = path_1.basename(path_1.dirname(path)).replace(".", "");
            if (cacheName.length === 0)
                return;
            if (!(fs_1.existsSync(path_1.join(this.cacheDirectory, cacheName)) &&
                fs_1.existsSync(path_1.join(this.cacheDirectory, cacheName, "data")) &&
                fs_1.existsSync(path_1.join(this.cacheDirectory, cacheName, "expires"))))
                return;
            let data;
            try {
                data = JSON.parse(yield promises_1.readFile(path_1.join(this.cacheDirectory, cacheName, "data"), "utf-8")).data;
            }
            catch (_) {
                data = {};
            }
            this.internalCache[cacheName] = {
                data: data,
                expires: Number(yield promises_1.readFile(path_1.join(this.cacheDirectory, cacheName, "expires"), "utf-8"))
            };
            this.listeners
                .filter(l => {
                var _a;
                return (l.event === "diskCacheUpdate" || l.event === "update") &&
                    (((_a = l.options) === null || _a === void 0 ? void 0 : _a.only) ? Array.isArray(l.options.only)
                        ? l.options.only.find(o => o === cacheName)
                        : l.options.only === cacheName
                        : true);
            })
                .forEach(l => l.callback(cacheName, this.internalCache[cacheName].data));
        }));
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
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "expires"), (Date.now() + expires).toString());
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "data"), JSON.stringify({ data }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBaUM7QUFDakMsMkJBQW9HO0FBQ3BHLDBDQUF1QztBQUN2QywrQkFBd0Q7QUFzQ3hELE1BQXFCLFlBQVk7SUFtQ2hDLFlBQVksT0FBNkI7UUFsQ3pDLGtCQUFhLEdBQWdDLEVBQUUsQ0FBQztRQUN4QyxjQUFTLEdBSVosRUFBRSxDQUFDO1FBTVIsZUFBVSxHQUFHLElBQUksQ0FBQztRQUtsQixtQkFBYyxHQUFHLGNBQU8sQ0FBQyxXQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFJekQsa0JBQWEsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUk5QixrQkFBYSxHQUFHLEdBQUcsQ0FBQztRQUlwQix5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFPNUIsSUFBSSxRQUFPLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxVQUFVLENBQUEsS0FBSyxXQUFXO1lBQzdDLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUV0QyxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxjQUFjO1lBQUUsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBRTFFLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGFBQWE7WUFBRSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFFdkUsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsYUFBYTtZQUFFLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUV2RSxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxvQkFBb0I7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