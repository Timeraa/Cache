# Fast Node Cache

**Simple** yet **powerful** cache used by [PreMiD](https://premid.app).

## Why?

Caching is one of the most **important** things to do in production; futhermore, preventing your databases from getting bombarded with requests or to cache results from an API which only allows a certain amount of requests.

## TODO

- Sync between workers (Sync ID's to have multiple managers)
- LRU caching strategy

## Installation

```bash
# npm
$ npm i fast-node-cache

# yarn
$ yarn add fast-node-cache
```

## Usage

### Creating a "CacheManager"

A CacheManager is the main entry to access, set and listen to events from the cache.

```TypeScript
  cacheManager = new CacheManager(options?);
```

The CacheManager has a set of options that can be changed:

| Option               | Type      | Default Value          | Description                                                                                                           |
| -------------------- | --------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| memoryOnly?          | `boolean` | true                   | Wether or not the cache is stored in memory (RAM) only or should be saved to a file as well as an redundancy measure. |
| cacheDirectory?      | `string`  | \_\_dirname + .cache   | Allows to change the default cache folder that's used to load and save the cache.                                     |
| defaultExpire?       | `number`  | 300000 (5 minutes)     | Changes the default time in miliseconds when cache is considered outdated.                                            |
| checkInterval?       | `number`  | 250 (4 times a second) | Changes the default checkInterval to check for outdated caches.                                                       |
| discardTamperedCache | `boolean` | false                  | Wether or not to delete corrupted cache on startup                                                                    |

### Listening to events

```TypeScript
  //* Emitted when the cache is updated
  cacheManager.on(event: "update", listener: Function<name:string, data:any>, options?: {only?:string[] | string})

  //* Emitted when the cache is outdated
  cacheManager.on(event: "outdated", listener: Function<name:string, data:any>, options?: {only?:string[] | string})
```

### Setting a cached object

```TypeScript
cacheManager.set(name: string, data: any, expires?: number)
```

### Getting a cached object

```TypeScript
cacheManager.get(name: string)
```

### Checking if a cached object has expired

```TypeScript
cacheManager.isExpired(name: string)
```

### Returns all keys in the cache

```TypeScript
cacheManager.keys()
```

### Returns all values in the cache

```TypeScript
cacheManager.values()
```

### Returns all entries in the cache

```TypeScript
cacheManager.entries()
```
