const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { parseMessage } = require('./system/messageParser');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const express = require('express');

// --- SERVIDOR EXPRESS PARA EVITAR EL APAGADO EN RENDER ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('❀ Minato-Bot en línea 24/7');
});

app.listen(PORT, () => {
    console.log(`[HTTP] Servidor activo en puerto ${PORT}`);
});

// --- CARGADOR RECURSIVO DE COMANDOS ---
function loadCommands(dir, commandsMap) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            loadCommands(fullPath, commandsMap);
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
        
        if (connection === 'open') {
            console.log('❀ Minato-Bot Conectado y Listo');
        }
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            console.log(`Conexión cerrada (Causa: ${reason}). Reconectando: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                setTimeout(() => startBot(), 3000); // Reconexión suave con retardo
            }
        }
    });

    // Cargar mapa de comandos
    Minato.commands = new Map();
    const commandsFolder = path.join(__dirname, 'commands');
    loadCommands(commandsFolder, Minato.commands);

    // Escuchar mensajes
    Minato.ev.on('messages.upsert', async (rawMsg) => {
        try {
            const parsed = parseMessage(Minato, rawMsg);
            if (!parsed || !parsed.m) return;
            const { m } = parsed;

            // Evitar procesar mensajes antiguos (>5 min)
            const messageTimestamp = m.raw.messageTimestamp; 
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if ((currentTimestamp - messageTimestamp) > 300) return; 

            const msgText = (m.text || "").trim();
            if (!msgText.startsWith('#')) return;

            const args = msgText.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = Minato.commands.get(commandName);
            if (command) {
                console.log(`[COMANDO]: #${commandName} | Por: ${m.senderName || m.sender}`);
                // Captura interna para que fallos en stickers/MediaFire no tumben el proceso
                await command.execute({ Minato, m, args }).catch(err => {
                    console.error(`Error al ejecutar #${commandName}:`, err);
                });
            }

        } catch (err) {
            console.error('Error en el enrutador de mensajes:', err);
        }
    });
}

startBot();
