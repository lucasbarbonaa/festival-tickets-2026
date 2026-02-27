const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middlewares/authMiddleware');
const { validate, loginSchema, ticketPurchaseSchema, userCreateSchema, inventorySchema } = require('../middlewares/validate');

const authController = require('../controllers/authController');
const publicController = require('../controllers/publicController');
const adminController = require('../controllers/adminController');
const rrppController = require('../controllers/rrppController');
const staffController = require('../controllers/staffController');

// ====================== RUTAS PÚBLICAS ======================
router.get('/public/batch', publicController.getActiveBatch);
router.get('/public/ticket/:id', publicController.getPublicTicket);
router.post('/tickets/purchase', validate(ticketPurchaseSchema), publicController.buyTicket);

// ====================== AUTH ======================
router.post('/auth/login', validate(loginSchema), authController.login);

// ====================== ADMIN ======================
router.get('/admin/stats', protect, authorize('admin'), adminController.getStats);
router.get('/admin/tickets/pending', protect, authorize('admin'), adminController.getPendingTickets);
router.post('/admin/tickets/approve/:id', protect, authorize('admin'), adminController.approveTicket);
router.post('/admin/inventory', protect, authorize('admin'), validate(inventorySchema), adminController.updateInventory);
router.get('/admin/users', protect, authorize('admin'), adminController.getUsers);
router.post('/admin/users', protect, authorize('admin'), validate(userCreateSchema), adminController.createUser);
router.delete('/admin/users/:id', protect, authorize('admin'), adminController.deleteUser);
router.get('/admin/tickets/search', protect, authorize('admin'), adminController.searchTickets);

// ====================== RRPP ======================
router.get('/rrpp/stats', protect, authorize('rrpp'), rrppController.getStats);
//router.post('/rrpp/sell', protect, authorize('rrpp'), rrppController.sellDirect);//

// ====================== STAFF ======================
router.get('/staff/check/:query', protect, authorize('staff', 'admin'), staffController.checkTicket);
router.post('/staff/use-ticket/:id', protect, authorize('staff', 'admin'), staffController.validateTicket);

module.exports = router;