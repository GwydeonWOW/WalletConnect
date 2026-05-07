FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app

FROM base AS deps
RUN apk add --no-cache python3 build-base
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/adapters/package.json packages/adapters/
COPY packages/config/package.json packages/config/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/src packages/domain/src
COPY packages/domain/package.json packages/domain/
COPY packages/domain/tsconfig.json packages/domain/
COPY packages/ui/src packages/ui/src
COPY packages/ui/package.json packages/ui/
COPY packages/ui/tsconfig.json packages/ui/
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && npx next build

FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER appuser
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
