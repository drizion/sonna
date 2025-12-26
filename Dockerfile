# Build stage
FROM node:18-alpine AS builder

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared first (dependency for client and server)
RUN npm run build --workspace=shared

# Build server and client  
RUN npm run build --workspace=server
RUN npm run build --workspace=client

# Create node_modules structure for shared package runtime resolution
RUN mkdir -p node_modules/@music-downloader && \
    ln -s /app/shared node_modules/@music-downloader/shared

# Production stage
FROM node:18-alpine

# Install FFmpeg for runtime
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install only production dependencies
RUN npm ci --workspace=server --workspace=shared --omit=dev

# Copy built files from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Copy shared files (src for dev, dist for runtime, package.json)
COPY --from=builder /app/shared/src ./shared/src
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/

# Create symlink for module resolution
RUN mkdir -p node_modules/@music-downloader && \
    ln -s /app/shared node_modules/@music-downloader/shared

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server/dist/server/src/index.js"]
