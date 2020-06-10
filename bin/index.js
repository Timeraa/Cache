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
                    let data = JSON.parse(fs_1.readFileSync(path_1.join(this.cacheDirectory, cTR, "data"), "utf-8"));
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
        if (!this.internalCache[name])
            this.internalCache[name] = { data, expires };
        else {
            this.internalCache[name] = {
                data,
                expires: Date.now() + expires
            };
        }
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
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "data"), JSON.stringify({ data: data }));
        fs_1.writeFileSync(path_1.join(this.cacheDirectory, name, "expires"), expires.toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQkFBb0c7QUFDcEcsK0JBQXFDO0FBc0NyQyxNQUFxQixZQUFZO0lBbUNoQyxZQUFZLE9BQTZCO1FBbENqQyxrQkFBYSxHQUFnQyxFQUFFLENBQUM7UUFDaEQsY0FBUyxHQUlaLEVBQUUsQ0FBQztRQU1SLGVBQVUsR0FBRyxJQUFJLENBQUM7UUFLbEIsbUJBQWMsR0FBRyxjQUFPLENBQUMsV0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBSXpELGtCQUFhLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFJOUIsa0JBQWEsR0FBRyxHQUFHLENBQUM7UUFJcEIseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBTzVCLElBQUksUUFBTyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsVUFBVSxDQUFBLEtBQUssV0FBVztZQUM3QyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFdEMsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsY0FBYztZQUFFLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUUxRSxJQUFJLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxhQUFhO1lBQUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBRXZFLElBQUksT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGFBQWE7WUFBRSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUM7UUFFdkUsSUFBSSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsb0JBQW9CO1lBQ2hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUM7UUFFMUQsV0FBVyxDQUFDLEdBQUcsRUFBRTtZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDNUMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU87b0JBQ3hDLElBQUksQ0FBQyxTQUFTO3lCQUNaLE1BQU0sQ0FDTixDQUFDLENBQUMsRUFBRTs7d0JBQ0gsT0FBQSxDQUFDLENBQUMsS0FBSyxLQUFLLFVBQVU7NEJBQ3RCLENBQUMsT0FBQSxDQUFDLENBQUMsT0FBTywwQ0FBRSxJQUFJLEVBQ2YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7Z0NBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM1QztnQ0FDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUN4RCxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7cUJBQUEsQ0FDVDt5QkFDQSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDWixDQUFDLENBQUMsUUFBUSxDQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNyQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxJQUFJLENBQ3ZELENBQ0QsQ0FBQzthQUNKO1FBQ0YsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV2QixJQUFJLElBQUksQ0FBQyxVQUFVO1lBQUUsT0FBTztRQUU1QixJQUFJLENBQUMsZUFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7WUFBRSxjQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQ2hFO1lBQ0osTUFBTSxZQUFZLEdBQUcsZ0JBQVcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFdEQsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDMUIsSUFBSTtvQkFDSCxJQUFJLElBQUksR0FBZSxJQUFJLENBQUMsS0FBSyxDQUNoQyxpQkFBWSxDQUFDLFdBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FDN0QsQ0FBQztvQkFFRixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHO3dCQUN6QixJQUFJO3dCQUNKLE9BQU8sRUFBRSxRQUFRLENBQ2hCLGlCQUFZLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUNoRTtxQkFDRCxDQUFDO2lCQUNGO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNiLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO3dCQUM5QixXQUFNLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUN6RCxXQUFNLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO3dCQUM1RCxVQUFLLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ2hEO2lCQUNEO1lBQ0YsQ0FBQyxDQUFDLENBQUM7U0FDSDtJQUNGLENBQUM7SUFRRCxHQUFHLENBQUMsSUFBWSxFQUFFLElBQVMsRUFBRSxVQUFrQixJQUFJLENBQUMsYUFBYTtRQUNoRSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDO2FBQ3ZFO1lBQ0osSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRztnQkFDMUIsSUFBSTtnQkFDSixPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLE9BQU87YUFDN0IsQ0FBQztTQUNGO1FBRUQsSUFBSSxDQUFDLFNBQVM7YUFDWixNQUFNLENBQ04sQ0FBQyxDQUFDLEVBQUU7O1lBQ0gsT0FBQSxDQUFDLENBQUMsS0FBSyxLQUFLLFFBQVE7Z0JBQ3BCLENBQUMsT0FBQSxDQUFDLENBQUMsT0FBTywwQ0FBRSxJQUFJLEVBQ2YsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7b0JBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDO29CQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssSUFBSTtvQkFDMUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQUEsQ0FDVDthQUNBLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNaLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxJQUFJLENBQUMsVUFBVTtZQUFFLE9BQU87UUFFNUIsSUFBSSxDQUFDLGVBQVUsQ0FBQyxXQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQyxjQUFTLENBQUMsV0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUU1QyxrQkFBYSxDQUNaLFdBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsRUFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUM5QixDQUFDO1FBQ0Ysa0JBQWEsQ0FDWixXQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQzFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FDbEIsQ0FBQztJQUNILENBQUM7SUFNRCxHQUFHLENBQUMsSUFBWTs7UUFDZixhQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLDBDQUFFLElBQUksQ0FBQztJQUN2QyxDQUFDO0lBTUQsU0FBUyxDQUFDLElBQVk7UUFDckIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztZQUM5QixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTztZQUMvQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ1QsQ0FBQztJQUtELElBQUk7UUFDSCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFLRCxNQUFNO1FBQ0wsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBS0QsT0FBTztRQUNOLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQVFELEVBQUUsQ0FDRCxLQUE0QixFQUM1QixRQUE0QyxFQUM1QyxPQUE4QjtRQUU5QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQ0Q7QUFyTUQsK0JBcU1DIn0=