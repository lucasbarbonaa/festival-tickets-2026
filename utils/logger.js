// logger.js
const winston = require('winston');
const path = require('path');

// Determinar si estamos en producción o desarrollo
const isProduction = process.env.NODE_ENV === 'production';

// Formato común para todos los logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;
        
        // Agregar metadata si existe (por ejemplo: error stack, userId, etc.)
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata, null, 2)}`;
        }
        
        return msg;
    })
);

// Configuración principal del logger
const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',  // más verbose en desarrollo
    
    defaultMeta: { 
        service: 'festival-tickets-2026' 
    },
    
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()  // formato JSON para archivos
    ),
    
    transports: [
        // 1. Logs de errores en archivo separado (siempre)
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            tailable: true,
            zippedArchive: true
        }),

        // 2. Todos los logs combinados (info y superior)
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 10,
            tailable: true,
            zippedArchive: true
        }),

        // 3. Consola (más bonita en desarrollo)
        new winston.transports.Console({
            level: isProduction ? 'info' : 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                customFormat
            )
        })
    ],

    // Manejo de excepciones no capturadas
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/exceptions.log')
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],

    // Manejo de rechazos no manejados (unhandled promise rejections)
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/rejections.log')
        })
    ]
});

// Agregar un logger para desarrollo más legible si es necesario
if (!isProduction) {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Métodos de conveniencia (opcional, pero muy útiles)
logger.success = function (...args) {
    logger.info(...args);
};

logger.warn = function (...args) {
    logger.warn(...args);
};

module.exports = logger;