FROM python:3.11-slim

WORKDIR /app

# Evita bytecode e flush imediato de logs
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

# Dependências do sistema (se precisar de SSL/ca-certs, timezone, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências primeiro (para cache do Docker)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Pasta para sessão do Telethon (persistente via volume)
RUN mkdir -p /app/session
VOLUME ["/app/session"]

# Usuário não-root para segurança
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

CMD ["python", "main.py"]