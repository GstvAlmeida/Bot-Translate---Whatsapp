// Importações de bibliotecas (sem alteração)
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// --- CONFIGURAÇÃO DAS APIS (sem alteração) ---

dotenv.config();
const client = new Client();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- INICIALIZAÇÃO DO WHATSAPP (sem alteração) ---

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

// --- LÓGICA DO CHATBOT (REESTRUTURADA) ---

// 1. Objeto para guardar as SESSÕES de chat de cada usuário
// Em vez de 'userStates', vamos guardar o objeto de chat inteiro.
const userChatSessions = {};

// 2. Histórico de instruções para o Gemini
// Este é o "cérebro" do seu tradutor. Ele ensina o Gemini a se comportar.
const instructionHistory = [
  {
    role: "user",
    // Instrução clara e direta para o modelo.
    parts: [{ text: "Você é um assistente de tradução de português para inglês. Sua única função é traduzir o texto que eu enviar. Responda APENAS com a tradução direta, sem adicionar saudações, explicações ou qualquer texto extra como 'A tradução é:'." }],
  },
  {
    role: "model",
    // Simula a confirmação do modelo, reforçando a instrução.
    parts: [{ text: "Entendido. A partir de agora, responderei apenas com a tradução para o inglês do texto que você me enviar." }],
  },
];


// Listener de mensagens do WhatsApp (LÓGICA PRINCIPAL ALTERADA)
client.on('message', async msg => {
    // Ignora mensagens de grupos (sem alteração)
    if (!msg.from.endsWith('@c.us')) {
        return;
    }

    const userMessage = msg.body.trim();
    const userNumber = msg.from;
    const chat = await msg.getChat();

    // COMANDO PARA SAIR/RESETAR O MODO DE TRADUÇÃO
    if (userMessage.toLowerCase() === '/sair') {
        // Se o usuário tinha uma sessão ativa, apague-a.
        if (userChatSessions[userNumber]) {
            delete userChatSessions[userNumber];
            await client.sendMessage(userNumber, 'Modo tradutor desativado. 👋');
        }
        return; // Encerra o processamento
    }

    // Verifica se já existe uma sessão de chat para este usuário
    let userChat = userChatSessions[userNumber];

    // Se NÃO existir uma sessão de chat...
    if (!userChat) {
        // ...e a mensagem for o comando para começar...
        if (userMessage.toLowerCase() === '/ia') {
            await chat.sendStateTyping();

            // ...inicia uma nova sessão de chat com as instruções!
            userChat = model.startChat({
                history: instructionHistory,
            });
            
            // Armazena a nova sessão para o usuário
            userChatSessions[userNumber] = userChat;
            
            await client.sendMessage(userNumber, 'Olá! Modo tradutor ativado. ✍️\n\nEnvie o que deseja traduzir. Para sair, digite `/sair`.');
        }
        // Se não houver sessão e a mensagem não for /ia, o bot não faz nada.
        return;
    }

    // Se JÁ EXISTE uma sessão de chat, qualquer mensagem enviada é para tradução.
    await chat.sendStateTyping();

    try {
        // Envia a mensagem do usuário para o chat existente do Gemini
        const result = await userChat.sendMessage(userMessage);
        const response = result.response;
        const textoTraduzido = response.text();

        // Envia a tradução de volta para o usuário
        await client.sendMessage(userNumber, textoTraduzido);

    } catch (error) {
        console.error("Erro na tradução com a sessão de chat:", error);
        await client.sendMessage(userNumber, "Desculpe, ocorreu um erro. Tente novamente ou digite `/sair` para reiniciar.");
    }
});