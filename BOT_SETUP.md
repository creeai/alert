# 🤖 Configuração do Bot Telegram

## ⚠️ **IMPORTANTE:**
A aplicação **NÃO funciona** sem um `TELEGRAM_BOT_TOKEN` no EasyPanel!

## 📋 **Passo a Passo:**

### 1. **Criar um Bot no Telegram:**
1. Abra o Telegram
2. Procure por `@BotFather`
3. Envie `/newbot`
4. Escolha um nome para seu bot (ex: "Meu Bridge Bot")
5. Escolha um username (ex: "meu_bridge_bot")
6. **Copie o TOKEN** que aparece (formato: `123456:ABC-DEF1234567890abcdef1234567890`)

### 2. **Configurar no EasyPanel:**
1. Vá para as **Variáveis de Ambiente** do seu projeto
2. Adicione/edite:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234567890abcdef1234567890
   ```
   (substitua pelo token real do seu bot)

### 3. **Reiniciar o Serviço:**
1. No EasyPanel, clique em **"Restart"** ou **"Redeploy"**
2. Aguarde o novo build
3. Verifique os logs

## ✅ **Resultado Esperado:**
```
🚀 Iniciando Telegram n8n Bridge...
🤖 Modo BOT (recomendado para EasyPanel)
✅ Bot conectado com sucesso!
📡 Escutando mensagens...
```

## ❌ **Se ainda der erro:**
- Verifique se o `TELEGRAM_BOT_TOKEN` está correto
- Verifique se o bot foi criado corretamente
- Verifique se as outras variáveis estão configuradas:
  - `TELEGRAM_API_ID`
  - `TELEGRAM_API_HASH`
  - `N8N_WEBHOOK_URL`

## 🔗 **Links Úteis:**
- [Criar Bot com @BotFather](https://t.me/BotFather)
- [Obter API ID/Hash](https://my.telegram.org)
- [Documentação Telegram Bot API](https://core.telegram.org/bots/api)
