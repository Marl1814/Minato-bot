const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'toimage',
    aliases: ['toimg', 'img', 'vv'],
    category: 'convertidor',
    description: 'Convierte stickers estáticos o fotos de una sola vista (viewOnce) en imágenes normales.',
    async execute({ Minato, m }) {
        try {
            // Obtener el mensaje citado o el mensaje actual enviado directamente
            const quoted = m.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const currentMsg = m.raw.message;

            // Detectar si es un sticker
            const stickerMsg = quoted?.stickerMessage || currentMsg?.stickerMessage;

            // Detectar foto de una sola vista (viewOnce)
            const viewOnceImageMsg = 
                quoted?.viewOnceMessage?.message?.imageMessage ||
                quoted?.viewOnceMessageV2?.message?.imageMessage ||
                quoted?.viewOnceMessageV2Extension?.message?.imageMessage ||
                currentMsg?.viewOnceMessage?.message?.imageMessage ||
                currentMsg?.viewOnceMessageV2?.message?.imageMessage;

            // Detectar imagen normal citada (por si acaso)
            const regularImageMsg = quoted?.imageMessage;

            // Determinar qué tipo de media tenemos
            let targetMedia = null;
            let mediaType = '';

            if (stickerMsg) {
                if (stickerMsg.isAnimated) {
                    return Minato.sendMessage(
                        m.chat, 
                        { text: '❌ No se pueden convertir stickers animados a imagen estática.' }, 
                        { quoted: m.raw }
                    );
                }
                targetMedia = stickerMsg;
                mediaType = 'sticker';
            } else if (viewOnceImageMsg) {
                targetMedia = viewOnceImageMsg;
                mediaType = 'image';
            } else if (regularImageMsg) {
                targetMedia = regularImageMsg;
                mediaType = 'image';
            }

            // Si no se encontró ningún archivo válido
            if (!targetMedia) {
                return Minato.sendMessage(
                    m.chat, 
                    { text: '❀ Debes responder a un *Sticker estático* o a una *foto de una sola vista*.' }, 
                    { quoted: m.raw }
                );
            }

            // Descargar el contenido
            const stream = await downloadContentFromMessage(targetMedia, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Enviar la imagen recuperada
            await Minato.sendMessage(
                m.chat, 
                { image: buffer }, 
                { quoted: m.raw }
            );

        } catch (e) {
            console.error('Error en toimage:', e);
            Minato.sendMessage(
                m.chat, 
                { text: '☈ Hubo un error al intentar convertir la imagen.' }, 
                { quoted: m.raw }
            );
        }
    }
};
