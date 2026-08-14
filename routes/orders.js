const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);
router.post('/validate-promo', authenticate, orderController.validatePromo);

module.exports = router;
