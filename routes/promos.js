const express = require('express');
const promoController = require('../controllers/promoController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), promoController.getAll);
router.post('/', authenticate, authorize('admin'), promoController.create);
router.put('/:id', authenticate, authorize('admin'), promoController.update);
router.delete('/:id', authenticate, authorize('admin'), promoController.delete);
router.post('/validate', authenticate, promoController.validate);

module.exports = router;
