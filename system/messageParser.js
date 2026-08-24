const parseMessage = (Minato, rawMsg) => {
    const raw = rawMsg.messages[0];
    if (!raw.message || raw.key.remoteJid === 'status@broadcast') return null;

    const type = Object.keys(raw.message)[0];
    const content = raw.message[type];
    
    // 1. Extraer el texto (body)
    const body = raw.message.conversation || 
                 raw.message.extendedTextMessage?.text || 
                 content?.caption || 
                 content?.text || "";

    // 2. BUSCAR MENCIONES EN TODAS PARTES
    // Intentamos obtener contextInfo desde múltiples niveles
    const contextInfo = content?.contextInfo || 
                    raw.message.extendedTextMessage?.contextInfo || 
                    raw.message[type]?.contextInfo;

// BUSQUEDA HÍBRIDA (Singular y Plural)
let mentions = [];
if (contextInfo) {
    // Si viene en plural (estándar) o en singular (tu caso)
    mentions = contextInfo.mentionedJids || contextInfo.mentionedJid || [];
}

// Asegurarnos de que siempre sea un Array
if (!Array.isArray(mentions)) {
    mentions = [mentions];
}

    // 3. Retornar el objeto 'm'
    return {
        Minato,
        m: {
            raw,
            chat: raw.key.remoteJid,
            sender: raw.key.participant || raw.key.remoteJid,
            senderName: raw.pushName || "Usuario",
            text: body.trim(),
            mentions: mentions, // Aquí es donde debe aparecer el ID del amigo
            quoted: contextInfo?.quotedMessage ? {
                sender: contextInfo.participant || contextInfo.remoteJid,
                message: contextInfo.quotedMessage
            } : null
        }
    };
};

module.exports = { parseMessage };