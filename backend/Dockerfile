FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 bancalais && \
    adduser --system --uid 1001 bancalais
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/migrations ./migrations
RUN mkdir -p uploads/clubs && chown -R bancalais:bancalais uploads
USER bancalais
EXPOSE 4000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:4000/api/health',r=>process.exit(r.statusCode===200?0:1))" || exit 1
CMD ["node", "dist/index.js"]
