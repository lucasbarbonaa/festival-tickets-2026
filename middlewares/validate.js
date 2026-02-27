/**
 * middlewares/validate.js
 * Esquemas de validación utilizando Joi para asegurar la integridad de los datos.
 */

const Joi = require('joi');

// 1. Esquema para el Login (login.html)
const loginSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
        'string.empty': 'El nombre de usuario es obligatorio',
        'string.min': 'El usuario debe tener al menos 3 caracteres',
        'any.required': 'El usuario es un campo requerido'
    }),
    pin: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
        'any.required': 'El PIN de acceso es obligatorio',
        'string.empty': 'El PIN no puede estar vacío'
    })
});

// 2. Esquema para Compra Pública y Venta RRPP (index.html, checkout.html y rrpp.html)
const ticketPurchaseSchema = Joi.object({
    fullName: Joi.string().trim().min(5).max(100).required().messages({
        'string.empty': 'El nombre completo es obligatorio',
        'string.min': 'Ingresa nombre y apellido completo (mínimo 5 caracteres)'
    }),
    dni: Joi.string().min(7).max(15).required().messages({
        'string.empty': 'El DNI es obligatorio para la validez del ticket',
        'string.min': 'El DNI debe tener al menos 7 caracteres'
    }),
    email: Joi.string().email().allow('').optional().messages({
        'string.email': 'Ingresa un correo electrónico válido'
    }),
    whatsapp: Joi.string().allow('').optional(),
    quantity: Joi.number().integer().min(1).max(10).default(1).messages({
        'number.min': 'Debes comprar al menos 1 entrada',
        'number.max': 'No puedes comprar más de 10 entradas por vez'
    }),
    transactionId: Joi.string().allow('').optional(), // ID de transferencia para la web
    promoter: Joi.string().default('web')
});

// 3. Esquema para Crear Usuarios (admin.html)
const userCreateSchema = Joi.object({
    username: Joi.string().alphanum().min(3).required().messages({
        'string.alphanum': 'El usuario solo puede contener letras y números',
        'string.min': 'El usuario debe tener al menos 3 caracteres'
    }),
    name: Joi.string().required().messages({
        'any.required': 'El nombre de la persona es obligatorio'
    }),
    pin: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
        'any.required': 'Debes asignar un PIN inicial'
    }),
    role: Joi.string().valid('admin', 'rrpp', 'staff').required().messages({
        'any.only': 'El rol debe ser admin, rrpp o staff'
    })
});

// 4. Esquema para Validación de Inventario (admin.html)
const inventorySchema = Joi.object({
    name: Joi.string().required().messages({ 'any.required': 'El nombre de la tanda es obligatorio' }),
    price: Joi.number().min(0).required().messages({ 'number.base': 'El precio debe ser un número' }),
    stock: Joi.number().integer().min(0).required().messages({ 'number.base': 'El stock debe ser un número entero' })
});

/**
 * Middleware genérico para ejecutar la validación
 * @param {Joi.ObjectSchema} schema - El esquema de Joi a validar
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { 
            abortEarly: false, // Captura todos los errores, no solo el primero
            allowUnknown: true // Permite campos extra (como botones de envío) sin fallar
        });
        
        if (error) {
            // Transformamos los errores de Joi en un formato legible para el frontend
            const errorMessages = error.details.map(d => d.message);
            
            return res.status(400).json({
                error: 'Datos inválidos',
                details: errorMessages
            });
        }
        
        next();
    };
};

module.exports = { 
    validate, 
    loginSchema, 
    ticketPurchaseSchema, 
    userCreateSchema,
    inventorySchema
};