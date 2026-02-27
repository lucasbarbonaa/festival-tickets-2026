// server.js
require('dotenv').config();
require('./firebase/init');           // Inicializa Firebase (debe estar antes de todo)

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();

// ── Middlewares de seguridad ────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false,           // Desactivado temporalmente para permitir QR y fuentes externas
    // Si después quieres activarlo, configura directivas específicas
}));

app.use((req, res, next) => {
    if (req.method === 'POST') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

app.use(cors());                            // Permite solicitudes desde el frontend (ajusta en prod)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting básico (protección contra abuso)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,           // 15 minutos
    max: 150,                           // límite de 150 solicitudes por IP
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// ── Archivos estáticos ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas API ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Rutas para páginas HTML específicas ─────────────────────────────────────
app.get('/:page.html', (req, res) => {
    const filePath = path.join(__dirname, 'public', `${req.params.page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Página no encontrada');
        }
    });
});

// ── Fallback para SPA o rutas no encontradas ────────────────────────────────
app.get('*', (req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'Ruta API no encontrada' });
    }
    // Para cualquier otra ruta → sirve el index.html (SPA behavior)
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Manejador global de errores (SIEMPRE al final) ──────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ┌─────────────────────────────────────────────────────────────┐
    │  SISTEMA DE TICKETS - FESTIVAL 2026                         │
    │  Servidor corriendo en: http://localhost:${PORT}             │
    │  Entorno: ${process.env.NODE_ENV || 'development'}          │
    └─────────────────────────────────────────────────────────────┘
    `);
});

// Manejo de cierre graceful (opcional pero recomendado)
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido. Cerrando servidor...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Excepción no capturada:', err);
    process.exit(1);
});