const axios = require('axios');

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'tiktoksearch', 'tts'],
    category: 'descargas',
    description: 'Descarga videos de TikTok en alta calidad (HD) o busca contenido.',
    async execute({ Minato, m, args }) {
        let text = args.join(' ');
        if (!text) {
            return Minato.sendMessage(
                m.chat, 
                { text: '❌ ¡Debes proporcionar un enlace de TikTok o una frase para buscar!' }, 
                { quoted: m.raw }
            );
        }

        try {
            const isLink = /(https?:\/\/)?(www\.|vftik\.|vm\.|vt\.)?tiktok\.com\//i.test(text);

            let videoData = null;

            if (isLink) {
                const response = await axios.post('https://www.tikwm.com/api/', 
                    new URLSearchParams({ url: text, hd: '1' }), 
                    {
                        headers: { 
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    }
                );

                videoData = response.data?.data;
            } else {
                const searchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`);
                const videoList = searchRes.data?.data?.videos;

                if (videoList && videoList.length > 0) {
                    videoData = videoList[0];
                }
            }

            if (!videoData) {
                return Minato.sendMessage(
                    m.chat, 
                    { text: '❌ No se pudo encontrar o extraer el video. Intenta con otro enlace o término de búsqueda.' }, 
                    { quoted: m.raw }
                );
            }

            // Seleccionar la URL de máxima calidad disponible
            let videoUrl = videoData.hdplay || videoData.play;
            if (videoUrl && !videoUrl.startsWith('http')) {
                videoUrl = 'https://www.tikwm.com' + videoUrl;
            }

            // Descargar el video como Buffer para mantener la máxima calidad HD
            const videoBufferResponse = await axios.get(videoUrl, { 
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            const videoBuffer = Buffer.from(videoBufferResponse.data);

            // Formatear los números en negrita (*)
            const vistas = videoData.play_count ? `*${videoData.play_count.toLocaleString()}*` : '*0*';
            const comentarios = videoData.comment_count ? `*${videoData.comment_count.toLocaleString()}*` : '*0*';
            const likes = videoData.digg_count ? `*${videoData.digg_count.toLocaleString()}*` : '*0*';

            // --- FORMATO CON BLOQUE DE CITA Y SALTO DE LÍNEA ---
            const captionText = 
`❀ Título » ${videoData.title || 'Sin descripción'}

> ❏ Vistas » ${vistas}
> 💬 Comentarios » ${comentarios}
> ✰ Likes » ${likes}

> ✐ Música » ${videoData.music_info?.title || videoData.music || 'Audio original'}`;

            // Enviar el video
            await Minato.sendMessage(m.chat, {
                video: videoBuffer,
                caption: captionText,
                mimetype: 'video/mp4'
            }, { quoted: m.raw });

        } catch (e) {
            console.error('Error en el comando tiktok:', e);
            Minato.sendMessage(
                m.chat, 
                { text: '❌ Ocurrió un error al procesar el video de TikTok. Inténtalo nuevamente.' }, 
                { quoted: m.raw }
            );
        }
    }
};
