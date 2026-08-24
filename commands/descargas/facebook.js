const YtDlp = require('@distube/yt-dlp').default || require('@distube/yt-dlp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    name: 'fb',
    aliases: ['facebook', 'fbdl', 'fbvideo'],
    category: 'descargas',
    description: 'Descarga videos de Facebook usando yt-dlp con miniatura e información.',
    async execute({ Minato, m, args }) {
        let text = args.join(' ');
        if (!text) {
            return Minato.sendMessage(
                m.chat, 
                { text: '❌ ¡Debes proporcionar un enlace válido de Facebook!' }, 
                { quoted: m.raw }
            );
        }

        // Validar enlace de Facebook (Reels, Videos, Watch, etc.)
        const isFacebookLink = /(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch|fb\.gg)\/.+/i.test(text);

        if (!isFacebookLink) {
            return Minato.sendMessage(
                m.chat, 
                { text: '❌ Por favor ingresa un enlace válido de Facebook.' }, 
                { quoted: m.raw }
            );
        }

        // Ruta para guardar el video temporalmente
        const tempId = Date.now();
        const outputDir = path.join(__dirname, '../../tmp');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const outputFilePath = path.join(outputDir, `facebook_${tempId}.mp4`);

        try {
            // 1. Obtener la información del video en JSON mediante métodos estáticos
            const info = await YtDlp.getVideoInfo(text);

            const fbText = info.description || info.title || 'Video de Facebook';
            const duration = info.duration_string || (info.duration ? `${info.duration}s` : 'Desconocida');
            const thumbUrl = info.thumbnail;

            // --- 1. PRIMER MENSAJE: MINIATURA CON INFORMACIÓN ---
            const infoCaption = 
`❀ Título » ${fbText}

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

            // 2. Descargar el video físicamente en formato MP4
            await YtDlp.execPromise([
                text,
                '-f', 'b[ext=mp4]/bv*+ba/b',
                '-o', outputFilePath
            ]);

            // Leer buffer del video descargado
            const videoBuffer = fs.readFileSync(outputFilePath);

            // --- 2. SEGUNDO MENSAJE: VIDEO CON TEXTO DIRECTO ---
            await Minato.sendMessage(m.chat, {
                video: videoBuffer,
                caption: fbText,
                mimetype: 'video/mp4'
            }, { quoted: m.raw });

            // Eliminar archivo temporal tras el envío
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }

        } catch (e) {
            console.error('Error con yt-dlp en Facebook:', e);

            // Limpieza en caso de fallo
            if (fs.existsSync(outputFilePath)) {
                fs.unlinkSync(outputFilePath);
            }

            Minato.sendMessage(
                m.chat, 
                { text: '❌ Ocurrió un error al procesar el video de Facebook. Asegúrate de que el enlace sea público.' }, 
                { quoted: m.raw }
            );
        }
    }
};
