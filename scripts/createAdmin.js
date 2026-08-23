const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  const client = await pool.connect();

  try {
    const email = 'admin@foodgh.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      await client.query(
        'UPDATE users SET name = $1, password = $2, phone = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE email = $5',
        ['Admin', hashedPassword, '+233200000000', 'admin', email]
      );
      console.log('Updated existing admin user:', email);
    } else {
      await client.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
        ['Admin', email, hashedPassword, '+233200000000', 'admin']
      );
      console.log('Created admin user:', email);
    }

    console.log('Admin password:', password);
  } catch (error) {
    console.error('Failed to create admin user:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

createAdmin();