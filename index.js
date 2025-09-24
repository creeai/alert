const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Iniciando Telegram n8n Bridge...');
console.log('📋 Verificando configurações...');

// Configurações
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

console.log(`📊 API_ID: ${API_ID ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 API_HASH: ${API_HASH ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 BOT_TOKEN: ${BOT_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL ? '✅ Configurado' : '❌ Não configurado'}`);

// Controle de chats permitidos
const allowChatsEnv = process.env.ALLOW_CHATS || '*';
let ALLOW_CHATS = null;
if (allowChatsEnv !== '*') {
  ALLOW_CHATS = allowChatsEnv.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
}

// Encaminhar mídia pequena?
const FORWARD_MEDIA = (process.env.FORWARD_MEDIA || 'true').toLowerCase() === 'true';
const MAX_MEDIA_BYTES = 8 * 1024 * 1024; // 8 MB

// Verificar configurações obrigatórias
if (!API_ID || !API_HASH || !N8N_WEBHOOK_URL) {
  console.error('❌ Defina TELEGRAM_API_ID, TELEGRAM_API_HASH e N8N_WEBHOOK_URL no .env');
  process.exit(1);
}

// OBRIGATÓRIO: Bot Token para funcionar no EasyPanel
if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN é OBRIGATÓRIO para funcionar no EasyPanel');
  console.error('💡 Crie um bot com @BotFather e configure o token');
  console.error('📋 Siga as instruções em: BOT_SETUP.md');
  process.exit(1);
}

console.log('✅ Todas as configurações estão corretas!');
console.log('🤖 Modo BOT (recomendado para EasyPanel)');

// Criar pasta de sessão
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Inicializar cliente Telegram
const client = new TelegramClient(
  new StringSession(''), // Sessão vazia para começar
  API_ID,
  API_HASH,
  { connectionRetries: 5 }
);

// Função para verificar se chat é permitido
function chatAllowed(chatId) {
  if (chatId === null || chatId === undefined) return true;
  if (ALLOW_CHATS === null) return true; // '*' (todos permitidos)
  return ALLOW_CHATS.includes(chatId);
}

// Função para enviar dados ao n8n
async function sendToN8n(payload, mediaBuffer = null, mediaName = null) {
  try {
    if (mediaBuffer && FORWARD_MEDIA) {
      const form = new FormData();
      form.append('payload', JSON.stringify(payload, null, 2));
      form.append('file', mediaBuffer, { filename: mediaName || 'media' });
      
      const response = await axios.post(N8N_WEBHOOK_URL, form, {
        headers: form.getHeaders(),
        timeout: 15000
      });
      return response;
    } else {
      const response = await axios.post(N8N_WEBHOOK_URL, payload, {
        timeout: 15000
      });
      return response;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar para n8n:', error.message);
    throw error;
  }
}

// Função para baixar mídia
async function downloadMedia(message) {
  if (!message.media || !FORWARD_MEDIA) return null;
  
  try {
    const mediaBuffer = await client.downloadMedia(message);
    if (mediaBuffer && mediaBuffer.length <= MAX_MEDIA_BYTES) {
      return mediaBuffer;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Falha ao baixar mídia:', error.message);
    return null;
  }
}

// Função principal
async function start() {
  try {
    console.log('🔌 Conectando ao Telegram...');
    
    // SEMPRE usar bot token no EasyPanel
    await client.start({
      botAuthToken: BOT_TOKEN
    });
    
    console.log('✅ Bot conectado com sucesso!');
    console.log('📡 Escutando mensagens...');
    
    // Usar uma abordagem mais simples para event handlers
    client.addEventHandler(async (event) => {
      try {
        // Verificar se é uma mensagem nova
        if (event.className === 'UpdateNewMessage') {
          const message = event.message;
          if (!message) return;
          
          // Verificar se chat e sender existem antes de acessar propriedades
          let chat, sender;
          try {
            chat = await message.getChat();
            sender = await message.getSender();
          } catch (error) {
            console.warn('⚠️ Erro ao obter chat/sender:', error.message);
            return;
          }
          
          if (!chat || !chat.id) {
            console.warn('⚠️ Chat não encontrado ou sem ID');
            return;
          }
          
          const chatId = chat.id.toString();
          const chatType = chat.constructor ? chat.constructor.name.toLowerCase() : 'unknown';
          const senderId = sender?.id ? sender.id.toString() : null;
          const senderUsername = sender?.username || null;
          
          if (!chatAllowed(parseInt(chatId))) {
            return; // filtrado
          }
          
          const text = message.message || null;
          const date = new Date(message.date * 1000).toISOString();
          
          const basePayload = {
            message_id: message.id,
            date: date,
            chat_id: chatId,
            chat_type: chatType,
            sender_id: senderId,
            sender_username: senderUsername,
            text: text,
            has_media: !!message.media,
            raw: {
              reply_to_msg_id: message.replyTo?.replyToMsgId,
              fwd_from: !!message.fwdFrom,
              via_bot_id: message.viaBotId,
              entities: message.entities || []
            }
          };
          
          // Baixar mídia se necessário
          let mediaBuffer = null;
          let mediaName = null;
          if (message.media && FORWARD_MEDIA) {
            mediaBuffer = await downloadMedia(message);
            if (mediaBuffer) {
              mediaName = 'media';
            }
          }
          
          // Enviar para n8n
          const response = await sendToN8n(basePayload, mediaBuffer, mediaName);
          console.log(`✅ Enviado ao n8n (status ${response.status})`);
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    });
    
    // Manter o processo rodando
    process.on('SIGINT', async () => {
      console.log('\n🛑 Encerrando aplicação...');
      await client.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar:', error.message);
    process.exit(1);
  }
}

// Iniciar aplicação
start();