const { Api, TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configurações
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

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
    console.log('🚀 Iniciando Telegram n8n Bridge...');
    
    if (BOT_TOKEN) {
      await client.start({
        botAuthToken: BOT_TOKEN
      });
      console.log('🤖 Rodando como BOT');
    } else {
      await client.start({
        phoneNumber: async () => {
          console.log('📱 Por favor, insira seu número de telefone:');
          return process.stdin.read();
        },
        password: async () => {
          console.log('🔐 Por favor, insira sua senha 2FA:');
          return process.stdin.read();
        },
        phoneCode: async () => {
          console.log('📱 Por favor, insira o código de verificação:');
          return process.stdin.read();
        },
        onError: (err) => console.log('❌ Erro:', err)
      });
      console.log('👤 Rodando como CONTA DE USUÁRIO');
    }
    
    console.log('✅ Cliente Telegram conectado!');
    console.log('📡 Escutando mensagens...');
    
    // Adicionar event handler APÓS a conexão
    client.addEventHandler(async (event) => {
      try {
        const message = event.message;
        if (!message) return;
        
        const chat = await message.getChat();
        const sender = await message.getSender();
        
        const chatId = chat.id?.toString();
        const chatType = chat.constructor.name.toLowerCase();
        const senderId = sender?.id?.toString();
        const senderUsername = sender?.username;
        
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
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    }, new Api.UpdateNewMessage({}));
    
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