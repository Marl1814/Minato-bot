const fs = require('fs');
const path = require('path');

global.lastRoll = global.lastRoll || {};
const activeRolls = new Set();

module.exports = {
    name: 'rollwaifu',
    aliases: ['rw', 'roll'],
    category: 'gacha',
    description: 'Obtén un personaje aleatorio.',
    execute: async ({ Minato, m }) => {
        const userId = m.sender;
        const chatId = m.chat;

        if (activeRolls.has(userId)) return;

        try {
            // Validar que sea un grupo
            const groupMetadata = await Minato.groupMetadata(chatId).catch(() => null);
            if (!groupMetadata) {
                return m.reply("❌ Este comando solo funciona en grupos.");
            }

            activeRolls.add(userId);

            // Ruta base hacia la carpeta de personajes
            const baseDir = path.join(process.cwd(), 'personajes');

            if (!fs.existsSync(baseDir)) {
                activeRolls.delete(userId);
                return m.reply("❌ La carpeta 'personajes' no existe en la raíz del proyecto.");
            }

            // Función para elegir un personaje al azar dentro de la estructura
            const seleccionarPersonaje = () => {
                const generos = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
                if (generos.length === 0) return null;
                const gen = generos[Math.floor(Math.random() * generos.length)];
                const genPath = path.join(baseDir, gen);

                const animes = fs.readdirSync(genPath).filter(f => fs.statSync(path.join(genPath, f)).isDirectory());
                if (animes.length === 0) return null;
                const ani = animes[Math.floor(Math.random() * animes.length)];
                const aniPath = path.join(genPath, ani);

                const personajes = fs.readdirSync(aniPath).filter(f => fs.statSync(path.join(aniPath, f)).isDirectory());
                if (personajes.length === 0) return null;
                const per = personajes[Math.floor(Math.random() * personajes.length)];
                const perPath = path.join(aniPath, per);

                const imagenes = fs.readdirSync(perPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
                if (imagenes.length === 0) return null;
                const img = imagenes[Math.floor(Math.random() * imagenes.length)];

                return { per, ani, gen, imgPath: path.join(perPath, img) };
            };

            const resultado = seleccionarPersonaje();

            if (!resultado) {
                activeRolls.delete(userId);
                return m.reply("❌ No se encontraron imágenes válidas dentro de las carpetas de personajes.");
            }

            const personajeElegido = resultado.per;
            const animeElegido = resultado.ani;
            const generoTexto = resultado.gen.toLowerCase().includes('fem') ? 'Mujer' : 'Hombre';
            const imagenBuffer = fs.readFileSync(resultado.imgPath);

            // Plantilla limpia del mensaje
            const mensaje = `❀ Nombre » *${personajeElegido}*\n` +
                            `⚥ Genero » *${generoTexto}*\n` +
                            `❖ Fuente » *${animeElegido}*`;

            // Enviar la imagen con el texto
            const enviado = await Minato.sendMessage(chatId, { 
                image: imagenBuffer, 
                caption: mensaje 
            }, { quoted: m.raw });

            // Guardado temporal básico en memoria
            global.lastRoll[enviado.key.id] = {
                personaje: personajeElegido,
                anime: animeElegido,
                genero: generoTexto,
                autorTiro: userId,
                tiempoTiro: Date.now()
            };

            setTimeout(() => { delete global.lastRoll[enviado.key.id]; }, 600000);

            activeRolls.delete(userId);
        } catch (error) {
            console.error('Error en #rollwaifu:', error);
            activeRolls.delete(userId);
        }
    }
};
