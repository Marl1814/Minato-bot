const YtDlp = require('@distube/yt-dlp').default || require('@distube/yt-dlp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: 'x',
    aliases: ['twitter', 'tw', 'xdownloader'],
    category: 'descargas',
    description: 'Descarga videos de Twitter / X usando yt-dlp en máxima calidad.',
    async execute({ Minato, m, args }) {
        let text = args.join(' ');
        if (!text) {
            return Minato.sendMessage(
                m.chat, 
                { text: '❌ ¡Debes proporcionar un enlace válido de Twitter / X!' }, 
                { quoted: m.raw }
            );
        }

        // Validar enlace de Twitter/X
        const isTwitterLink = /(https?:\/\/)?(www\.|mobile\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/[0-9]+/i.test(text);

        if (!isTwitterLink) {
            return Minato.sendMessage(
                m.chat, 
                { text: '❌ Por favor ingresa un enlace válido de Twitter/X.' }, 
                { quoted: m.raw }
            );
        }

        // Crear nombre temporal único para guardar el video
        const tempId = Date.now();
        const outputDir = path.join(__dirname, '../../tmp');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputFilePath = path.join(outputDir, `twitter_${tempId}.mp4`);

        try {
            // 1. Obtener la información del video en JSON usando el método estático
            const info = await YtDlp.getVideoInfo(text);

            const tweetText = info.description || info.title || 'Video de Twitter / X';
            const duration = info.duration_string || `${info.duration || 0}s`;
            const thumbUrl = info.thumbnail;

            // --- 1ER MENSAJE: FOTO MINIATURA CON LA INFORMACIÓN ---
            const infoCaption = 
`❀ Título » ${tweetText}

> ⏱ Duración » *${duration}*
> 🔗 URL » ${text}`;

            let sentThumb = false;
            if (thumbUrl) {
                try {
                    const thumbBuffer = await axios.get(thumbUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data));
                    await Minato.sendMessage(m.chat, {
                        image: thumbBuffer,
                        caption: infoCaption
                    }, { quoted: m.raw });
                    sentThumb = true;
                } catch (e) {
                    sentThumb = false;
                }
            }

            if (!sentThumb) {
                await Minato.sendMessage(m.chat, { text: infoCaption }, { quoted: m.raw });
            }

            // 2. Descargar el video físicamente usando el método estático execPromise
            await YtDlp.execPromise([
                text,
                '-f', 'b[ext=mp4]/bv*+ba/b',
                '-o', outputFilePath
            ]);

            // Leer el archivo descargado
            const videoBuffer = fs.readFileSync(outputFilePath);

            // --- 2DO MENSAJE: VIDEO CON EL TEXTO DIRECTO ---
            await Minato.sendMessage(m.chat, {
                video: videoBuffer,
                caption: tweetText,
                mimetype: 'video/mp4'
            }, { quoted: m.raw });

            // Eliminar archivo temporal
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }

        } catch (e) {
            console.error('Error con yt-dlp en Twitter:', e);

            // Limpieza en caso de error
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }

            Minato.sendMessage(
                m.chat, 
                { text: '❌ Ocurrió un error al procesar el video de Twitter / X.' }, 
                { quoted: m.raw }
            );
        }
    }
};
