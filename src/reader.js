const { CONFIG } = require('./config');
const { cache } = require('./cache');
const { fetchDirect, fetchWithBrowser } = require('./fetcher');
const { parseAndExtract } = require('./parser');

async function urlToMarkdown(url, options = {}) {
  const {
    engine = CONFIG.DEFAULT_ENGINE,
    noCache = false,
    targetSelector = null,
    removeSelectors = [],
    waitForSelector = null,
    includeLinks = false,
    includeImages = false,
    fullContent = false,
    timeout = null,
  } = options;

  const startTime = Date.now();

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw new Error('Invalid URL');
  }

  const cacheKey = `${engine}:${url}:${targetSelector || ''}:${removeSelectors.join(',')}`;
  if (!noCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        processingTime: Date.now() - startTime,
      };
    }
  }

  let html;
  if (engine === 'browser') {
    html = await fetchWithBrowser(url, {
      timeout: timeout || CONFIG.BROWSER_TIMEOUT,
      waitForSelector,
    });
  } else {
    html = await fetchDirect(url, timeout || CONFIG.DIRECT_TIMEOUT);
  }

  const result = parseAndExtract(html, url, {
    targetSelector,
    removeSelectors,
    includeLinks,
    includeImages,
    fullContent,
  });

  const response = {
    url,
    ...result,
    engine,
    cached: false,
    processingTime: Date.now() - startTime,
  };

  if (!noCache) {
    cache.set(cacheKey, response);
  }

  return response;
}

module.exports = { urlToMarkdown };
