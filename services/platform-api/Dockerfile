FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts

ENV NODE_ENV=production \
    PORT=8080 \
    DB_PATH=/data/platform.db \
    DEPOT_DIR=/data/depot

RUN mkdir -p /data && chown -R node:node /data /app
USER node

VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

CMD ["npx", "tsx", "src/index.ts"]
