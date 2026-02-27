require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');

if (!admin.apps.length) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("🔥 Firebase inicializado correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error.message);
    }
}

const db = admin.firestore();
module.exports = { admin, db };