// Archivo: htmlTransport.js
const { randomBytes } = require('crypto');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

// ID oficial del bot de IA en Meta/WhatsApp
const RICH_BOT_JID = "867051314767696@bot";

/**
 * Transporta un mini juego HTML dentro del formato richResponse
 * para que WhatsApp lo renderice como una interfaz interactiva.
 */
async function sendHtmlGame(socket, chatId, html, title) {
    const userJid = socket.user?.id || socket.user?.jid;
    if (!userJid) {
        throw new Error('La sesión de WhatsApp todavía no está autenticada.');
    }

    const responseId = `game-${Date.now()}-${randomBytes(4).toString('hex')}`;

    // Estructura de la pantalla que procesa WhatsApp
    const payload = {
        response_id: responseId,
        sections: [
            {
                view_model: {
                    primitive: {
                        __typename: 'GenAIaeacdsnwHtmlPrimitive',
                        payload: html, // Todo el HTML + JS del juego va aquí adentro
                        trusted_sources: []
                    },
                    __typename: 'GenAISingleLayoutViewModel'
                }
            }
        ]
    };

    // Objeto modificado para inyectar la simulación del bot de Meta AI
    const messageContent = {
        messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            messageSecret: randomBytes(32).toString('base64'),
            botMetadata: {
                messageDisclaimerText: '',
                botResponseId: responseId,
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    submessages: [
                        { messageType: 2, messageText: title }
                    ],
                    unifiedResponse: {
                        data: Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
                    },
                    contextInfo: {
                        mentionedJid: [],
                        groupMentions: [],
                        statusAttributions: [],
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedAiBotMessageInfo: { botJid: RICH_BOT_JID },
                        forwardOrigin: 4
                    }
                }
            }
        }
    };

    // Empaquetar y enviar el mensaje binario mediante relayMessage
    const message = generateWAMessageFromContent(chatId, messageContent, { userJid });
    await socket.relayMessage(chatId, message.message, {});
    return message;
}

module.exports = { sendHtmlGame };
