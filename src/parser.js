const { parseHTML } = require('linkedom');
const { Readability } = require('@mozilla/readability');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');
const { CONFIG } = require('./config');
const { countTokens } = require('./tokens');

function createTurndownService(options = {}) {
  const { removeSelectors = [] } = options;
  
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '_',
    strongDelimiter: '**',
  });
  td.use(gfm);
  const baseRemove = ['script', 'style', 'noscript', 'svg', 'canvas'];
  td.remove([...baseRemove, ...removeSelectors]);
  
  return td;
}

function parseAndExtract(html, url, options = {}) {
  const {
    targetSelector = null,
    removeSelectors = [],
    includeLinks = false,
    includeImages = false,
    fullContent = false,
  } = options;

  const { document } = parseHTML(html);

  const title = document.querySelector('title')?.textContent?.trim() || '';
  const description = document.querySelector('meta[name="description"]')?.content || 
                      document.querySelector('meta[property="og:description"]')?.content || '';
  const author = document.querySelector('meta[name="author"]')?.content || 
                 document.querySelector('meta[property="article:author"]')?.content || '';
  const publishedTime = document.querySelector('meta[property="article:published_time"]')?.content || '';
  const siteName = document.querySelector('meta[property="og:site_name"]')?.content || '';

  const alwaysRemove = ['script', 'style', 'noscript', 'svg', 'canvas', 'iframe[src*="ads"]', '[hidden]', '[aria-hidden="true"]'];
  [...alwaysRemove, ...removeSelectors].forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => el.remove());
    } catch {}
  });

  let contentHtml = '';
  let articleTitle = title;
  let articleByline = author;
  let articleExcerpt = '';

  if (targetSelector) {
    const target = document.querySelector(targetSelector);
    if (target) {
      contentHtml = target.innerHTML;
    }
  }

  if (!contentHtml && fullContent) {
    const body = document.querySelector('body');
    if (body) {
      ['.ad', '.ads', '.advertisement', '[data-ad]', '.cookie-banner', '.popup'].forEach(sel => {
        try {
          body.querySelectorAll(sel).forEach(el => el.remove());
        } catch {}
      });
      contentHtml = body.innerHTML;
      articleExcerpt = description;
    }
  }

  if (!contentHtml) {
    try {
      const reader = new Readability(document, {
        charThreshold: 50,
      });
      const article = reader.parse();
      
      if (article && article.content) {
        contentHtml = article.content;
        articleTitle = article.title || title;
        articleByline = article.byline || author;
        articleExcerpt = article.excerpt || '';
      }
    } catch {}
  }

  if (!contentHtml) {
    const body = document.querySelector('body');
    if (body) {
      ['aside', '.sidebar', '.ad', '.ads', '.advertisement'].forEach(sel => {
        try {
          body.querySelectorAll(sel).forEach(el => el.remove());
        } catch {}
      });
      contentHtml = body.innerHTML;
    }
  }

  if (!contentHtml) {
    throw new Error('No content found');
  }

  let links = {};
  if (includeLinks) {
    const { document: contentDoc } = parseHTML(`<div>${contentHtml}</div>`);
    contentDoc.querySelectorAll('a[href]').forEach(a => {
      const text = a.textContent?.trim();
      const href = a.getAttribute('href');
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, url).href;
          links[text] = absoluteUrl;
        } catch {}
      }
    });
  }

  let images = {};
  if (includeImages) {
    const { document: contentDoc } = parseHTML(`<div>${contentHtml}</div>`);
    contentDoc.querySelectorAll('img[src]').forEach((img, i) => {
      const alt = img.getAttribute('alt') || `Image ${i + 1}`;
      const src = img.getAttribute('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).href;
          images[alt] = absoluteUrl;
        } catch {}
      }
    });
  }

  const td = createTurndownService({ removeSelectors });
  let markdown = td.turndown(contentHtml);

  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  if (markdown.length > CONFIG.MAX_CONTENT_LENGTH) {
    markdown = markdown.slice(0, CONFIG.MAX_CONTENT_LENGTH) + '\n\n[Content truncated...]';
  }

  const tokens = countTokens(markdown);

  return {
    title: articleTitle,
    description,
    author: articleByline,
    publishedTime,
    siteName,
    content: markdown,
    excerpt: articleExcerpt,
    links: includeLinks ? links : undefined,
    images: includeImages ? images : undefined,
    usage: { tokens },
  };
}

module.exports = { parseAndExtract };
