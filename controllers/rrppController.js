const { db, admin } = require('../firebase/init');
const logger = require('../utils/logger');
const inventoryService = require('../services/inventoryService');

const rrppController = {
    getStats: async (req, res) => {
        const username = req.user.username;
        try {
            const snap = await db.collection('tickets')
                .where('promoter', '==', username)
                .where('status', 'in', ['valid', 'used'])
                .get();

            let totalTickets = snap.size;
            let totalRevenue = 0;

            const sales = snap.docs.map(doc => {
                const data = doc.data();
                totalRevenue += Number(data.price || 0);
                return {
                    id: doc.id,
                    fullName: data.fullName,
                    dni: data.dni,
                    createdAt: data.createdAt?.toDate?.() || null,
                    status: data.status,
                    price: data.price
                };
            });

            res.json({
                totalTickets,
                totalRevenue: Math.round(totalRevenue),
                sales: sales.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            });
        } catch (err) {
            logger.error(`Error getStats RRPP: ${err.message}`);
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        }
    },
    /*
    sellDirect: async (req, res) => {
        const { fullName, dni, email, whatsapp, quantity = 1 } = req.body;
        const promoter = req.user.username;

        try {
            const batch = await inventoryService.getActiveBatch();
            if (!batch || !batch.active) return res.status(400).json({ error: 'No hay tanda activa' });
            if (batch.stock < quantity) return res.status(400).json({ error: `Solo quedan ${batch.stock} entradas` });

            const ticketsCreados = await db.runTransaction(async (transaction) => {
                const inventoryRef = db.collection('inventory').doc('active_batch');
                const invDoc = await transaction.get(inventoryRef);
                if (invDoc.data().stock < quantity) throw new Error('Stock insuficiente');

                const newTickets = [];
                for (let i = 0; i < quantity; i++) {
                    const ticketRef = db.collection('tickets').doc();
                    const ticketData = {
                        fullName: fullName.trim(),
                        dni: dni.trim(),
                        email: email ? email.toLowerCase().trim() : null,
                        whatsapp: whatsapp ? whatsapp.trim() : null,
                        promoter,
                        batchName: batch.name,
                        price: batch.price,
                        status: 'valid',
                        paymentStatus: 'paid_cash',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        soldBy: promoter
                    };
                    transaction.set(ticketRef, ticketData);
                    newTickets.push({ id: ticketRef.id });
                }

                transaction.update(inventoryRef, {
                    stock: admin.firestore.FieldValue.increment(-quantity),
                    sold: admin.firestore.FieldValue.increment(quantity)
                });

                return newTickets;
            });

            logger.info(`Venta RRPP: ${promoter} vendió ${quantity} tickets`);
            res.status(201).json({ success: true, tickets: ticketsCreados });
        } catch (err) {
            logger.error(`Error sellDirect: ${err.message}`);
            res.status(400).json({ error: err.message || 'Error al procesar venta' });
        }
    }
    */
};

module.exports = rrppController;