class Cache {
  constructor() {
    this.cacheMap = {};
  }

  save(key, value) {
    this.cacheMap[key] = value;
  }

  get(key) {
    return this.cacheMap[key];
  }
}

module.exports = Cache;
