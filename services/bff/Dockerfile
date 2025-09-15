# syntax=docker/dockerfile:1

FROM node:20.12.2-alpine AS base
WORKDIR /app

FROM base AS build
# Install pnpm globally
RUN npm i -g pnpm@8

# Copy lockfile and manifest first for better caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (including devDeps)
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json ./
COPY app ./app

# Build
RUN pnpm build

# Prune to prod dependencies only
RUN pnpm prune --prod

FROM base AS final
ENV NODE_ENV=production

# Copy built app and prod node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./package.json

EXPOSE 40800
CMD ["node", "dist/main.js"]

