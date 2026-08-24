const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const EXAMPLE_LINK = 'https://www.mediafire.com/file/example_sample_file.zip/file';
const CHUNK_SIZE_MB = 90; 
const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024;

async function getMediafireInfo(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const $ = cheerio.load(data);
        
        const downloadUrl = $('#downloadButton').attr('href');
        const fileName = $('.dl-btn-label').attr('title') || $('.filename').text().trim() || 'archivo_mediafire';
        const fileSizeText = $('.dl-info .details li span').first().text().trim() || 'Desconocido';

        if (!downloadUrl) return null;

        return { downloadUrl, fileName, fileSizeText };
    } catch (e) {
        return null;
    }
}

module.exports = {
    name: 'mediafire',
    aliases: ['mf', 'mfdown', 'mediafirefile'],
    category: 'descargas',
    description: 'Descarga archivos de MediaFire (divide archivos pesados en partes si sobrepasan el límite).',
    async execute({ Minato, m, args }) {
        let text = args.join(' ');

        const isMediafire = /(https?:\/\/)?(www\.)?mediafire\.com\/.+/i.test(text);

        if (!text || !isMediafire) {
            return Minato.sendMessage(
                m.chat, 
                { 
                    text: `Enlace no válido o faltante.\n\nPor favor, proporciona un enlace correcto de MediaFire.\n\n> Ejemplo » #mediafire ${EXAMPLE_LINK}` 
                }, 
                { quoted: m.raw }
            );
        }

        await Minato.sendMessage(m.chat, { text: 'Procesando descarga de MediaFire...' }, { quoted: m.raw });

        try {
            const fileInfo = await getMediafireInfo(text);

            if (!fileInfo) {
                return Minato.sendMessage(
                    m.chat, 
                    { text: `No se pudo extraer el archivo de MediaFire. Asegúrate de que el enlace no haya expirado.\n\n> Ejemplo » ${EXAMPLE_LINK}` }, 
                    { quoted: m.raw }
                );
            }

            const { downloadUrl, fileName, fileSizeText } = fileInfo;

            const infoText = 
`❀ Nombre » ${fileName}

> ❏ Tamaño » *${fileSizeText}*
> 🔗 URL » ${text}

> status » Procesando archivo...`;

            await Minato.sendMessage(m.chat, { text: infoText }, { quoted: m.raw });

            const tempDir = path.join(__dirname, '../../tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filePath = path.join(tempDir, safeFileName);

            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const stats = fs.statSync(filePath);
            const totalBytes = stats.size;

            if (totalBytes > CHUNK_SIZE_BYTES) {
                const totalParts = Math.ceil(totalBytes / CHUNK_SIZE_BYTES);

                await Minato.sendMessage(m.chat, {
                    text: `El archivo supera el límite permitido (${fileSizeText}).\nSe enviará dividido en *${totalParts} partes*.`
                }, { quoted: m.raw });

                const fileStream = fs.createReadStream(filePath, { highWaterMark: CHUNK_SIZE_BYTES });
                let partIndex = 1;

                for await (const chunk of fileStream) {
                    const ext = path.extname(safeFileName);
                    const baseName = path.basename(safeFileName, ext);
                    const partFileName = `${baseName}-part${partIndex}${ext}`;
                    const partPath = path.join(tempDir, partFileName);

                    fs.writeFileSync(partPath, chunk);

                    await Minato.sendMessage(m.chat, {
                        document: fs.readFileSync(partPath),
                        mimetype: 'application/octet-stream',
                        fileName: partFileName
                    }, { quoted: m.raw });

                    if (fs.existsSync(partPath)) fs.unlinkSync(partPath);
                    partIndex++;
                }

            } else {
                await Minato.sendMessage(m.chat, {
                    document: fs.readFileSync(filePath),
                    mimetype: 'application/octet-stream',
                    fileName: safeFileName
                }, { quoted: m.raw });
            }

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        } catch (e) {
            console.error('Error en comando MediaFire:', e);
            Minato.sendMessage(
                m.chat, 
                { text: `Ocurrió un error al intentar descargar el archivo de MediaFire.\n\n> Ejemplo » ${EXAMPLE_LINK}` }, 
                { quoted: m.raw }
            );
        }
    }
};
