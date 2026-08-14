const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.get('/sales', adminController.getSalesData);
router.get('/sales/export', adminController.exportSalesCSV);
router.get('/users', adminController.getUsers);

module.exports = router;
