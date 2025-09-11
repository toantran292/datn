# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY pnpm-lock.yaml ./
COPY src ./src

RUN npm install -g pnpm@9 \
  && pnpm install --no-frozen-lockfile \
  && pnpm run build

# Stage 2: runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm install -g pnpm@9 \
  && pnpm install --prod --no-frozen-lockfile

EXPOSE 6969
CMD ["node", "dist/main.js"]