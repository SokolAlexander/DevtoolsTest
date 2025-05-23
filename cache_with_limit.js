class SimpleCache {
    constructor(limit = 100) {
      this.limit = limit;
      this.map = new Map(); // Keeps insertion order
    }
  
    get(key) {
      if (!this.map.has(key)) return undefined;
  
      // Move the key to the end to mark it as recently used
      const value = this.map.get(key);
      this.map.delete(key);
      this.map.set(key, value);
      return value;
    }
  
    set(key, value) {
      if (this.map.has(key)) {
        // Remove to re-insert and update usage order
        this.map.delete(key);
      } else if (this.map.size >= this.limit) {
        // Remove the least recently used (first inserted)
        const oldestKey = this.map.keys().next().value;
        this.map.delete(oldestKey);
      }
  
      this.map.set(key, value);
    }
  
    has(key) {
      return this.map.has(key);
    }
  
    delete(key) {
      return this.map.delete(key);
    }
  
    clear() {
      this.map.clear();
    }
  }
  