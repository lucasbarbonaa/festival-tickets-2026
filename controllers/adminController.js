const { db, admin } = require('../firebase/init');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const bcrypt = require('bcryptjs');

const adminController = {
    getStats: async (req, res) => {
        try {
            const ticketsSnap = await db.collection('tickets').get();
            let totalRevenue = 0, totalSold = 0, pendingApproval = 0;
            ticketsSnap.forEach(doc => {
                const t = doc.data();
                if (t.status === 'valid' || t.status === 'used') {
                    totalRevenue += Number(t.price || 0);
                    totalSold++;
                } else if (t.status === 'pending') pendingApproval++;
            });
            const batchDoc = await db.collection('inventory').doc('active_batch').get();
            const usersSnap = await db.collection('users').get();

            res.json({
                totalRevenue: Math.round(totalRevenue),
                totalSold,
                pendingApproval,
                totalUsers: usersSnap.size,
                currentBatch: batchDoc.exists ? batchDoc.data() : null
            });
        } catch (err) {
            logger.error(`getStats: ${err.message}`);
            res.status(500).json({ error: 'Error estadísticas' });
        }
    },

    getPendingTickets: async (req, res) => {
        try {
            const snap = await db.collection('tickets')
                .where('status', '==', 'pending')
                .orderBy('createdAt', 'desc')  
                .get();

            const tickets = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            res.json(tickets);
        } catch (err) {
            if (err.message.includes('orderBy') || err.code === 'failed-precondition') {
                console.warn('Fallback: ordenando sin createdAt porque falta en algunos docs');
                const fallbackSnap = await db.collection('tickets')
                .where('status', '==', 'pending')
                .get();
                const tickets = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return res.json(tickets);
            }
            console.error('Error real en getPendingTickets:', err);
            res.status(500).json({ error: 'Error al obtener pendientes' });
        }
    },

    approveTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const ticketRef = db.collection('tickets').doc(id);
            const invRef = db.collection('inventory').doc('active_batch');

            await db.runTransaction(async (transaction) => {
                const ticketDoc = await transaction.get(ticketRef);
                if (!ticketDoc.exists || ticketDoc.data().status !== 'pending') throw new Error('Ticket inválido o ya procesado');

                const invDoc = await transaction.get(invRef);
                if (!invDoc.exists || invDoc.data().stock < 1) throw new Error('Stock insuficiente');

                transaction.update(ticketRef, {
                    status: 'valid',
                    approvedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                transaction.update(invRef, {
                    stock: admin.firestore.FieldValue.increment(-1),
                    sold: admin.firestore.FieldValue.increment(1)
                });
            });

            const finalTicket = (await ticketRef.get()).data();
            if (finalTicket.email) {
                emailService.sendTicketEmail(finalTicket.email, {
                    ticketId: id,
                    fullName: finalTicket.fullName,
                    batchName: finalTicket.batchName
                }).catch(e => logger.error("Error email: " + e.message));
            }

            res.json({ success: true });
        } catch (err) {
            res.status(400).json({ error: err.message || 'Error al aprobar' });
        }
    },

    updateInventory: async (req, res) => {
        try {
            const { name, price, stock } = req.body;
            await db.collection('inventory').doc('active_batch').set({
                name, price: Number(price), stock: Number(stock),
                active: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Error al actualizar inventario' });
        }
    },

    getUsers: async (req, res) => {
        try {
            const snap = await db.collection('users').get();
            const users = snap.docs.map(doc => {
                const { pin, ...userNoPin } = doc.data();
                return userNoPin;
            });
            res.json(users);
        } catch (err) {
            res.status(500).json({ error: 'Error al obtener usuarios' });
        }
    },

    createUser: async (req, res) => {
        try {
            const { username, name, pin, role } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPin = await bcrypt.hash(pin.toString(), salt);

            await db.collection('users').doc(username.toLowerCase()).set({
                username: username.toLowerCase(),
                name,
                pin: hashedPin,
                role,
                active: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Error al crear usuario' });
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            if (id === 'admin') return res.status(400).json({ error: 'No puedes borrar al admin principal' });
            await db.collection('users').doc(id).delete();
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Error al eliminar usuario' });
        }
    },

    searchTickets: async (req, res) => {
        const { q } = req.query;
        if (!q) return res.json([]);
        try {
            const snap = await db.collection('tickets').get();
            const results = [];
            const lower = q.toLowerCase();
            snap.forEach(doc => {
                const t = doc.data();
                if (t.fullName.toLowerCase().includes(lower) || String(t.dni).includes(q)) {
                    results.push({ id: doc.id, ...t });
                }
            });
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: 'Error en búsqueda' });
        }
    }
};

module.exports = adminController;