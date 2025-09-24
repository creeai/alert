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
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 15000
    });
    console.log(`✅ Enviado ao n8n (status ${response.status})`);
    return response;
  } catch (error) {
    console.error('❌ Erro ao enviar para n8n:', error.message);
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
        console.log('🔔 Evento recebido:', event.className);
        
        // Capturar mensagens de canais e conversas
        if (event.className === 'UpdateNewMessage' || event.className === 'UpdateNewChannelMessage') {
          const message = event.message;
          if (!message) return;
          
          console.log('📨 Nova mensagem recebida:', message.id);
          
          // Obter informações do chat e remetente
          let chat, sender;
          try {
            chat = await message.getChat();
            sender = await message.getSender();
          } catch (error) {
            console.warn('⚠️ Erro ao obter chat/sender:', error.message);
            // Continuar mesmo com erro
            chat = { id: 'unknown' };
            sender = { id: 'unknown' };
          }
          
          if (!chat || !chat.id) {
            console.warn('⚠️ Chat não encontrado, usando valores padrão');
            chat = { id: 'unknown' };
          }
          
          const chatId = chat.id.toString();
          const chatType = chat.constructor ? chat.constructor.name.toLowerCase() : 'unknown';
          const senderId = sender?.id ? sender.id.toString() : null;
          const senderUsername = sender?.username || null;
          
          console.log(`💬 Chat: ${chatId} (${chatType}), Sender: ${senderId} (@${senderUsername})`);
          
          const text = message.message || null;
          const date = new Date(message.date * 1000).toISOString();
          
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