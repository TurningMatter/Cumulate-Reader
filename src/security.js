const net = require('net');

const BLOCKED_IP_RANGES = [
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
  { start: '0.0.0.0', end: '0.255.255.255' },
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
  'metadata.google.internal',
  '169.254.169.254',
];

function ipToLong(ip) {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isPrivateIP(ip) {
  if (!net.isIPv4(ip)) {
    if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
      return true;
    }
    return false;
  }

  const ipLong = ipToLong(ip);
  
  for (const range of BLOCKED_IP_RANGES) {
    const startLong = ipToLong(range.start);
    const endLong = ipToLong(range.end);
    
    if (ipLong >= startLong && ipLong <= endLong) {
      return true;
    }
  }
  
  return false;
}

async function validateUrl(urlString) {
  let parsedUrl;
  
  try {
    parsedUrl = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error('Access to internal resources is not allowed');
  }

  try {
    const { promises: dns } = require('dns');
    const addresses = await dns.resolve4(hostname).catch(() => []);
    
    for (const ip of addresses) {
      if (isPrivateIP(ip)) {
        throw new Error('Access to internal resources is not allowed');
      }
    }
  } catch (err) {
    if (err.message.includes('internal')) {
      throw err;
    }
    if (net.isIP(hostname)) {
      if (isPrivateIP(hostname)) {
        throw new Error('Access to internal resources is not allowed');
      }
    }
  }

  return parsedUrl;
}

function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  const lenA = Buffer.byteLength(a);
  const lenB = Buffer.byteLength(b);
  
  const bufA = Buffer.alloc(Math.max(lenA, lenB));
  const bufB = Buffer.alloc(Math.max(lenA, lenB));
  
  Buffer.from(a).copy(bufA);
  Buffer.from(b).copy(bufB);
  
  let result = lenA ^ lenB;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  
  return result === 0;
}

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
    
    setInterval(() => this.cleanup(), 60000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests) {
      if (now - data.windowStart > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  isAllowed(identifier) {
    const now = Date.now();
    const data = this.requests.get(identifier);

    if (!data || now - data.windowStart > this.windowMs) {
      this.requests.set(identifier, { windowStart: now, count: 1 });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (data.count >= this.maxRequests) {
      const retryAfter = Math.ceil((data.windowStart + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }

    data.count++;
    return { allowed: true, remaining: this.maxRequests - data.count };
  }
}

function rateLimitMiddleware(limiter) {
  return (req, res, next) => {
    if (req.path === '/health') {
      return next();
    }

    const identifier = req.ip || req.connection.remoteAddress || 'unknown';
    const result = limiter.isAllowed(identifier);

    res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}

function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
}

module.exports = {
  validateUrl,
  secureCompare,
  RateLimiter,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  isPrivateIP,
};
