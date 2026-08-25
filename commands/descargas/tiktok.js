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

            let videoUrl = null;
            let captionText = '';

            // --- MÉTODO 1: TikWM (Príncipe / Búsqueda) ---
            try {
                let videoData = null;
                if (isLink) {
                    const response = await axios.post('https://www.tikwm.com/api/', 
                        new URLSearchParams({ url: text, hd: '1' }), 
                        {
                            headers: { 
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            },
                            timeout: 10000
                        }
                    );
                    videoData = response.data?.data;
                } else {
                    const searchRes = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(text)}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                        timeout: 10000
                    });
                    const videoList = searchRes.data?.data?.videos;
                    if (videoList && videoList.length > 0) videoData = videoList[0];
                }

                if (videoData) {
                    videoUrl = videoData.hdplay || videoData.play;
                    if (videoUrl && !videoUrl.startsWith('http')) {
                        videoUrl = 'https://www.tikwm.com' + videoUrl;
                    }

                    const vistas = videoData.play_count ? `*${videoData.play_count.toLocaleString()}*` : '*0*';
                    const comentarios = videoData.comment_count ? `*${videoData.comment_count.toLocaleString()}*` : '*0*';
                    const likes = videoData.digg_count ? `*${videoData.digg_count.toLocaleString()}*` : '*0*';

                    captionText = 
`❀ Título » ${videoData.title || 'Sin descripción'}

> ❏ Vistas » ${vistas}
> 💬 Comentarios » ${comentarios}
> ✰ Likes » ${likes}

> ✐ Música » ${videoData.music_info?.title || videoData.music || 'Audio original'}`;
                }
            } catch (errTikwm) {
                console.log('[TikTok] TikWM falló en Render, intentando API de respaldo...');
            }

            // --- MÉTODO 2: API Respaldo (Si TikWM es bloqueado en Render) ---
            if (!videoUrl && isLink) {
                const backupRes = await axios.get(`https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(text)}`, {
                    timeout: 12000
                });

                if (backupRes.data?.status && backupRes.data?.data) {
                    const data = backupRes.data.data;
                    videoUrl = data.meta?.media?.find(m => m.type === 'video')?.org || data.meta?.media[0]?.org;
                    
                    const vistas = data.stats?.views ? `*${data.stats.views.toLocaleString()}*` : '*0*';
                    const comentarios = data.stats?.comment ? `*${data.stats.comment.toLocaleString()}*` : '*0*';
                    const likes = data.stats?.like ? `*${data.stats.like.toLocaleString()}*` : '*0*';

                    captionText = 
`❀ Título » ${data.title || 'Sin descripción'}

> ❏ Vistas » ${vistas}
> 💬 Comentarios » ${comentarios}
> ✰ Likes » ${likes}

> ✐ Autor » *${data.author?.nickname || 'Desconocido'}*`;
                }
            }

            if (!videoUrl) {
                return Minato.sendMessage(
                    m.chat, 
                    { text: '❌ No se pudo extraer el video desde los servidores en la nube. Intenta con otro enlace.' }, 
                    { quoted: m.raw }
                );
            }

            // --- ENVIAR VIDEO MEDIANTE TRANSMISIÓN DIRECTA POR URL ---
            // Esto evita descargas completas en la memoria RAM restringida de Render
            await Minato.sendMessage(m.chat, {
                video: { url: videoUrl },
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
