// firebase/init.js
require('dotenv').config();
const admin = require('firebase-admin');

let serviceAccount;

if (process.env.NODE_ENV === 'production' || process.env.FIREBASE_SERVICE_ACCOUNT) {
    // En Render / producción: usa la variable de entorno (string JSON)
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error('Falta FIREBASE_SERVICE_ACCOUNT en variables de entorno (Render)');
    }
    try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Credenciales cargadas desde variable de entorno (producción)');
    } catch (parseErr) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', parseErr);
        throw parseErr;
    }
} else {
    // Local: usa el archivo físico
    const path = require('path');
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
        path.join(__dirname, '../firebase/serviceAccountKey.json'); // ajusta si cambias carpeta
    
    try {
        serviceAccount = require(path.resolve(serviceAccountPath));
        console.log('✅ Credenciales cargadas desde archivo local (desarrollo)');
    } catch (loadErr) {
        console.error('Error cargando serviceAccountKey.json local:', loadErr.message);
        throw loadErr;
    }
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase inicializado correctamente");
}

const db = admin.firestore();
module.exports = { admin, db };