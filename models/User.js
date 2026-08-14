const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, email, password, phone, address, role = 'customer' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, address, role, created_at',
      [name, email, hashedPassword, phone, address, role]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async update(id, { name, phone, address }) {
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($2, name), phone = COALESCE($3, phone), address = COALESCE($4, address), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, phone, address, role',
      [id, name, phone, address]
    );
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async findAll() {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }
}

module.exports = User;
