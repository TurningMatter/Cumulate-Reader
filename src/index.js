const express = require('express');
const { CONFIG } = require('./config');
const { closeBrowser } = require('./browser');
const { cleanup: cleanupTokens } = require('./tokens');
const { authMiddleware } = require('./auth');
const { setupRoutes } = require('./routes');
const { RateLimiter, rateLimitMiddleware, securityHeadersMiddleware } = require('./security');

const app = express();

app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '1mb' }));

const limiter = new RateLimiter(60000, 100);
app.use(rateLimitMiddleware(limiter));

app.use(authMiddleware);

setupRoutes(app);

process.on('SIGINT', async () => {
  await closeBrowser();
  cleanupTokens();
  process.exit();
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  cleanupTokens();
  process.exit();
});

app.listen(CONFIG.PORT, '0.0.0.0', () => {
  console.log(`[Reader v2.0] Service running on port ${CONFIG.PORT}`);
  console.log(`[Reader v2.0] Default engine: ${CONFIG.DEFAULT_ENGINE}`);
  console.log(`[Reader v2.0] Cache: ${CONFIG.CACHE_MAX_SIZE} items, ${CONFIG.CACHE_TTL / 1000}s TTL`);
  console.log(`[Reader v2.0] Auth: ${CONFIG.API_KEY ? 'enabled' : 'disabled'}`);
});
