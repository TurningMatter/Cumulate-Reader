# Cumulate Reader

High-performance URL to Markdown converter for LLMs. Self-hosted, fast, and optimized for AI applications.

## Features

- **Dual Engine** - Fast direct fetch for static pages, headless browser for JS-rendered SPAs
- **10x Faster Parsing** - Uses linkedom instead of JSDOM
- **LRU Caching** - Instant responses for repeated requests
- **Token Counting** - Built-in tiktoken for LLM token budgets
- **CSS Selectors** - Target specific elements, remove unwanted content
- **Full Page Mode** - Capture entire page structure including navigation
- **Shadow DOM Support** - Extracts content from web components

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers (for JS rendering)
npx playwright install chromium

# Start server
npm start
```

## Usage

### Basic Request
```bash
# Simple fetch (fast, static pages)
curl http://localhost:4041/example.com

# With protocol
curl http://localhost:4041/https://example.com
```

### JavaScript-Rendered Pages
```bash
# Use browser engine for SPAs (React, Vue, etc.)
curl "http://localhost:4041/myapp.com?engine=browser"
```

### Full Page Mode
```bash
# Keep nav, header, footer (skip Readability extraction)
curl "http://localhost:4041/openai.com?engine=browser&full=1"
```

### CSS Selectors
```bash
# Extract specific element
curl "http://localhost:4041/site.com?target=article.main"

# Remove elements
curl "http://localhost:4041/site.com?remove=nav,footer,.ads"

# Wait for element (browser mode)
curl "http://localhost:4041/site.com?engine=browser&wait=.content"
```

### Include Links & Images
```bash
curl "http://localhost:4041/site.com?links=1&images=1"
```

### JSON Response
```bash
curl -H "Accept: application/json" http://localhost:4041/example.com
```

### POST Request
```bash
curl -X POST http://localhost:4041/ \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "engine": "browser", "full": true}'
```

## Query Parameters

| Parameter | Description |
|-----------|-------------|
| `engine` | `direct` (fast, default) or `browser` (JS rendering) |
| `full` | Skip Readability, keep full page structure |
| `target` | CSS selector to extract specific element |
| `remove` | CSS selectors to remove (comma-separated) |
| `wait` | CSS selector to wait for (browser mode) |
| `links` | Include links summary in response |
| `images` | Include images summary in response |
| `nocache` | Bypass cache for fresh content |
| `timeout` | Custom timeout in milliseconds |

## Authentication

Set `API_KEY` environment variable to enable bearer token authentication:

```bash
API_KEY=your-secret-key npm start
```

All requests (except `/health`) require the `Authorization` header:

```bash
curl -H "Authorization: Bearer your-secret-key" http://localhost:4041/example.com
```

If `API_KEY` is not set, authentication is disabled.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4041 | Server port |
| `API_KEY` | null | Bearer token for auth (disabled if not set) |
| `DEFAULT_ENGINE` | direct | Default fetch engine |
| `DIRECT_TIMEOUT` | 10000 | Direct fetch timeout (ms) |
| `BROWSER_TIMEOUT` | 15000 | Browser fetch timeout (ms) |
| `MAX_CONTENT_LENGTH` | 100000 | Max content length (chars) |
| `CACHE_MAX_SIZE` | 100 | Max cached URLs |
| `CACHE_TTL` | 300000 | Cache TTL (ms, default 5min) |

## API Endpoints

### `GET /health`
Health check with cache stats.

### `POST /cache/clear`
Clear the URL cache.

### `GET /:url`
Fetch and convert URL to markdown.

### `POST /`
Fetch URL from request body.

## Response Format

```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Meta description",
    "author": "Author Name",
    "publishedTime": "2025-01-01T00:00:00Z",
    "siteName": "Example Site",
    "content": "# Markdown content...",
    "excerpt": "Brief excerpt",
    "links": { "Link Text": "https://..." },
    "images": { "Alt Text": "https://..." },
    "usage": { "tokens": 1234 },
    "engine": "direct",
    "cached": false,
    "processingTime": 234
  }
}
```

## Docker

```bash
# Build
docker build -t cumulate-reader .

# Run
docker run -p 4041:4041 cumulate-reader

# With environment variables
docker run -p 4041:4041 \
  -e DEFAULT_ENGINE=browser \
  -e CACHE_MAX_SIZE=200 \
  cumulate-reader
```

## Performance

| Mode | Typical Speed | Use Case |
|------|---------------|----------|
| Direct | ~0.5-1s | Static HTML pages |
| Browser | ~3-5s | JS-rendered SPAs |
| Cached | ~10ms | Repeated requests |

## Tech Stack

- **Express** - HTTP server
- **Playwright** - Headless browser for JS rendering
- **linkedom** - Fast DOM parsing
- **@mozilla/readability** - Content extraction
- **Turndown** - HTML to Markdown conversion
- **tiktoken** - Token counting for LLMs
- **lru-cache** - Request caching

## License

MIT
