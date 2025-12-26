const { CONFIG } = require('./config');
const { secureCompare } = require('./security');

function authMiddleware(req, res, next) {
  if (!CONFIG.API_KEY) {
    return next();
  }

  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];
  if (!secureCompare(token, CONFIG.API_KEY)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = { authMiddleware };
