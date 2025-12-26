function parseBool(value) {
  return value === 'true' || value === '1' || value === true;
}

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

module.exports = { parseBool, parseArray };
