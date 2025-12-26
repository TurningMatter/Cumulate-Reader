const { CONFIG, BROWSER_HEADERS } = require('./config');
const { getBrowser } = require('./browser');

async function fetchDirect(url, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

async function fetchWithBrowser(url, options = {}) {
  const { 
    timeout = CONFIG.BROWSER_TIMEOUT,
    waitForSelector = null,
    waitMs = 1500,
  } = options;

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: BROWSER_HEADERS['User-Agent'],
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  
  const page = await context.newPage();
  
  try {
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
      
      if (blockedTypes.includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout,
    });

    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 5000 });
      } catch {}
    }

    await page.waitForTimeout(waitMs);

    await page.evaluate(async () => {
      const delay = ms => new Promise(r => setTimeout(r, ms));
      const step = window.innerHeight;
      let scrolled = 0;
      const max = Math.min(document.body.scrollHeight, step * 5);
      
      while (scrolled < max) {
        window.scrollBy(0, step);
        scrolled += step;
        await delay(50);
      }
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(500);

    const html = await page.evaluate(() => {
      function extractShadowContent(root) {
        const elements = root.querySelectorAll('*');
        elements.forEach(el => {
          if (el.shadowRoot) {
            const shadowContent = el.shadowRoot.innerHTML;
            el.innerHTML = shadowContent + el.innerHTML;
          }
        });
      }
      
      extractShadowContent(document);
      return document.documentElement.outerHTML;
    });

    return html;
  } finally {
    await context.close();
  }
}

module.exports = { fetchDirect, fetchWithBrowser };
