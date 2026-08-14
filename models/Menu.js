const pool = require('../config/database');

class MenuItem {
  static async create({ category_id, name, description, price, image, is_featured, custom_options }) {
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, image, is_featured, custom_options)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [category_id, name, description, price, image, is_featured || false, JSON.stringify(custom_options || [])]
    );
    return result.rows[0];
  }

  static async findAll({ category_id, is_available, is_featured } = {}) {
    let query = 'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id';
    const conditions = [];
    const values = [];

    if (category_id) {
      values.push(category_id);
      conditions.push(`mi.category_id = $${values.length}`);
    }
    if (is_available !== undefined) {
      values.push(is_available);
      conditions.push(`mi.is_available = $${values.length}`);
    }
    if (is_featured !== undefined) {
      values.push(is_featured);
      conditions.push(`mi.is_featured = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY mi.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT mi.*, c.name as category_name FROM menu_items mi LEFT JOIN categories c ON mi.category_id = c.id WHERE mi.id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, { category_id, name, description, price, image, is_available, is_featured, custom_options }) {
    const result = await pool.query(
      `UPDATE menu_items SET
        category_id = COALESCE($2, category_id),
        name = COALESCE($3, name),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        image = COALESCE($6, image),
        is_available = COALESCE($7, is_available),
        is_featured = COALESCE($8, is_featured),
        custom_options = COALESCE($9, custom_options),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, category_id, name, description, price, image, is_available, is_featured, custom_options ? JSON.stringify(custom_options) : null]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

class Category {
  static async create({ name, image, description, sort_order }) {
    const result = await pool.query(
      'INSERT INTO categories (name, image, description, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, image, description, sort_order || 0]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, { name, image, description, sort_order }) {
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($2, name), image = COALESCE($3, image), description = COALESCE($4, description), sort_order = COALESCE($5, sort_order) WHERE id = $1 RETURNING *',
      [id, name, image, description, sort_order]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

module.exports = { MenuItem, Category };
