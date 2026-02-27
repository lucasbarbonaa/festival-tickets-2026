const { db } = require('../firebase/init');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const authController = {
    login: async (req, res) => {
        const { username, pin } = req.body;
        try {
            const userRef = db.collection('users').doc(username.toLowerCase().trim());
            const userDoc = await userRef.get();

            if (!userDoc.exists) return res.status(401).json({ error: 'Credenciales inválidas' });

            const user = userDoc.data();
            if (!user.active) return res.status(403).json({ error: 'Cuenta desactivada' });

            const pinMatch = await bcrypt.compare(pin.toString(), user.pin);
            if (!pinMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

            const token = jwt.sign(
                { username: user.username, role: user.role, name: user.name },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ success: true, token, user: { username: user.username, name: user.name, role: user.role } });
        } catch (err) {
            logger.error(`Error en login: ${err.message}`);
            res.status(500).json({ error: 'Error en el servidor' });
        }
    }
};

module.exports = authController;