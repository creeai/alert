# 🔧 Troubleshooting - EasyPanel Deploy

## Erros Comuns e Soluções

### 1. **Erro de Build/Instalação**

**Possível causa:** Dependências Python não instaladas
**Solução:**
```
# Verifique se o requirements.txt está correto
pip install telethon>=1.35.0
pip install python-dotenv>=1.0.1
pip install httpx>=0.27.0
```

### 2. **Erro de Variáveis de Ambiente**

**Possível causa:** Variáveis não configuradas
**Solução:** Configure no EasyPanel:
- `TELEGRAM_API_ID` (obrigatória)
- `TELEGRAM_API_HASH` (obrigatória)
- `N8N_WEBHOOK_URL` (obrigatória)

### 3. **Erro de Permissões**

**Possível causa:** Pasta session não criada
**Solução:** O comando `mkdir -p /app/session` deve resolver

### 4. **Erro de Conexão Telegram**

**Possível causa:** API_ID/API_HASH inválidos
**Solução:** 
- Verifique em https://my.telegram.org
- Certifique-se que os valores estão corretos

### 5. **Erro de Webhook n8n**

**Possível causa:** URL do webhook inválida
**Solução:**
- Teste a URL do webhook
- Verifique se o n8n está rodando
- Formato: `https://seu-n8n.com/webhook/telegram_in?secret=XYZ`

## 🔍 Como Debugar

### Verificar Logs no EasyPanel:
1. Acesse a aba "Logs" do seu projeto
2. Procure por erros específicos
3. Verifique se as variáveis estão sendo carregadas

### Testar Localmente:
```bash
# Clone o repositório
git clone https://github.com/creeai/alert.git
cd alert

# Configure as variáveis
cp env.example .env
# Edite o .env com suas configurações

# Teste localmente
pip install -r requirements.txt
python main.py
```

## 📋 Checklist de Deploy

- [ ] Repositório Git configurado corretamente
- [ ] Variáveis de ambiente configuradas
- [ ] Comandos de build/start corretos
- [ ] API_ID e API_HASH válidos
- [ ] URL do webhook n8n funcionando
- [ ] Logs sem erros

## 🆘 Erro Específico?

**Me diga qual erro apareceu** e eu te ajudo a resolver!

Exemplos de erros comuns:
- "Build failed"
- "Environment variables not found"
- "Connection refused"
- "Module not found"
- "Permission denied"
