# Deploy via Git + Nixpacks no EasyPanel

Este guia explica como fazer o deploy da aplicação Telegram n8n Bridge usando um repositório Git e Nixpacks no EasyPanel.

## 🚀 Deploy via Git + Nixpacks

### Passo 1: Preparar o Repositório

1. **Faça fork deste repositório** ou crie um novo
2. **Clone localmente:**
   ```bash
   git clone <seu-repositorio>
   cd telegram_n8n_bridge
   ```

3. **Configure as variáveis (opcional para teste local):**
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Commit e push:**
   ```bash
   git add .
   git commit -m "Initial commit: Telegram n8n Bridge"
   git push origin main
   ```

### Passo 2: Deploy no EasyPanel

1. **Acesse seu EasyPanel**
2. **Crie um novo projeto**
3. **Selecione "Git Repository"**
4. **Cole a URL do seu repositório:**
   ```
   https://github.com/seu-usuario/telegram_n8n_bridge
   ```
5. **Configure as variáveis de ambiente** (veja seção abaixo)
6. **Deploy!**

## 🔧 Configuração das Variáveis

No EasyPanel, configure as seguintes variáveis de ambiente:

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `TELEGRAM_API_ID` | ID da API do Telegram | `123456` |
| `TELEGRAM_API_HASH` | Hash da API do Telegram | `abcdef1234567890...` |
| `N8N_WEBHOOK_URL` | URL do webhook n8n | `https://n8n.com/webhook/telegram` |

### Variáveis Opcionais

| Variável | Descrição | Padrão | Exemplo |
|----------|-----------|--------|---------|
| `TELEGRAM_BOT_TOKEN` | Token do bot (opcional) | - | `123456:ABC-DEF...` |
| `ALLOW_CHATS` | Chats permitidos | `*` | `*` ou `-1001234567890,111111111` |
| `FORWARD_MEDIA` | Encaminhar mídia | `true` | `true` ou `false` |

## 📁 Estrutura do Projeto

```
telegram_n8n_bridge/
├── main.py                 # Aplicação principal
├── requirements.txt        # Dependências Python
├── nixpacks.toml          # Configuração do Nixpacks
├── Dockerfile             # Para deploy Docker (opcional)
├── easypanel.yml          # Para deploy Docker Compose (opcional)
├── env.example            # Template de variáveis
├── .gitignore             # Arquivos ignorados pelo Git
├── README.md              # Documentação principal
├── EASYPANEL_DEPLOY.md    # Deploy via Docker Compose
└── GIT_DEPLOY.md          # Este arquivo
```

## 🔍 Como o Nixpacks Funciona

O arquivo `nixpacks.toml` configura automaticamente:

- **Python 3.11**: Versão otimizada
- **Dependências**: Instala automaticamente do `requirements.txt`
- **Variáveis**: Configura `PYTHONUNBUFFERED` e `PYTHONDONTWRITEBYTECODE`
- **Comando**: Executa `python main.py`

## 🎯 Vantagens do Deploy via Git + Nixpacks

### ✅ Vantagens

- **Deploy automático**: Push para Git = deploy automático
- **Versionamento**: Controle de versões via Git
- **Colaboração**: Múltiplos desenvolvedores
- **Rollback fácil**: Volte para versões anteriores
- **CI/CD**: Integração com GitHub Actions (opcional)

### ⚠️ Considerações

- **Primeira execução**: Pode demorar mais (build do Nixpacks)
- **Dependências**: Nixpacks detecta automaticamente Python
- **Volumes**: Sessão do Telegram é persistente automaticamente

## 🔄 Atualizações

Para atualizar a aplicação:

1. **Faça as alterações no código**
2. **Commit e push:**
   ```bash
   git add .
   git commit -m "Update: descrição da mudança"
   git push origin main
   ```
3. **O EasyPanel fará deploy automático**

## 🐛 Troubleshooting

### Problemas Comuns

1. **Build falha**: Verifique se `requirements.txt` está correto
2. **Variáveis não funcionam**: Verifique se estão configuradas no EasyPanel
3. **Sessão perdida**: Nixpacks mantém volumes automaticamente
4. **Logs**: Acesse a aba "Logs" no EasyPanel

### Logs de Debug

```bash
# Para ver logs detalhados
# Acesse a aba "Logs" no EasyPanel
# Ou via terminal (se tiver acesso):
docker logs <container-name>
```

## 📊 Monitoramento

- **Healthcheck**: Automático via Nixpacks
- **Logs**: Disponíveis no painel do EasyPanel
- **Métricas**: CPU, memória, rede no painel
- **Restart**: Automático em caso de falha

## 🎉 Próximos Passos

1. **Configure seu webhook no n8n**
2. **Teste enviando uma mensagem no Telegram**
3. **Verifique se os dados chegam no n8n**
4. **Configure seus workflows no n8n**

---

**Nota**: Este método é ideal para desenvolvimento contínuo e colaboração em equipe!
