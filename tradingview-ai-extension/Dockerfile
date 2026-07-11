# ─── Build Stage ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files into /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

# Copy backend TypeScript source
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

# Build
RUN npm run build

# ─── Production Stage ──────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY backend/package.json ./

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health > /dev/null 2>&1 || exit 1

CMD ["node", "dist/server.js"]
