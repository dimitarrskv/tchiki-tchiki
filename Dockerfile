# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY shared ./shared
COPY server ./server

# Build shared package first, then server
RUN npm run build -w shared
RUN npm run build -w server

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/server/dist ./server/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/dist/index.js"]
