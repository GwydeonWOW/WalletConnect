FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/domain/package.json packages/domain/
COPY packages/adapters/package.json packages/adapters/
COPY packages/config/package.json packages/config/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 appuser
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=deps /app/packages/adapters/node_modules ./packages/adapters/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/domain/src packages/domain/src
COPY packages/domain/package.json packages/domain/
COPY packages/domain/tsconfig.json packages/domain/
COPY packages/adapters/src packages/adapters/src
COPY packages/adapters/package.json packages/adapters/
COPY packages/adapters/tsconfig.json packages/adapters/
COPY packages/config/src packages/config/src
COPY packages/config/package.json packages/config/
COPY packages/config/tsconfig.json packages/config/
COPY apps/api/src apps/api/src
COPY apps/api/package.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/prisma apps/api/prisma
USER appuser
EXPOSE 3001
CMD ["npx", "tsx", "apps/api/src/server.ts"]
