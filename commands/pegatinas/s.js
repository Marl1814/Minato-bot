const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

// Convierte y comprime el vídeo directamente a WebP controlando el tamaño
function processVideoToWebp(inputPath, outputPath, duration) {
    return new Promise((resolve, reject) => {
        const targetDuration = 4.5;
        const ptsFactor = duration > 5 ? (targetDuration / duration).toFixed(4) : 1;

        // Filtro para escalar a 320x320 con padding transparente (mantiene relación de aspecto)
        const vfFilter = `fps=10,scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setpts=${ptsFactor}*PTS`;

        ffmpeg(inputPath)
            .setDuration(targetDuration)
            .outputOptions([
                '-an',
                `-vf ${vfFilter}`,
                '-loop 0',
                '-ss 00:00:00',
                '-preset default',
                '-quality 40',
                '-compression_level 6'
            ])
            .toFormat('webp')
            .save(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err));
    });
}

module.exports = {
    name: 's',
    aliases: ['sticker'],
    description: 'Convierte imágenes, videos o stickers en un nuevo sticker.',
    async execute({ Minato, m }) {
        let tempInput = null;
        let tempOutput = null;

        try {
            const quoted = m.raw.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            const imageMsg = m.raw.message?.imageMessage || quoted?.imageMessage;
            const videoMsg = m.raw.message?.videoMessage || quoted?.videoMessage;
            const stickerMsg = m.raw.message?.stickerMessage || quoted?.stickerMessage;

            if (!imageMsg && !videoMsg && !stickerMsg) {
                return Minato.sendMessage(
                    m.chat, 
                    { text: '➶ Responde a una imagen, video o sticker con *#s* para convertirlo ✧' }, 
                    { quoted: m.raw }
                );
            }

            let media, type;
            if (imageMsg) {
                media = imageMsg;
                type = 'image';
            } else if (videoMsg) {
                media = videoMsg;
                type = 'video';
            } else if (stickerMsg) {
                media = stickerMsg;
                type = 'sticker';
            }

            const stream = await downloadContentFromMessage(media, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const authorName = m.raw?.pushName || 'Minato User';

            // Si es video, procesamos compresión pesada con FFmpeg
            if (videoMsg) {
                const segundos = videoMsg.seconds || 0;
                
                const tempDir = path.join(__dirname, '../../tmp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                tempInput = path.join(tempDir, `input_${Date.now()}.mp4`);
                tempOutput = path.join(tempDir, `output_${Date.now()}.webp`);

                fs.writeFileSync(tempInput, buffer);

                await processVideoToWebp(tempInput, tempOutput, segundos);
                
                buffer = fs.readFileSync(tempOutput);

                // Validar que el archivo resultante no exceda 1 MB (1,048,576 bytes)
                if (buffer.length > 950000) {
                    return Minato.sendMessage(
                        m.chat,
                        { text: '☈ El video procesado es demasiado pesado para ser mostrado como sticker.' },
                        { quoted: m.raw }
                    );
                }
            }

            // Generar sticker con metadatos
            const sticker = new Sticker(buffer, {
                pack: '☆ Minato-Bot',
                author: authorName,
                type: StickerTypes.FULL,
                categories: ['🤩', '✨'],
                quality: 30
            });
            
            const stickerBuffer = await sticker.toBuffer();
            
            if (stickerBuffer.length > 0) {
                await Minato.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m.raw });
            } else {
                throw new Error('El Buffer del sticker final quedó vacío');
            }

        } catch (e) { 
            console.error('Error al generar el Sticker:', e);
            Minato.sendMessage(
                m.chat, 
                { text: '☈ Hubo un error al procesar el sticker. Intenta nuevamente.' }, 
                { quoted: m.raw }
            );
        } finally {
            if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        }
    }
};
