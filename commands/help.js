const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../config.json');

module.exports = {
    name: 'help',
    aliases: ['menu', 'ayuda', 'commands'],
    execute: async ({ Minato, m }) => {
        // --- VALORES POR DEFECTO ---
        let menuImg = 'https://i.pinimg.com/1200x/1f/71/20/1f7120ba68aec7ac131bc0c27152da89.jpg';
        let menuTitle = '🏮 MIYATO MULTI-DEVICE 🏮';
        let botDisplayName = 'Miyato-Bot'; // Nombre para el diseño del texto

        // --- CARGAR PERSONALIZACIÓN ---
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config.menuImage) menuImg = config.menuImage;
            if (config.menuTitle) menuTitle = config.menuTitle;
            // Si existe botName en el config, lo usamos para el encabezado del diseño
            if (config.botName) botDisplayName = config.botName;
        }

        const getRaw = (jid) => jid ? jid.split('@')[0].split(':')[0] : '';
        const senderNumber = getRaw(m.sender);

        // Aquí usamos ${botDisplayName} para que el encabezado sea interactivo
        const menuText = `
╭───〔 *${botDisplayName}* 〕───┈
│
│ 👤 *Usuario:* @${senderNumber}
│ 🤖 *Estado:* Online
│ 🛠️ *Prefijo:* [ # ]
├───〔 *PERFIL* 〕───┈
⚘ *#setbirth*
> Establece tu fecha de cumpleaños.
⚘ *#setdesc*
> Establecer tu descripcion.
⚘ *#setfav*
> Tu clain favorito.
⚘ *#marry* @tag 
> Casarse.
⚘ *#divorce* @tag 
> Divorciarse.
⚘ *#setgenre* 
> Establece tu genero.
⚘ *#delgenre* 
> Elimina tu genero
⚘ *#profile* ‹mencion›
> Ver tu perfil.
├───〔 *STICKERS* 〕───┈
⚘ *#s* - imagen
> crea stikers usando imagenes.
├───〔 *Economia* 〕───┈
⚘ *#coinflip* 
*#flip* *#cf*
> Apostar coins en un cara o cruz.
⚘ *#roulette* 
*#rt* red/black
> Apostar coins en una ruleta.
⚘ *#bal* ‹mencion›
> Ver cuantos coins tienes.
⚘ *#crime*
> Ganar coins rapido.
⚘ *#daily* 
> Reclamar tu recompensa diaria.
⚘ *#d all*
> Depositar tus coins en el banco.
⚘ *#pay* ‹mencion›
> Dar coins a un usuario.
⚘ *#slut*
> Ganar coins prostituyendote.
⚘ *#rob* ‹mencion›
> Intentar robar coins a un usuario.
⚘ *#eboard* *#baltop* *#topcoins*
> Top usuarios con mas coins.
⚘ *#with*
> Retirar tus coins en el banco. 
⚘ *#work* *#w* 
> Ganar coins trabajando.
│├───〔 *DESCARGAS* 〕───┈
⚘ *#ig* *#reel* URL
> descarga un reel de Instagram.
⚘ *#tiktok* URL
> descarga un video de tiktok.
⚘ *#mp4* (nombre/link)
> Descargar un video de YouTube.
⚘ *#r34* *#rule34*
> Descarga una imagen de la rule.
├───〔 *Gacha* 〕───┈
⚘ *#wimage* *#charimage* 
*#waifuimage* *#cimage*
> Ver una imagen aleatoria de un personaje.
⚘ *#winfo* *#charinfo* *#waifuinfo*
> Ver información de un personaje.
⚘ *#claim* *#c* *#reclamar* {citar personaje}
> Reclamar un personaje.
⚘ *#gachainfo* *#ginfo* *#infogacha*
> Ver tu información de gacha.
⚘ *#giveallharem* ‹mencion›
> Regalar todos tus personajes a otro usuario.
⚘ *#givechar* *#givewaifu* 
*#regalar* ‹mencion› [nombre]
> Regalar un personaje a otro usuario.
⚘ *#delchar* [nombre de personaje]
> Elimina un personaje de tu harem personal.
⚘ *#harem* *#waifus* 
*#claims* ‹mencion›
> Ver tus personajes reclamados.
⚘ *#rollwaifu* *#rw*
*#roll*
> Waifu aleatorio.
⚘ *#serieinfo* *#ainfo*
*#animeinfo* [nombre]
> Información de un anime.
⚘ *#serielist* *#slist*
*#animelist*
> Listar series del bot.
⚘ *#uinfo*
> Muestra el ranking de usuarios convertidos del grupo actual.
⚘ *#vote* *#votar*
[nombre]
> votar por un personaje para subir su valor.
⚘ *#suggest* *#add*
> Envia una sugerencia de un anime o personaje.
├───〔 *REACCIONES* 〕───┈
⚘ *#bite* ‹mencion›
> Muerde a alguien.
⚘ *#blush* ‹mencion›
> Sonrojarte.
⚘ *#cry* ‹mencion›
> Expresar tristeza.
⚘ *#smile* ‹mencion›
> Salta de felicidad.
⚘ *#hug* ‹mencion›
> Dar un abrazo.
⚘ *#kill* ‹mencion›
> Toma tu arma y mata a alguien.
⚘ *#kiss* ‹mencion›
> Dar un beso.
⚘ *#lick* ‹mencion›
> Lamer a alguien.
⚘ *#pat* ‹mencion›
> Acaricia a alguien.
⚘ *#poke* *#punch*
‹mencion›
> Picar a alguien.
⚘ *#bonk* ‹mencion›
> Golpear a alguien.
⚘ *#yeet* ‹mencion›
> Lanzar a alguien.
⚘ *#slap* ‹mencion›
> Dar una bofetada.
├──────〔 *NSFW* 〕──────┈
⚘ *#bj* ‹mencion›
> Dar una mamada.
⚘ *#cum* ‹mencion›
> Venirse en alguien.
├──〔 *Administración* 〕──┈
⚘ *#kick* 
> Expulsar a un usuario.
⚘ *#promote*
> Promover usaurio a administrador.
⚘ *#close*
> Cerrar grupo.
⚘ *#open*
> Abrir al grupo.
⚘ *#tag* 
> Envía un mensaje mencionando a todos los usuarios del grupo.
⚘ *#convertir* 
*#transformar* *#fichar* ‹mencion›
> Convierte a un usuario en un personaje.
⚘ *#clearwaifus* 
*#liberar* *#resetw* ‹mencion›
> Libera los personajes de un usuario
⚘ *#warn* ‹mencion› 
> Dar una advertencia a un usuario.
⚘ *#warns* ‹mencion› 
> Ver las advertencias de un usuario.
⚘ *#delwarn* ‹mencion› 
> Elimina todas las advertencias de un usuario.
⚘ *#boton* 
> Activar bot.
⚘ *#botoff* 
> Apagar bot.
├────〔 *Solo-bot* 〕───┈
⚘ *#setmenu* [ imagen]
> Cambiar la imagen del menu.
⚘ *#setbotname*
> Cambiar el nombre del menu del bot.
⚘ *#setcoin*
> Cambiar la moneda del bot.
╰───────────────┈
> *${botDisplayName}* - Sistema de entretenimiento.`;

        await Minato.sendMessage(m.chat, {
            text: menuText,
            mentions: [m.sender],
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: menuTitle, 
                    body: 'Menú de Comandos Interactivos',
                    thumbnailUrl: menuImg, 
                    sourceUrl: '',
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m.raw });
    }
};