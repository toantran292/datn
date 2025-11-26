# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
RUN corepack enable
COPY package.json ./
RUN pnpm install

FROM deps AS build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY dist ./dist
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
CMD ["node", "dist/main.js"]
