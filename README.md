# Translate Bot - WhatsApp
Um bot de WhatsApp para traduções instantâneas usando a API do Google Gemini.
## Requisitos
- NPM
- Conta do WhatsApp
- Chave de API do Google Gemini
## Funcionalidades (Regras do Bot)
1. O bot se conecta ao WhatsApp lendo um QR Code exibido no terminal na primeira execução.
2. A sessão de login é salva localmente para permitir reconexões automáticas, eliminando a necessidade de escanear o QR Code novamente.
3. O bot foi projetado para operar em conversas privadas e ignorar todas as mensagens enviadas em grupos.
4. O bot permanece inativo e só responde ao comando específico /ia.
5. Ao receber o comando /ia, o bot entra em "modo de tradução" e aguarda a próxima mensagem do usuário.
6. O texto enviado imediatamente após o comando /ia é processado pela API do Google Gemini.
7. O bot responde com a tradução do texto para o inglês, sem adicionar nenhuma informação extra.
8. Após enviar a tradução, o bot sai automaticamente do modo de tradução e aguarda um novo comando /ia para futuras solicitações.
## Comandos
- Instalar as dependências: npm install
- Rodar o bot: npm start
