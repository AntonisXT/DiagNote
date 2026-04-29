# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time.
# Pass them as build args in docker-compose (see docker-compose.yml).
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# FASTAPI_URL is captured by next.config.ts rewrites() at build time.
# Inside the Docker network the backend service is reachable at http://backend:8000.
ARG FASTAPI_URL=http://backend:8000
ENV FASTAPI_URL=$FASTAPI_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 2: production runtime ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# next start needs the compiled output, dependencies, and the config file
COPY --from=builder /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules     ./node_modules
COPY --from=builder /app/package.json     ./package.json
COPY --from=builder /app/next.config.ts   ./next.config.ts
COPY --from=builder /app/tsconfig.json    ./tsconfig.json

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["npm", "start"]
