const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createAdmin = async ({ closePool = true } = {}) => {
  const client = await pool.connect();

  try {
    const email = 'admin@foodgh.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      console.log('Admin user already exists:', email);
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
    if (closePool) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  createAdmin().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = createAdmin;