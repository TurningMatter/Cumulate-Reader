const { encoding_for_model } = require('tiktoken');

let tokenEncoder = null;

function getTokenEncoder() {
  if (!tokenEncoder) {
    try {
      tokenEncoder = encoding_for_model('gpt-4');
    } catch {
      tokenEncoder = null;
    }
  }
  return tokenEncoder;
}

function countTokens(text) {
  const encoder = getTokenEncoder();
  if (!encoder) return null;
  try {
    return encoder.encode(text).length;
  } catch {
    return null;
  }
}

function cleanup() {
  const encoder = getTokenEncoder();
  if (encoder) encoder.free();
}

module.exports = { countTokens, cleanup };
