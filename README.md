# Cache

**Simple** yet **powerful** cache used by [PreMiD](https://premid.app).

## Why?

Caching is one of the most **important** things to do in production; futhermore, preventing your databases from getting bombarded with requests or to cache results from an API which only allows a certain amount of requests.

## Installation

```bash
# npm
$ npm i Timeraa/Cache

# yarn
$ yarn add Timeraa/Cache
```

## Usage

### Creating a "CacheManager"

A CacheManager is the main entry to access, set and listen to events from the cache.

```TypeScript
  cacheManager = new CacheManager(options?);
```

The CacheManager has a set of options that can be changed:

| Option          | Type      | Default Value          | Description                                                                                                              |
| --------------- | --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| memoryOnly?     | `boolean` | true                   | Whether or not the cache is stored in memory (RAM) only or should be saved to a file as well as an redundancy measure. |
| cacheDirectory? | `string`  | \_\_dirname + .cache   | Allows to change the default cache folder that's used to load and save the cache.                                        |
| defaultExpire?  | `number`  | 300000 (5 minutes)     | Changes the default time in miliseconds when cache is considered outdated.                                             |
| checkInterval?  | `number`  | 250 (4 times a second) | Changes the default checkInterval to check for outdated caches.                                                          |

### Listening to cache events

```TypeScript
  //* Emitted when the cache is updated
  cacheManager.on(event: "update", listener: Function<name:string, data:any>)

  //* Emitted when the cache is outdated
  cacheManager.on(event: "outdated", listener: Function<name:string, data:any>)
```

### Setting a cache

```TypeScript
cacheManager.set(name: string, data: any, expires?: number)
```

### Getting a cache

```TypeScript
cacheManager.get(name: string)
```

### Checking if a cache expired

```TypeScript
cacheManager.isExpired(name: string)
```

### Returns all set keys of the cache

```TypeScript
cacheManager.keys()
```

### Returns all set values of the cache

```TypeScript
cacheManager.values()
```
