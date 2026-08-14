const express = require('express');
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', menuController.getCategories);
router.post('/categories', authenticate, authorize('admin'), menuController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), menuController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), menuController.deleteCategory);

router.get('/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItem);
router.post('/items', authenticate, authorize('admin'), menuController.createMenuItem);
router.put('/items/:id', authenticate, authorize('admin'), menuController.updateMenuItem);
router.delete('/items/:id', authenticate, authorize('admin'), menuController.deleteMenuItem);

module.exports = router;
