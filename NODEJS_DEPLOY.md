# 🚀 Deploy Node.js - Telegram n8n Bridge

## ✅ **Aplicação Convertida para Node.js!**

A aplicação foi completamente refeita em Node.js para resolver os problemas de Python/Nixpacks.

## 📁 **Arquivos Principais:**

- `index.js` - Aplicação principal em Node.js
- `package.json` - Dependências e configurações
- `Dockerfile` - Container otimizado para Node.js
- `env.example` - Template de variáveis

## 🔧 **Dependências Node.js:**

```json
{
  "telegram": "^2.19.0",     // Cliente Telegram
  "axios": "^1.6.0",         // HTTP client
  "dotenv": "^16.3.1",       // Variáveis de ambiente
  "form-data": "^4.0.0"      // Upload de arquivos
}
```

## 🚀 **Deploy no EasyPanel:**

### **Opção 1: Git Repository (Recomendado)**

1. **Acesse seu EasyPanel**
2. **Crie um novo projeto**
3. **Selecione "Git Repository"**
4. **Cole a URL:** `https://github.com/creeai/alert.git`
5. **Configure as variáveis de ambiente:**
   - `TELEGRAM_API_ID`
   - `TELEGRAM_API_HASH`
   - `N8N_WEBHOOK_URL`
   - `TELEGRAM_BOT_TOKEN` (opcional)
   - `ALLOW_CHATS` (opcional)
   - `FORWARD_MEDIA` (opcional)
6. **Deploy!**

### **Opção 2: Docker Compose**

1. **Use o arquivo `.easypanel.yml`**
2. **Configure as variáveis de ambiente**
3. **Deploy!**

## 🎯 **Vantagens da Versão Node.js:**

- ✅ **Sem problemas de Nixpacks** - Node.js é nativo no EasyPanel
- ✅ **Deploy mais rápido** - Build otimizado
- ✅ **Melhor compatibilidade** - Funciona perfeitamente
- ✅ **Logs mais claros** - Debugging mais fácil
- ✅ **Performance melhor** - Node.js é mais eficiente

## 📊 **Funcionalidades Mantidas:**

- ✅ Recebe mensagens do Telegram
- ✅ Filtra chats permitidos
- ✅ Encaminha mídia pequena
- ✅ Envia dados para n8n webhook
- ✅ Sessão persistente do Telegram
- ✅ Logs estruturados

## 🔍 **Configuração das Variáveis:**

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `TELEGRAM_API_ID` | ✅ | ID da API do Telegram | `123456` |
| `TELEGRAM_API_HASH` | ✅ | Hash da API do Telegram | `abcdef...` |
| `N8N_WEBHOOK_URL` | ✅ | URL do webhook n8n | `https://n8n.com/webhook/telegram` |
| `TELEGRAM_BOT_TOKEN` | ❌ | Token do bot (opcional) | `123456:ABC-DEF...` |
| `ALLOW_CHATS` | ❌ | Chats permitidos | `*` ou `-1001234567890,111111111` |
| `FORWARD_MEDIA` | ❌ | Encaminhar mídia | `true` ou `false` |

## 🎉 **Pronto para Deploy!**

A aplicação Node.js está pronta e deve funcionar perfeitamente no EasyPanel!

**Sem mais problemas de Python/Nixpacks!** 🚀
