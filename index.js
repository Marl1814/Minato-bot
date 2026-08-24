const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { parseMessage } = require('./system/messageParser');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// --- CARGADOR RECURSIVO DE COMANDOS (Escanea subcarpetas) ---
function loadCommands(dir, commandsMap) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadCommands(fullPath, commandsMap); // Explora carpetas como "pegatinas"
        } else if (file.endsWith('.js')) {
            delete require.cache[require.resolve(fullPath)];
            const command = require(fullPath);
            if (command.name) {
                commandsMap.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => commandsMap.set(alias, command));
                }
            }
        }
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const Minato = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    });

    Minato.ev.on('creds.update', saveCreds);

    Minato.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'open') console.log('❀ Minato-Bot Conectado y Listo para Stickers');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        }
    });

    // Cargar mapa de comandos desde carpetas
    Minato.commands = new Map();
    const commandsFolder = path.join(__dirname, 'commands');
    loadCommands(commandsFolder, Minato.commands);

    // Escuchar mensajes
    Minato.ev.on('messages.upsert', async (rawMsg) => {
        try {
            const parsed = parseMessage(Minato, rawMsg);
            if (!parsed || !parsed.m) return;
            const { m } = parsed;

            // Evitar procesar mensajes viejos
            const messageTimestamp = m.raw.messageTimestamp; 
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if ((currentTimestamp - messageTimestamp) > 300) return; 

            const msgText = (m.text || "").trim();
            if (!msgText.startsWith('#')) return;

            const args = msgText.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Buscar y ejecutar comando (ej: #s o #sticker)
            const command = Minato.commands.get(commandName);
            if (command) {
                console.log(`[STICKER / COMANDO]: #${commandName} | Por: ${m.senderName || m.sender}`);
                await command.execute({ Minato, m, args });
            }

        } catch (err) {
            console.error('Error en el enrutador de mensajes:', err);
        }
    });
}

startBot();
