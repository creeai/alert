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
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION_STRING || '';

console.log(`📊 API_ID: ${API_ID ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 API_HASH: ${API_HASH ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 SESSION_STRING: ${SESSION_STRING ? '✅ Configurado' : '❌ Não configurado'}`);

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

console.log('✅ Todas as configurações estão corretas!');
console.log('👤 Modo CONTA DE USUÁRIO (todas as mensagens)');
console.log(`🔍 Filtro de chats: ${ALLOW_CHATS ? ALLOW_CHATS.join(', ') : 'TODOS'}`);

// Criar pasta de sessão
const sessionDir = path.join(__dirname, 'session');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Inicializar cliente Telegram com tratamento de erro
let client;
try {
  client = new TelegramClient(
    new StringSession(SESSION_STRING || ''), // Usar string vazia se inválida
    API_ID,
    API_HASH,
    { connectionRetries: 5 }
  );
} catch (error) {
  console.warn('⚠️ SESSION_STRING inválida, usando sessão vazia');
  client = new TelegramClient(
    new StringSession(''), // Sessão vazia
    API_ID,
    API_HASH,
    { connectionRetries: 5 }
  );
}

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
    
    if (SESSION_STRING && SESSION_STRING.length > 10) {
      // Usar sessão pré-autenticada
      console.log('🔑 Usando sessão pré-autenticada...');
      await client.start({
        phoneNumber: async () => {
          console.log('📱 Número de telefone da sessão: [OCULTO]');
          return '+5531989354137'; // Número fixo para sessão pré-autenticada
        },
        password: async () => {
          console.log('🔐 Senha 2FA da sessão: [OCULTO]');
          return ''; // Senha vazia para sessão pré-autenticada
        },
        phoneCode: async () => {
          console.log('📱 Código de verificação da sessão: [OCULTO]');
          return ''; // Código vazio para sessão pré-autenticada
        },
        onError: (err) => console.log('❌ Erro de autenticação:', err)
      });
    } else {
      // Primeira autenticação (requer entrada manual)
      console.log('⚠️ ATENÇÃO: Primeira autenticação requer entrada manual!');
      console.log('📱 Você precisará inserir número de telefone e código de verificação');
      console.log('💡 Após autenticação, salve a SESSION_STRING para uso futuro');
      
      await client.start({
        phoneNumber: async () => {
          console.log('📱 Por favor, insira seu número de telefone (com código do país, ex: +5511999999999):');
          return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
              resolve(data.toString().trim());
            });
          });
        },
        password: async () => {
          console.log('🔐 Por favor, insira sua senha 2FA (se tiver):');
          return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
              resolve(data.toString().trim());
            });
          });
        },
        phoneCode: async () => {
          console.log('📱 Por favor, insira o código de verificação enviado pelo Telegram:');
          return new Promise((resolve) => {
            process.stdin.once('data', (data) => {
              resolve(data.toString().trim());
            });
          });
        },
        onError: (err) => console.log('❌ Erro de autenticação:', err)
      });
      
      // Salvar sessão para uso futuro
      const sessionString = client.session.save();
      console.log('🔑 SESSION_STRING para uso futuro:');
      console.log(`TELEGRAM_SESSION_STRING=${sessionString}`);
      console.log('💡 Adicione esta variável ao EasyPanel para autenticação automática');
    }
    
    console.log('✅ Cliente Telegram conectado com sucesso!');
    console.log('📡 Escutando mensagens...');
    
    // Event handler para todas as mensagens
    client.addEventHandler(async (event) => {
      try {
        console.log('🔔 Evento recebido:', event.className);
        
        // Verificar se é uma mensagem nova
        if (event.className === 'UpdateNewMessage') {
          const message = event.message;
          if (!message) {
            console.log('⚠️ Mensagem vazia, ignorando');
            return;
          }
          
          console.log('📨 Nova mensagem recebida:', message.id);
          
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
          
          console.log(`💬 Chat: ${chatId} (${chatType}), Sender: ${senderId} (@${senderUsername})`);
          
          if (!chatAllowed(parseInt(chatId))) {
            console.log('🚫 Chat filtrado:', chatId);
            return; // filtrado
          }
          
          const text = message.message || null;
          const date = new Date(message.date * 1000).toISOString();
          
          console.log(`📝 Texto: ${text ? text.substring(0, 50) + '...' : 'Sem texto'}`);
          
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
            console.log('📎 Baixando mídia...');
            mediaBuffer = await downloadMedia(message);
            if (mediaBuffer) {
              mediaName = 'media';
              console.log('✅ Mídia baixada com sucesso');
            }
          }
          
          // Enviar para n8n
          console.log('🚀 Enviando para n8n...');
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