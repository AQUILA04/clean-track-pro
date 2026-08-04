# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Corporate proxy (Zscaler) — trust root CA during npm install
COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN printf '\n' >> /etc/ssl/certs/ca-certificates.crt \
    && cat /usr/local/share/ca-certificates/ZscalerRootCA.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCA.crt
ENV NPM_CONFIG_CAFILE=/etc/ssl/certs/ca-certificates.crt
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN printf '\n' >> /etc/ssl/certs/ca-certificates.crt \
    && cat /usr/local/share/ca-certificates/ZscalerRootCA.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCA.crt
ENV NPM_CONFIG_CAFILE=/etc/ssl/certs/ca-certificates.crt
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined at build time; server vars needed for Next.js route analysis
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG KEYCLOAK_CLIENT_ID=cleantrack-client
ARG KEYCLOAK_CLIENT_SECRET=cleantrack-dev-secret
ARG KEYCLOAK_ISSUER=http://localhost:8080/realms/cleantrack
ARG NEXTAUTH_URL=http://localhost:3001
ARG NEXTAUTH_SECRET=cleantrack-dev-nextauth-secret-min-32-chars
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
ENV KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET
ENV KEYCLOAK_ISSUER=$KEYCLOAK_ISSUER
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1

COPY --from=certs ZscalerRootCA.pem /usr/local/share/ca-certificates/ZscalerRootCA.crt
RUN printf '\n' >> /etc/ssl/certs/ca-certificates.crt \
    && cat /usr/local/share/ca-certificates/ZscalerRootCA.crt >> /etc/ssl/certs/ca-certificates.crt
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/ZscalerRootCA.crt

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3001
ENV PORT=3001
CMD ["npm", "run", "start"]
