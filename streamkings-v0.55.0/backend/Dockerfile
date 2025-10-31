# Use Node.js LTS version
FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps                                                                                                                                                                                                                                                                                                                                                                                                                                   
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Install production dependencies only
FROM base AS prod-deps
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install OpenSSL 1.1
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Regenerate Prisma Client for the target environment
RUN npx prisma generate

USER nodejs

EXPOSE 3006

ENV PORT 3006
ENV HOSTNAME "0.0.0.0"

CMD ["node", "dist/index.js"] 

# Development image for hot reloading
FROM base AS dev
WORKDIR /app

# Install OpenSSL for development
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Generate Prisma Client for the target environment
RUN npx prisma generate

CMD ["npm", "run", "dev"] 