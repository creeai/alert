FROM node:18-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    python3 \
    make \
    g++

# Copiar package.json primeiro para cache de dependências
COPY package*.json ./

# Instalar dependências com cache
RUN npm ci --only=production --no-audit --no-fund

# Copiar código da aplicação
COPY . .

# Criar pasta de sessão
RUN mkdir -p /app/session

# Usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# Expor porta
EXPOSE 3000

CMD ["npm", "start"]