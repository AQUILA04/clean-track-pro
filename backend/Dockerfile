# Stage 1: Build NestJS app
FROM node:20-alpine AS builder
WORKDIR /app

# Corporate proxy (Zscaler) — trust root CA during npm install / build
COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN printf '\n' >> /etc/ssl/certs/ca-certificates.crt \
    && cat /usr/local/share/ca-certificates/ZscalerRootCA.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCA.crt
ENV NPM_CONFIG_CAFILE=/etc/ssl/certs/ca-certificates.crt

COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN rm -rf dist *.tsbuildinfo && npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN printf '\n' >> /etc/ssl/certs/ca-certificates.crt \
    && cat /usr/local/share/ca-certificates/ZscalerRootCA.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCA.crt

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -S app && adduser -S app -G app
RUN mkdir -p /app/uploads && chown -R app:app /app
USER app

EXPOSE 3000
ENV PORT=3000
CMD ["node", "dist/main"]
