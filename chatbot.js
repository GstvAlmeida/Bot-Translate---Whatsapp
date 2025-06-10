// Importações de bibliotecas
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// --- CONFIGURAÇÃO DAS APIS ---

// Carrega as variáveis de ambiente (sua chave da API do Google)
dotenv.config();

// Configura o cliente do WhatsApp
const client = new Client();

// Configura a API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- INICIALIZAÇÃO DO WHATSAPP ---

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

// --- LÓGICA DO CHATBOT ---

const delay = ms => new Promise(res => setTimeout(res, ms));

// Objeto para guardar o estado da conversa de cada usuário
const userStates = {};

// Função para chamar o Gemini e traduzir o texto (sem alterações)
async function traduzirComGemini(texto) {
    console.log(`Traduzindo o texto: "${texto}"`);
    try {
        const prompt = `Traduza o seguinte texto para o inglês. Retorne apenas o texto traduzido, sem nenhuma explicação ou frase adicional:\n\n"${texto}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Erro ao chamar a API do Gemini:", error);
        return "Desculpe, não consegui traduzir agora. Tente novamente mais tarde.";
    }
}


// Listener de mensagens do WhatsApp (LÓGICA PRINCIPAL ALTERADA)
client.on('message', async msg => {
    // Ignora mensagens de grupos para não poluir conversas
    if (!msg.from.endsWith('@c.us')) {
        return;
    }

    const chat = await msg.getChat();
    const userMessage = msg.body.trim();
    const userNumber = msg.from;

    // 1. VERIFICA SE O USUÁRIO ESTÁ EM MODO DE TRADUÇÃO
    // Se o estado for 'awaiting_translation', a mensagem atual é o texto a ser traduzido.
    if (userStates[userNumber] === 'awaiting_translation') {
        
        await chat.sendStateTyping();
        
        // Pega a mensagem e envia para a função de tradução
        const textoTraduzido = await traduzirComGemini(userMessage);
        
        // Envia a tradução de volta para o usuário
        await client.sendMessage(userNumber, textoTraduzido);

        // Mensagem opcional para informar que o modo foi desativado
        await client.sendMessage(userNumber, 'Para traduzir novamente, digite `/ia`');

        // Limpa o estado do usuário para que ele precise digitar /ia de novo
        delete userStates[userNumber];
        return; // Encerra o processamento aqui
    }

    // 2. VERIFICA SE O COMANDO PARA ATIVAR A TRADUÇÃO FOI ENVIADO
    if (userMessage.toLowerCase() === '/ia') {
        await chat.sendStateTyping();
        await delay(500);
        await client.sendMessage(userNumber, 'Olá! Modo tradutor ativado. ✍️\n\nEnvie a próxima mensagem com o que você deseja traduzir para o inglês.');
        
        // Define o estado do usuário como "esperando pela próxima mensagem para traduzir"
        userStates[userNumber] = 'awaiting_translation';
    }

    // Se a mensagem não for '/ia' e o usuário não estiver em modo de tradução, o bot não faz nada.
});