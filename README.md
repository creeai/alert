# Telegram → n8n Webhook Bridge (Telethon)

Aplicação simples em Python usando **Telethon** para receber mensagens do Telegram
e reenviar para um **webhook do n8n**.

## 🚀 Deploy Rápido no EasyPanel

### Opção 1: Deploy via Git + Nixpacks (Recomendado)

1. **Faça fork deste repositório**
2. **Configure as variáveis de ambiente** no EasyPanel:
   - `TELEGRAM_API_ID`: Seu API ID do Telegram
   - `TELEGRAM_API_HASH`: Seu API Hash do Telegram  
   - `N8N_WEBHOOK_URL`: URL do webhook do n8n
   - `TELEGRAM_BOT_TOKEN`: (opcional) Token do bot
   - `ALLOW_CHATS`: (opcional) Chats permitidos
   - `FORWARD_MEDIA`: (opcional) Encaminhar mídia

3. **No EasyPanel:**
   - Crie um novo projeto
   - Selecione "Git Repository"
   - Cole a URL do seu repositório
   - Configure as variáveis de ambiente
   - Deploy!

### Opção 2: Deploy Local

1. **Clone o repositório:**
   ```bash
   git clone <seu-repositorio>
   cd telegram_n8n_bridge
   ```

2. **Configure as variáveis:**
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

3. **Instale e execute:**
   ```bash
   pip install -r requirements.txt
   python main.py
   ```

### Opção 3: Docker

```bash
docker build -t telegram-n8n-bridge .
docker run --name tg-bridge --env-file .env -v $(pwd)/session:/app/session telegram-n8n-bridge
```

## 📋 Pré‑requisitos
- Python 3.10+ (ou use o Nixpacks no EasyPanel)
- Uma conta no Telegram e **api_id** / **api_hash** em https://my.telegram.org
- **Opcional:** um **bot token** (crie com o @BotFather)
- URL do seu webhook no n8n

## 4) O que é enviado ao n8n
Um JSON com o seguinte formato (exemplo):
```json
{
  "message_id": 123,
  "date": "2025-09-23T20:10:00+00:00",
  "chat_id": 111111111,
  "chat_type": "private",
  "sender_id": 222222222,
  "sender_username": "jhonatan",
  "text": "Olá mundo",
  "raw": { ... },        // trechos relevantes do objeto Telegram
  "has_media": false
}
```

Se `FORWARD_MEDIA=true` e a mídia for pequena, o arquivo segue em **multipart/form-data** no campo `file`.
O JSON acima continua sendo enviado no campo `payload` do multipart.

## 5) Filtros de chat
- `ALLOW_CHATS=*` permite tudo.
- Para permitir apenas alguns chats/grupos/canais, coloque IDs separados por vírgula, ex. `-1001234567890,111111111`.
  (IDs de supergrupos/canais geralmente começam com `-100`.)

## 6) Notas
- Para rodar como bot, defina `TELEGRAM_BOT_TOKEN`. Sem token, o cliente usa **conta de usuário** (precisa login).
- Mídias grandes não são encaminhadas (por simplicidade). Ajuste `MAX_MEDIA_BYTES` no código, se quiser.
- Use timeout e trate erros no n8n caso o webhook fique indisponível.
```