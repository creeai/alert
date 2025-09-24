const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

console.log('🚀 Iniciando Telegram n8n Bridge...');

// Configurações
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION_STRING || '';

console.log(`📊 API_ID: ${API_ID ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 API_HASH: ${API_HASH ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 N8N_WEBHOOK_URL: ${N8N_WEBHOOK_URL ? '✅ Configurado' : '❌ Não configurado'}`);
console.log(`📊 SESSION_STRING: ${SESSION_STRING ? '✅ Configurado' : '❌ Não configurado'}`);

// Verificar configurações obrigatórias
if (!API_ID || !API_HASH || !N8N_WEBHOOK_URL) {
  console.error('❌ Defina TELEGRAM_API_ID, TELEGRAM_API_HASH e N8N_WEBHOOK_URL no .env');
  process.exit(1);
}

console.log('✅ Todas as configurações estão corretas!');
console.log('👤 Modo CONTA DE USUÁRIO (todas as mensagens)');

// Inicializar cliente Telegram
const client = new TelegramClient(
  new StringSession(SESSION_STRING || ''),
  API_ID,
  API_HASH,
  { connectionRetries: 5 }
);

// Função para enviar dados ao n8n
async function sendToN8n(payload) {
  try {
    console.log('🚀 Enviando para n8n...');
    console.log('📡 URL do webhook:', N8N_WEBHOOK_URL);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Enviado ao n8n (status ${response.status})`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar para n8n:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Headers:', error.response.headers);
      console.error('📊 Data:', error.response.data);
    }
    throw error;
  }
}

// Função principal
async function start() {
  try {
    console.log('🔌 Conectando ao Telegram...');
    
    if (SESSION_STRING && SESSION_STRING.length > 10) {
      console.log('🔑 Usando sessão pré-autenticada...');
      await client.start();
    } else {
      console.log('⚠️ ATENÇÃO: Primeira autenticação requer entrada manual!');
      console.log('📱 Você precisará inserir número de telefone e código de verificação');
      
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
    }
    
    console.log('✅ Cliente Telegram conectado com sucesso!');
    console.log('📡 Escutando mensagens...');
    
    // Event handler para todas as mensagens
    client.addEventHandler(async (event) => {
      try {
        // Log de todos os eventos para debug
        if (event.className && event.className.includes('Message')) {
          console.log('🔔 Evento de mensagem:', event.className);
        }
        
        // Capturar apenas mensagens reais (ignorar status e eventos undefined)
        if (event.className === 'UpdateNewMessage' || event.className === 'UpdateNewChannelMessage' || event.className === 'UpdateShortMessage') {
          console.log('📨 Nova mensagem detectada:', event.className);
          
          // Log para debug de mensagens diretas
          if (event.className === 'UpdateNewMessage' || event.className === 'UpdateShortMessage') {
            console.log('🔍 Mensagem direta detectada - fromId:', event.message?.fromId?.userId);
            console.log('🔍 Mensagem direta detectada - peerId:', event.message?.peerId?.userId);
            console.log('🔍 Mensagem direta detectada - out:', event.message?.out);
            console.log('🔍 Mensagem direta detectada - viaBotId:', event.message?.viaBotId);
            
            // Log completo da estrutura para debug
            if (event.className === 'UpdateShortMessage') {
              console.log('🔍 Estrutura completa do UpdateShortMessage:');
              console.log(JSON.stringify(event, null, 2));
            }
          }
          const message = event.message;
          if (!message) return;
          
          console.log('📨 Mensagem ID:', message.id);
          
          // Obter informações do chat e remetente
          let chat, sender;
          try {
            // Para UpdateShortMessage, usar propriedades diretas
            if (event.className === 'UpdateShortMessage') {
              chat = { 
                id: message.peerId?.userId?.toString() || 'unknown',
                constructor: { name: 'User' }
              };
              sender = { 
                id: message.fromId?.userId?.toString() || 'unknown',
                username: null
              };
              console.log('📊 UpdateShortMessage - Chat ID:', chat.id);
              console.log('📊 UpdateShortMessage - Sender ID:', sender.id);
            } else {
              // Para outras mensagens, usar métodos normais
              chat = await message.getChat();
              sender = await message.getSender();
              console.log('📊 Chat obtido:', chat.constructor?.name, chat.id);
              console.log('📊 Sender obtido:', sender?.constructor?.name, sender?.id);
            }
          } catch (error) {
            console.warn('⚠️ Erro ao obter chat/sender:', error.message);
            // Tentar obter informações básicas da mensagem
            chat = { 
              id: message.chatId?.toString() || message.peerId?.toString() || 'unknown',
              constructor: { name: 'UnknownChat' }
            };
            sender = { 
              id: message.senderId?.toString() || 'unknown',
              username: null
            };
          }
          
          if (!chat || !chat.id || chat.id === 'unknown') {
            console.warn('⚠️ Chat não encontrado, usando valores padrão');
            chat = { 
              id: message.chatId?.toString() || message.peerId?.toString() || 'unknown',
              constructor: { name: 'UnknownChat' }
            };
          }
          
          const chatId = chat.id.toString();
          const chatType = chat.constructor ? chat.constructor.name.toLowerCase() : 'unknown';
          const senderId = sender?.id ? sender.id.toString() : null;
          const senderUsername = sender?.username || null;
          
          console.log(`💬 Chat: ${chatId} (${chatType}), Sender: ${senderId} (@${senderUsername})`);
          
          const text = message.message || null;
          // Corrigir problema de data para UpdateShortMessage
          let date;
          try {
            if (message.date) {
              date = new Date(message.date * 1000).toISOString();
            } else {
              date = new Date().toISOString();
            }
          } catch (error) {
            console.warn('⚠️ Erro ao processar data:', error.message);
            date = new Date().toISOString();
          }
          
          console.log(`📝 Texto: ${text ? text.substring(0, 50) + '...' : 'Sem texto'}`);
          
          const payload = {
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
          
          // Enviar para n8n
          await sendToN8n(payload);
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