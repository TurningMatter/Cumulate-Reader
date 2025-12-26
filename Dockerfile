FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (browsers already included in base image)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install --production

# Copy source
COPY src/ ./src/

# Create non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs reader

USER reader

# Configuration
ENV PORT=4041
ENV NODE_ENV=production
ENV DEFAULT_ENGINE=direct
ENV DIRECT_TIMEOUT=10000
ENV BROWSER_TIMEOUT=15000
ENV CACHE_MAX_SIZE=100
ENV CACHE_TTL=300000

EXPOSE 4041

CMD ["node", "src/index.js"]
