const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');

exports.createOrder = async (req, res) => {
  try {
    const { items, delivery_address, delivery_notes, payment_method, promo_code } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!delivery_address) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery_fee = 5.00;
    let discount = 0;
    let promo_code_id = null;

    if (promo_code) {
      const validation = await PromoCode.validate(promo_code, subtotal);
      if (validation.valid) {
        discount = validation.discount;
        promo_code_id = validation.promo.id;
      } else {
        return res.status(400).json({ message: validation.message });
      }
    }

    const total = subtotal + delivery_fee - discount;

    const order = await Order.create({
      user_id: req.user.id,
      subtotal,
      delivery_fee,
      discount,
      total,
      promo_code_id,
      delivery_address,
      delivery_notes,
      payment_method,
      items,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await Order.findByUserId(req.user.id, { page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['placed', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    const updated = await Order.cancel(req.params.id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error: error.message });
  }
};

exports.validatePromo = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await PromoCode.validate(code, subtotal);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error validating promo code', error: error.message });
  }
};
