const { db, admin } = require('../firebase/init');
const inventoryService = require('../services/inventoryService');

const publicController = {
    getActiveBatch: async (req, res) => {
        try {
            const batch = await inventoryService.getActiveBatch();
            if (!batch) return res.status(404).json({ error: 'No hay tandas activas' });
            res.json(batch);
        } catch (err) {
            res.status(500).json({ error: 'Error al consultar batch' });
        }
    },

    getPublicTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const doc = await db.collection('tickets').doc(id).get();
            if (!doc.exists) return res.status(404).json({ error: 'Ticket no encontrado' });
            const data = doc.data();
            res.json({
                id: doc.id,
                fullName: data.fullName,
                dni: data.dni,
                batchName: data.batchName,
                status: data.status
            });
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener ticket' });
        }
    },

    buyTicket: async (req, res) => {
        const { fullName, dni, email, whatsapp, quantity = 1 } = req.body;
        const promoter = req.body.promoter || 'web';

        try {
            await db.runTransaction(async (transaction) => {
                const invRef = db.collection('inventory').doc('active_batch');
                const invDoc = await transaction.get(invRef);

                if (!invDoc.exists || invDoc.data().stock < quantity) {
                    throw new Error('Stock insuficiente');
                }

                for (let i = 0; i < quantity; i++) {
                    const ticketRef = db.collection('tickets').doc();
                    transaction.set(ticketRef, {
                        fullName: fullName.trim(),
                        dni: dni.trim(),
                        email: email ? email.toLowerCase().trim() : null,
                        whatsapp: whatsapp ? whatsapp.trim() : null,
                        batchName: invDoc.data().name,
                        price: invDoc.data().price,
                        status: 'pending',
                        promoter,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            });

            res.status(201).json({ success: true, message: 'Solicitud recibida. Realiza el pago.' });
            console.log('Compra exitosa, enviando 201');
        } catch (err) {
            res.status(400).json({ error: err.message });
            console.error('Error real en compra:', err);
            res.status(400).json({ error: err.message || 'Error al procesar la solicitud' });
        }
    }
};

module.exports = publicController;