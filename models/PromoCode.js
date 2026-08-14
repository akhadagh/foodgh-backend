const pool = require('../config/database');

class PromoCode {
  static async create({ code, discount_type, discount_value, min_order, max_uses, expires_at }) {
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses, expires_at]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await pool.query(
      `SELECT * FROM promo_codes WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    );
    return result.rows[0];
  }

  static async validate(code, orderSubtotal) {
    const promo = await PromoCode.findByCode(code);
    if (!promo) return { valid: false, message: 'Invalid promo code' };

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return { valid: false, message: 'Promo code has expired' };
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return { valid: false, message: 'Promo code usage limit reached' };
    }

    if (orderSubtotal < promo.min_order) {
      return { valid: false, message: `Minimum order of GH₵${promo.min_order} required` };
    }

    let discount = 0;
    if (promo.discount_type === 'percentage') {
      discount = (orderSubtotal * promo.discount_value) / 100;
    } else {
      discount = promo.discount_value;
    }

    return { valid: true, promo, discount: Math.min(discount, orderSubtotal) };
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return result.rows;
  }

  static async update(id, { code, discount_type, discount_value, min_order, max_uses, expires_at, is_active }) {
    const result = await pool.query(
      `UPDATE promo_codes SET
        code = COALESCE($2, code),
        discount_type = COALESCE($3, discount_type),
        discount_value = COALESCE($4, discount_value),
        min_order = COALESCE($5, min_order),
        max_uses = COALESCE($6, max_uses),
        expires_at = COALESCE($7, expires_at),
        is_active = COALESCE($8, is_active)
       WHERE id = $1 RETURNING *`,
      [id, code?.toUpperCase(), discount_type, discount_value, min_order, max_uses, expires_at, is_active]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM promo_codes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

module.exports = PromoCode;
