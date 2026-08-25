const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { parseMessage } = require('./system/messageParser');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const express = require('express');

// --- BASE DE DATOS LOCAL ---
const DB_PATH = path.join(__dirname, 'database.json');
let db = { users: {}, disabledGroups: [] };

function loadDatabase() {
    if (fs.existsSync(DB_PATH)) {
        try {
            db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            if (!db.users) db.users = {};
            if (!db.disabledGroups) db.disabledGroups = [];
        } catch (e) {
            console.error('Error al cargar database.json:', e);
        }
    } else {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
}
loadDatabase();

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
                setTimeout(() => startBot(), 3000);
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

            // --- EVALUACIÓN DE CONTEXTO Y PERMISOS ---
            const isGroup = m.chat.endsWith('@g.us');
            const owners = ['51900000000@s.whatsapp.net']; // Coloca tu número de creador/dueño aquí
            const isOwner = owners.includes(m.sender);

            let isAdmin = false;
            if (isGroup) {
                const groupMetadata = await Minato.groupMetadata(m.chat).catch(() => ({ participants: [] }));
                const participants = groupMetadata.participants || [];
                isAdmin = participants.some(p => p.admin !== null && p.id === m.sender);
            }

            const isBotOff = db.disabledGroups.includes(m.chat);

            // Bloquear respuesta a cualquier comando si el grupo está apagado (excepto minon)
            if (isGroup && isBotOff && commandName !== 'minon') return;

            // --- COMANDO APAGAR (minoff) ---
            if (commandName === 'minoff' && isGroup) {
                if (!isOwner && !isAdmin) return;
                if (db.disabledGroups.includes(m.chat)) return;

                db.disabledGroups.push(m.chat);
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
                return await Minato.sendMessage(m.chat, { text: '❀ Bot desactivado para este grupo.' }, { quoted: m.raw });
            }

            // --- COMANDO ENCENDER (minon) ---
            if (commandName === 'minon' && isGroup) {
                if (!isOwner && !isAdmin) return;
                if (!db.disabledGroups.includes(m.chat)) return;

                db.disabledGroups = db.disabledGroups.filter(id => id !== m.chat);
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
                return await Minato.sendMessage(m.chat, { text: '❀ Bot reactivado.' }, { quoted: m.raw });
            }

            // --- EJECUCIÓN DEL RESTO DE COMANDOS ---
            const command = Minato.commands.get(commandName);
            if (command) {
                console.log(`[COMANDO]: #${commandName} | Por: ${m.senderName || m.sender}`);
                await command.execute({ Minato, m, args, db }).catch(err => {
                    console.error(`Error al ejecutar #${commandName}:`, err);
                });
            }

        } catch (err) {
            console.error('Error en el enrutador de mensajes:', err);
        }
    });
}

startBot();
