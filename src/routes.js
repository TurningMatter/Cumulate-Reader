const { CONFIG } = require('./config');
const { cache } = require('./cache');
const { urlToMarkdown } = require('./reader');
const { formatAsMarkdown } = require('./formatter');
const { parseBool, parseArray } = require('./utils');

function setupRoutes(app) {
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'cumulate-reader',
      version: '2.0.0',
      cache: {
        size: cache.size,
        max: CONFIG.CACHE_MAX_SIZE,
      },
    });
  });

  app.post('/cache/clear', (req, res) => {
    cache.clear();
    res.json({ success: true, message: 'Cache cleared' });
  });

  app.get('/:url(*)', async (req, res) => {
    const url = req.params.url;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    const options = {
      engine: req.query.engine || (parseBool(req.query.js) ? 'browser' : CONFIG.DEFAULT_ENGINE),
      noCache: parseBool(req.query.nocache),
      targetSelector: req.query.target || null,
      removeSelectors: parseArray(req.query.remove),
      waitForSelector: req.query.wait || null,
      includeLinks: parseBool(req.query.links),
      includeImages: parseBool(req.query.images),
      fullContent: parseBool(req.query.full),
      timeout: req.query.timeout ? parseInt(req.query.timeout) : null,
    };

    try {
      const data = await urlToMarkdown(fullUrl, options);
      const accept = req.get('Accept') || '';
      
      if (accept.includes('application/json')) {
        res.json({ success: true, data });
      } else {
        res.type('text/plain').send(formatAsMarkdown(data));
      }
    } catch (error) {
      const status = error.message.includes('HTTP') ? 502 : 500;
      
      if (req.get('Accept')?.includes('application/json')) {
        res.status(status).json({
          success: false,
          error: error.message,
          url: fullUrl,
        });
      } else {
        res.status(status).type('text/plain').send(`Error: ${error.message}`);
      }
    }
  });

  app.post('/', async (req, res) => {
    const { url, engine, full, target, remove, wait, links, images, nocache, timeout, js } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL required in body' });
    }

    const options = {
      engine: engine || (js ? 'browser' : CONFIG.DEFAULT_ENGINE),
      noCache: !!nocache,
      targetSelector: target || null,
      removeSelectors: parseArray(remove),
      waitForSelector: wait || null,
      includeLinks: !!links,
      includeImages: !!images,
      fullContent: !!full,
      timeout: timeout ? parseInt(timeout) : null,
    };

    try {
      const data = await urlToMarkdown(url, options);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        url,
      });
    }
  });
}

module.exports = { setupRoutes };
