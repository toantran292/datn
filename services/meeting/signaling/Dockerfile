FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm i --prod
COPY . .
RUN pnpm build || true
ENV PORT_HTTP=40600 PORT_WS=40601
EXPOSE 40600 40601
CMD ["node", "dist/src/main.js"]
