const CONFIG = {
  PORT: parseInt(process.env.PORT || '4041'),
  DIRECT_TIMEOUT: parseInt(process.env.DIRECT_TIMEOUT || '10000'),
  BROWSER_TIMEOUT: parseInt(process.env.BROWSER_TIMEOUT || '15000'),
  MAX_CONTENT_LENGTH: parseInt(process.env.MAX_CONTENT_LENGTH || '100000'),
  CACHE_MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE || '100'),
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000'),
  DEFAULT_ENGINE: process.env.DEFAULT_ENGINE || 'direct',
  API_KEY: process.env.API_KEY || null,
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

module.exports = { CONFIG, BROWSER_HEADERS };
