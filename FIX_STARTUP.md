# 🔧 Fix: Waiting for service to start

## Problema Identificado
O serviço `telegram_alert` está travado em "Waiting for service to start...". Isso indica que a aplicação não está conseguindo iniciar.

## 🚨 Soluções Rápidas

### 1. **Verificar Logs do Serviço**
No EasyPanel:
- Acesse a aba **"Logs"** do projeto
- Procure por erros específicos
- Verifique se as variáveis estão sendo carregadas

### 2. **Verificar Variáveis de Ambiente**
Certifique-se que estas variáveis estão configuradas:
```
TELEGRAM_API_ID=seu_api_id
TELEGRAM_API_HASH=seu_api_hash
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/telegram
```

### 3. **Problemas Comuns**

#### **A) Variáveis não configuradas**
- **Erro:** `TELEGRAM_API_ID` not found
- **Solução:** Configure todas as variáveis obrigatórias

#### **B) API inválida**
- **Erro:** Invalid API credentials
- **Solução:** Verifique API_ID e API_HASH em https://my.telegram.org

#### **C) Webhook inválido**
- **Erro:** Connection refused to webhook
- **Solução:** Teste a URL do webhook n8n

#### **D) Dependências não instaladas**
- **Erro:** Module not found
- **Solução:** Verifique se `pip install -r requirements.txt` executou

## 🔍 **Como Debugar**

### 1. **Acesse os Logs**
- No EasyPanel, vá para a aba "Logs"
- Procure por mensagens de erro
- Verifique se aparece "READY" ou "Escutando mensagens"

### 2. **Teste Local**
```bash
# Clone e teste localmente
git clone https://github.com/creeai/alert.git
cd alert
cp env.example .env
# Edite o .env com suas configurações
pip install -r requirements.txt
python main.py
```

### 3. **Verificar Configurações**
- API_ID e API_HASH estão corretos?
- URL do webhook n8n está funcionando?
- Todas as variáveis estão configuradas?

## 🚀 **Soluções Específicas**

### **Se for problema de variáveis:**
1. Acesse as configurações do projeto
2. Vá para "Environment Variables"
3. Adicione todas as variáveis obrigatórias
4. Reinicie o serviço

### **Se for problema de API:**
1. Verifique em https://my.telegram.org
2. Certifique-se que os valores estão corretos
3. Teste com uma conta de usuário primeiro

### **Se for problema de webhook:**
1. Teste a URL do webhook no navegador
2. Verifique se o n8n está rodando
3. Teste com curl: `curl -X POST https://seu-webhook-url`

## 📋 **Checklist de Verificação**

- [ ] Variáveis de ambiente configuradas
- [ ] API_ID e API_HASH válidos
- [ ] URL do webhook funcionando
- [ ] Dependências instaladas
- [ ] Logs sem erros críticos
- [ ] Serviço consegue iniciar

## 🆘 **Próximos Passos**

1. **Acesse os logs** do projeto no EasyPanel
2. **Copie a mensagem de erro** completa
3. **Me envie aqui** que eu te ajudo a resolver!

**Qual erro específico aparece nos logs?** 🤔
