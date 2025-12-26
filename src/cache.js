const { LRUCache } = require('lru-cache');
const { CONFIG } = require('./config');

const cache = new LRUCache({
  max: CONFIG.CACHE_MAX_SIZE,
  ttl: CONFIG.CACHE_TTL,
});

module.exports = { cache };
