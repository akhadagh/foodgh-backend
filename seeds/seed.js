const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM order_status_history');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM promo_codes');
    await client.query('DELETE FROM menu_items');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM users');

    const adminHash = await bcrypt.hash('admin123', 12);
    const userHash = await bcrypt.hash('password123', 12);

    const adminResult = await client.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      ['Admin', 'admin@foodgh.com', adminHash, '+233200000000', 'admin']
    );

    await client.query(
      'INSERT INTO users (name, email, password, phone, address, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Kwame Mensah', 'kwame@example.com', userHash, '+233241234567', '123 Oxford Street, Osu, Accra', 'customer']
    );

    const categories = [
      { name: 'Local Favorites', description: 'Authentic Ghanaian dishes', sort_order: 1 },
      { name: 'Rice Dishes', description: 'Delicious rice preparations', sort_order: 2 },
      { name: 'Soups & Stews', description: 'Rich traditional soups', sort_order: 3 },
      { name: 'Drinks', description: 'Refreshing beverages', sort_order: 4 },
      { name: 'Sides & Extras', description: 'Perfect accompaniments', sort_order: 5 },
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const result = await client.query(
        'INSERT INTO categories (name, description, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [cat.name, cat.description, cat.sort_order]
      );
      categoryIds[cat.name] = result.rows[0].id;
    }

    const menuItems = [
      { category: 'Local Favorites', name: 'Banku with Okra Soup', description: 'Fermented corn and cassava dough served with rich okra soup and fresh fish', price: 35.00, is_featured: true },
      { category: 'Local Favorites', name: 'Banku with Tilapia', description: 'Soft banku paired with grilled tilapia and spicy pepper sauce', price: 45.00, is_featured: true },
      { category: 'Local Favorites', name: 'Fufu with Light Soup', description: 'Pounded cassava and plantain fufu with aromatic light soup and goat meat', price: 40.00, is_featured: true },
      { category: 'Local Favorites', name: 'Fufu with Palm Nut Soup', description: 'Smooth fufu served with rich palm nut soup and assorted meats', price: 42.00, is_featured: false },
      { category: 'Local Favorites', name: 'Kenkey with Fried Fish', description: 'Fermented corn dough dumpling with fried fish and shito', price: 30.00, is_featured: true },
      { category: 'Local Favorites', name: 'Ga Kenkey', description: 'Traditional Ga-style kenkey with pepper and fried fish', price: 28.00, is_featured: false },
      { category: 'Local Favorites', name: 'Eba with Egusi Soup', description: 'Cassava flour staple with melon seed soup and spinach', price: 32.00, is_featured: false },

      { category: 'Rice Dishes', name: 'Jollof Rice', description: 'Classic Ghanaian jollof rice with tomato stew, chicken and salad', price: 40.00, is_featured: true },
      { category: 'Rice Dishes', name: 'Waakye and Stew', description: 'Rice and beans served with shito, spaghetti, gari and boiled egg', price: 35.00, is_featured: true },
      { category: 'Rice Dishes', name: 'Rice Ball with Groundnut Soup', description: 'Compressed rice ball (Omo tuo) with rich groundnut soup', price: 38.00, is_featured: true },
      { category: 'Rice Dishes', name: 'Plain Rice with Stew', description: 'Steamed white rice served with tomato-based chicken stew', price: 30.00, is_featured: false },
      { category: 'Rice Dishes', name: 'Fried Rice', description: 'Ghanaian-style fried rice with mixed vegetables and chicken', price: 38.00, is_featured: false },
      { category: 'Rice Dishes', name: 'Jollof Rice with Goat Meat', description: 'Spicy jollof rice served with tender goat meat and salad', price: 50.00, is_featured: true },

      { category: 'Soups & Stews', name: 'Groundnut Soup', description: 'Rich and creamy groundnut soup with chicken', price: 35.00, is_featured: false },
      { category: 'Soups & Stews', name: 'Light Soup', description: 'Clear spicy tomato-based soup with goat meat', price: 35.00, is_featured: false },
      { category: 'Soups & Stews', name: 'Palm Nut Soup', description: 'Thick palm fruit soup with assorted meat and fish', price: 38.00, is_featured: false },
      { category: 'Soups & Stews', name: 'Okra Soup', description: 'Fresh okra soup with smoked fish and shrimp', price: 35.00, is_featured: false },
      { category: 'Soups & Stews', name: 'Egusi Soup', description: 'Melon seed soup with spinach and assorted meat', price: 38.00, is_featured: false },

      { category: 'Drinks', name: 'Sobolo (Hibiscus Drink)', description: 'Refreshing homemade hibiscus drink with ginger', price: 8.00, is_featured: false },
      { category: 'Drinks', name: 'Lime Juice', description: 'Freshly squeezed lime juice with mint', price: 10.00, is_featured: false },
      { category: 'Drinks', name: 'Palm Wine', description: 'Traditional palm wine, freshly tapped', price: 15.00, is_featured: false },
      { category: 'Drinks', name: 'Club Beer', description: 'Popular Ghanaian lager beer', price: 12.00, is_featured: false },
      { category: 'Drinks', name: 'Coca-Cola', description: 'Ice cold Coca-Cola', price: 5.00, is_featured: false },
      { category: 'Drinks', name: 'Bottled Water', description: '500ml purified water', price: 3.00, is_featured: false },

      { category: 'Sides & Extras', name: 'Shito (Black Pepper Sauce)', description: 'Spicy black pepper and shrimp sauce', price: 5.00, is_featured: false },
      { category: 'Sides & Extras', name: 'Gari Foto', description: 'Cassava flakes mixed with tomato and onions', price: 10.00, is_featured: false },
      { category: 'Sides & Extras', name: 'Boiled Plantain', description: 'Ripe plantain, perfectly boiled', price: 8.00, is_featured: false },
      { category: 'Sides & Extras', name: 'Fried Plantain (Kelewele)', description: 'Spicy fried ripe plantain cubes', price: 12.00, is_featured: true },
      { category: 'Sides & Extras', name: 'Yam Chips', description: 'Crispy fried yam chips', price: 10.00, is_featured: false },
      { category: 'Sides & Extras', name: 'Gari Soakings', description: 'Gari with sugar, milk and ice', price: 8.00, is_featured: false },
    ];

    for (const item of menuItems) {
      await client.query(
        'INSERT INTO menu_items (category_id, name, description, price, is_available, is_featured) VALUES ($1, $2, $3, $4, true, $5)',
        [categoryIds[item.category], item.name, item.description, item.price, item.is_featured]
      );
    }

    await client.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
      ['WELCOME10', 'percentage', 10, 20, 100]
    );
    await client.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, min_order, max_uses, is_active) VALUES ($1, $2, $3, $4, $5, true)`,
      ['GHANA5', 'fixed', 5, 15, 50]
    );

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
    console.log('Admin login: admin@foodgh.com / admin123');
    console.log('Customer login: kwame@example.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
  }
};

seedData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
