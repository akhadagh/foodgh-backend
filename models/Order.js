const pool = require('../config/database');

class Order {
  static async create({ user_id, subtotal, delivery_fee, discount, total, promo_code_id, delivery_address, delivery_notes, payment_method, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (user_id, subtotal, delivery_fee, discount, total, promo_code_id, delivery_address, delivery_notes, payment_method, estimated_delivery)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '45 minutes')
         RETURNING *`,
        [user_id, subtotal, delivery_fee || 0, discount || 0, total, promo_code_id, delivery_address, delivery_notes, payment_method || 'cash']
      );

      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price, custom_options, special_instructions)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [order.id, item.menu_item_id, item.name, item.quantity, item.price, JSON.stringify(item.custom_options || []), item.special_instructions]
        );
      }

      await client.query(
        `INSERT INTO order_status_history (order_id, status, note) VALUES ($1, 'placed', 'Order placed successfully')`,
        [order.id]
      );

      if (promo_code_id) {
        await client.query(
          'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
          [promo_code_id]
        );
      }

      await client.query('COMMIT');

      const fullOrder = await Order.findById(order.id);
      return fullOrder;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const orderResult = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM orders o LEFT JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    order.items = itemsResult.rows;

    const historyResult = await pool.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      [id]
    );
    order.status_history = historyResult.rows;

    return order;
  }

  static async findByUserId(user_id, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [user_id]);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [user_id, limit, offset]
    );

    for (let order of result.rows) {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items.rows;
    }

    return { orders: result.rows, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async findAll({ page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
                 FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
    const values = [];
    const conditions = [];

    if (status) {
      values.push(status);
      conditions.push(`o.status = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    values.push(limit, offset);
    query += ` ORDER BY o.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`;
    const result = await pool.query(query, values);

    for (let order of result.rows) {
      const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      order.items = items.rows;
    }

    return { orders: result.rows, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async updateStatus(id, status, note) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE orders SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id, status]
      );

      await client.query(
        'INSERT INTO order_status_history (order_id, status, note) VALUES ($1, $2, $3)',
        [id, status, note || `Status updated to ${status}`]
      );

      await client.query('COMMIT');

      return await Order.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getSalesStats({ start_date, end_date } = {}) {
    let query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(subtotal) as gross_sales,
        SUM(discount) as total_discounts,
        SUM(total) as net_sales,
        AVG(total) as avg_order_value
      FROM orders
      WHERE status != 'cancelled'
    `;
    const values = [];
    const conditions = [];

    if (start_date) {
      values.push(start_date);
      conditions.push(`created_at >= $${values.length}`);
    }
    if (end_date) {
      values.push(end_date);
      conditions.push(`created_at <= $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getPopularItems({ start_date, end_date, limit = 10 } = {}) {
    let query = `
      SELECT oi.name, SUM(oi.quantity) as total_quantity, SUM(oi.quantity * oi.price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
    `;
    const values = [];
    const conditions = [];

    if (start_date) {
      values.push(start_date);
      conditions.push(`o.created_at >= $${values.length}`);
    }
    if (end_date) {
      values.push(end_date);
      conditions.push(`o.created_at <= $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    values.push(limit);
    query += ` GROUP BY oi.name ORDER BY total_quantity DESC LIMIT $${values.length}`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async cancel(id) {
    return Order.updateStatus(id, 'cancelled', 'Order cancelled');
  }
}

module.exports = Order;
