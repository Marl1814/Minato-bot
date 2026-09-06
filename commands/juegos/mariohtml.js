const path = require('path');

// Apunta directamente a la raíz /bot-gacha/htmlTransport.js
const { sendHtmlGame } = require(path.join(__dirname, '../../htmlTransport'));
const { buildMarioHtml } = require(path.join(__dirname, '../../marioGame'));

module.exports = {
    name: 'mariohtml',
    aliases: ['marioh', 'supermarioh'],
    category: 'juegos',
    description: 'Abre la interfaz HTML5 de Mario interactiva.',
    async execute({ Minato, m }) {
        try {
            const htmlContent = buildMarioHtml();
            await sendHtmlGame(Minato, m.chat, htmlContent, 'Super Mario Bros');
        } catch (error) {
            console.error('Error enviando el juego HTML:', error);
            await Minato.sendMessage(m.chat, { 
                text: '❌ Tu versión de WhatsApp o cliente actual no soporta el renderizado interactivo de Meta AI.' 
            }, { quoted: m.raw });
        }
    }
};
