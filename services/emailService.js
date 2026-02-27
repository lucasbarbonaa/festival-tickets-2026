// emailService.js
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const emailService = {
    /**
     * Envía el email con el ticket (incluye QR generado como imagen embebida)
     * @param {string} to - email del destinatario
     * @param {Object} data - información del ticket
     * @param {string} data.ticketId - ID del documento en Firestore
     * @param {string} data.fullName - nombre completo
     * @param {string} data.batchName - nombre de la tanda/preventa
     */
    sendTicketEmail: async (to, data) => {
        try {
            if (!to || !data?.ticketId || !data?.fullName) {
                throw new Error('Faltan datos obligatorios para enviar email');
            }

            // Generar QR con el ID del ticket (lo que escanea el staff)
            const qrDataURL = await QRCode.toDataURL(data.ticketId, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 400
            });

            const mailOptions = {
                from: `"Zapucay Patio Criollo" <${process.env.EMAIL_USER}>`,
                to,
                subject: '¡Tu entrada para el evento ya está lista!',
                html: `
                    <div style="font-family: sans-serif; text-align: center; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; border-radius: 12px;">
                        <h1 style="color: #00ff88; margin-bottom: 10px;">¡Bienvenid@, ${data.fullName}!</h1>
                        <p style="font-size: 1.1rem; color: #333;">Tu pago ha sido confirmado. Aquí tienes tu entrada oficial.</p>
                        
                        <div style="background: #f9f9f9; padding: 25px; border-radius: 12px; margin: 25px 0; display: inline-block;">
                            <img src="cid:ticketqr" alt="Código QR de entrada" width="220" style="margin-bottom: 15px;"/>
                            <p style="font-size: 1.1rem; margin: 8px 0;"><strong>ID de entrada:</strong> ${data.ticketId}</p>
                            <p style="font-size: 1.1rem; margin: 8px 0;"><strong>Tanda:</strong> ${data.batchName}</p>
                        </div>

                        <p style="color: #555; font-size: 0.95rem; margin-top: 20px;">
                            Presenta este código QR en la entrada junto con tu DNI.
                        </p>
                        <p style="color: #777; font-size: 0.85rem; margin-top: 30px;">
                            ¡Nos vemos en el Festival 2026!
                        </p>
                    </div>
                `,
                attachments: [{
                    filename: 'Zapucay-Patio-Criollo-qr.png',
                    content: qrDataURL.split("base64,")[1],
                    encoding: 'base64',
                    cid: 'ticketqr'
                }]
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email enviado a ${to} → MessageId: ${info.messageId}`);
            return info;

        } catch (err) {
            logger.error(`Error enviando email a ${to}: ${err.message}`);
            throw err;
        }
    }
};

module.exports = emailService;