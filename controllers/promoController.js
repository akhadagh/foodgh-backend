const PromoCode = require('../models/PromoCode');

exports.getAll = async (req, res) => {
  try {
    const promos = await PromoCode.findAll();
    res.json(promos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching promo codes', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json(promo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating promo code', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const promo = await PromoCode.update(req.params.id, req.body);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });
    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating promo code', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const promo = await PromoCode.delete(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promo code not found' });
    res.json({ message: 'Promo code deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting promo code', error: error.message });
  }
};

exports.validate = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await PromoCode.validate(code, subtotal);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error validating promo code', error: error.message });
  }
};
