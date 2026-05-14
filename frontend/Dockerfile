# --- Dependencies stage ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
# lockfile은 의도적으로 무시하고 매번 install. 해커톤 데모에서 락 일치성보다 빌드 안정성 우선.
RUN npm install --no-audit --no-fund

# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 타임 환경변수 (정적 번들에 박힌다)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone 빌드 결과만 복사 → 이미지 크기 ↓
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
