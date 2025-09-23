# Deploy no EasyPanel - Telegram n8n Bridge

Este guia explica como fazer o deploy da aplicação Telegram n8n Bridge no EasyPanel.

## 📋 Pré-requisitos

1. **Conta no Telegram API**: Obtenha `API_ID` e `API_HASH` em https://my.telegram.org
2. **Bot Token (opcional)**: Crie um bot com @BotFather no Telegram
3. **URL do webhook n8n**: Configure um webhook no seu n8n
4. **EasyPanel configurado**: Tenha acesso ao seu painel EasyPanel

## 🚀 Deploy no EasyPanel

### Passo 1: Preparar as Variáveis de Ambiente

Copie o arquivo `env.example` e configure as variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Obrigatórias
TELEGRAM_API_ID=seu_api_id_aqui
TELEGRAM_API_HASH=seu_api_hash_aqui
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/telegram_in?secret=XYZ

# Opcionais
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui  # Se quiser usar como bot
ALLOW_CHATS=*                          # * para todos, ou IDs específicos
FORWARD_MEDIA=true                     # true/false para encaminhar mídia
```

### Passo 2: Deploy via EasyPanel

1. **Acesse seu EasyPanel**
2. **Crie um novo projeto**
3. **Selecione "Docker Compose"**
4. **Cole o conteúdo do arquivo `easypanel.yml`**
5. **Configure as variáveis de ambiente** usando o arquivo `.env` ou diretamente no painel
6. **Deploy!**

### Passo 3: Configuração das Variáveis no EasyPanel

No painel do EasyPanel, configure as seguintes variáveis de ambiente:

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `TELEGRAM_API_ID` | ✅ | ID da API do Telegram | `123456` |
| `TELEGRAM_API_HASH` | ✅ | Hash da API do Telegram | `abcdef1234567890...` |
| `N8N_WEBHOOK_URL` | ✅ | URL do webhook n8n | `https://n8n.com/webhook/telegram` |
| `TELEGRAM_BOT_TOKEN` | ❌ | Token do bot (opcional) | `123456:ABC-DEF...` |
| `ALLOW_CHATS` | ❌ | Chats permitidos | `*` ou `-1001234567890,111111111` |
| `FORWARD_MEDIA` | ❌ | Encaminhar mídia | `true` ou `false` |

## 🔧 Configurações Avançadas

### Usando como Bot vs Conta de Usuário

**Como Bot (recomendado):**
- Defina `TELEGRAM_BOT_TOKEN`
- Mais seguro e estável
- Não precisa de login manual

**Como Conta de Usuário:**
- Não defina `TELEGRAM_BOT_TOKEN`
- Precisa fazer login na primeira execução
- Mais funcionalidades disponíveis

### Filtros de Chat

- `ALLOW_CHATS=*`: Permite todos os chats
- `ALLOW_CHATS=-1001234567890,111111111`: Apenas chats específicos
- IDs de supergrupos/canais geralmente começam com `-100`

### Encaminhamento de Mídia

- `FORWARD_MEDIA=true`: Encaminha mídias até 8MB
- `FORWARD_MEDIA=false`: Não encaminha mídias
- Mídias grandes são automaticamente ignoradas

## 📊 Monitoramento

A aplicação inclui:
- **Healthcheck**: Verifica se a aplicação está funcionando
- **Logs estruturados**: Para debug e monitoramento
- **Volume persistente**: Para sessão do Telegram

## 🔍 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**: Verifique `API_ID` e `API_HASH`
2. **Webhook não funciona**: Verifique `N8N_WEBHOOK_URL`
3. **Sessão perdida**: O volume `/app/session` deve ser persistente
4. **Mídia não encaminha**: Verifique `FORWARD_MEDIA=true` e tamanho do arquivo

### Logs

Para ver os logs da aplicação:
```bash
# Via EasyPanel
# Acesse a aba "Logs" do seu projeto

# Via Docker (se necessário)
docker logs telegram-n8n-bridge
```

## 📝 Formato dos Dados Enviados ao n8n

A aplicação envia JSON com a seguinte estrutura:

```json
{
  "message_id": 123,
  "date": "2025-01-23T20:10:00+00:00",
  "chat_id": 111111111,
  "chat_type": "private",
  "sender_id": 222222222,
  "sender_username": "usuario",
  "text": "Mensagem de texto",
  "has_media": false,
  "raw": {
    "reply_to_msg_id": null,
    "fwd_from": false,
    "via_bot_id": null,
    "entities": []
  }
}
```

Se `FORWARD_MEDIA=true` e houver mídia pequena, o arquivo será enviado como `multipart/form-data` no campo `file`, com o JSON acima no campo `payload`.

## 🎯 Próximos Passos

1. Configure seu webhook no n8n para receber os dados
2. Teste enviando uma mensagem no Telegram
3. Verifique se os dados chegam no n8n
4. Configure seus workflows no n8n conforme necessário

---

**Nota**: Este bridge é otimizado para o EasyPanel e inclui todas as configurações necessárias para um deploy bem-sucedido.
