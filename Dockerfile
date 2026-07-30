FROM node:22-alpine AS deps
WORKDIR /app

COPY package-lock.json package.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NUXT_CONTROL_API_BASE_URL=http://control-api-service:3021/api/v1
ENV NUXT_CONTROL_API_BASE_URL=${NUXT_CONTROL_API_BASE_URL}

RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    apk --no-cache add dumb-init

COPY --from=builder --chown=appuser:appgroup /app/.output ./.output

USER appuser

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
