const path = require('path');

const { sendHtmlGame } = require(path.join(__dirname, '../../htmlTransport'));
const { buildYoutubeHtml } = require(path.join(__dirname, '../../youtubeVideo'));

module.exports = {
    name: 'ytvideo',
    aliases: ['veryt', 'yofukashi'],
    category: 'utilidades',
    description: 'Abre un video de YouTube en interfaz interactiva HTML5.',
    async execute({ Minato, m }) {
        try {
            const htmlContent = buildYoutubeHtml();
            await sendHtmlGame(Minato, m.chat, htmlContent, 'YouTube Player - Daten');
        } catch (error) {
            console.error('Error al enviar el reproductor de YouTube:', error);
            await Minato.sendMessage(m.chat, { 
                text: '❌ Tu versión de WhatsApp no soporta el renderizado de la WebView.' 
            }, { quoted: m.raw });
        }
    }
};
