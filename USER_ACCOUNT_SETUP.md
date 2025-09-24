# 👤 Configuração para Conta de Usuário

## 🎯 **Para receber TODAS as mensagens:**

### **1. Remover BOT_TOKEN (opcional):**
- No EasyPanel, **remova** ou **deixe vazio** a variável `TELEGRAM_BOT_TOKEN`
- Isso fará a aplicação usar **conta de usuário** em vez de bot

### **2. Primeira execução:**
Quando a aplicação iniciar, você verá:
```
👤 Modo CONTA DE USUÁRIO (todas as mensagens)
⚠️ ATENÇÃO: Este modo requer autenticação manual!
📱 Você precisará inserir número de telefone e código de verificação
📱 Por favor, insira seu número de telefone (com código do país, ex: +5511999999999):
```

### **3. Processo de autenticação:**
1. **Digite seu número** com código do país (ex: `+5511999999999`)
2. **Aguarde o código** de verificação no Telegram
3. **Digite o código** quando solicitado
4. **Se tiver 2FA**, digite sua senha

### **4. Após autenticação:**
```
✅ Cliente Telegram conectado com sucesso!
📡 Escutando mensagens...
```

## ✅ **Vantagens do modo conta de usuário:**
- 📱 **Todas as mensagens** de qualquer conversa
- 👥 **Grupos e canais** onde você participa
- 💬 **Conversas privadas** com qualquer pessoa
- 🔄 **Mensagens enviadas e recebidas**

## ⚠️ **Limitações:**
- 🔐 **Requer autenticação manual** na primeira vez
- 📱 **Precisa de acesso** ao seu telefone para códigos
- 🔄 **Pode precisar reautenticar** ocasionalmente

## 🚀 **Recomendação:**
Para **todas as mensagens**, use **conta de usuário** (sem BOT_TOKEN).
Para **apenas mensagens do bot**, use **modo bot** (com BOT_TOKEN).
