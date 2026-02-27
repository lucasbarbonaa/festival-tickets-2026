const { db, admin } = require('../firebase/init');

const staffController = {
    checkTicket: async (req, res) => {
        const { query } = req.params;
        try {
            let doc = await db.collection('tickets').doc(query).get();
            if (!doc.exists) {
                const snap = await db.collection('tickets').where('dni', '==', query).limit(1).get();
                if (snap.empty) return res.status(404).json({ error: 'Ticket no encontrado' });
                doc = snap.docs[0];
            }
            res.json({ id: doc.id, ...doc.data() });
        } catch (err) {
            res.status(500).json({ error: 'Error al buscar ticket' });
        }
    },

    validateTicket: async (req, res) => {
        const { id } = req.params;
        try {
            const ref = db.collection('tickets').doc(id);
            const doc = await ref.get();
            if (doc.data().status === 'used') return res.status(400).json({ error: 'Ticket ya utilizado' });

            await ref.update({
                status: 'used',
                usedAt: admin.firestore.FieldValue.serverTimestamp(),
                validatedBy: req.user.username
            });
            res.json({ success: true, attendee: doc.data().fullName });
        } catch (err) {
            res.status(500).json({ error: 'Error al validar' });
        }
    }
};

module.exports = staffController;