require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./src/config/db');

async function seedUsers() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Check if users exist
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count > 0) {
      console.log('Users already exist. Skipping seed.');
      process.exit(0);
    }

    const users = [
      {
        name: 'System Admin',
        email: 'admin@military.gov',
        password_hash: passwordHash,
        role: 'ADMIN',
        base_id: null
      },
      {
        name: 'Commander Alpha',
        email: 'commander@military.gov',
        password_hash: passwordHash,
        role: 'BASE_COMMANDER',
        base_id: 1 // Central Base
      },
      {
        name: 'Logistics Officer Bravo',
        email: 'logistics@military.gov',
        password_hash: passwordHash,
        role: 'LOGISTICS_OFFICER',
        base_id: 1 // Central Base
      }
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, base_id) VALUES (?, ?, ?, ?, ?)',
        [user.name, user.email, user.password_hash, user.role, user.base_id]
      );
    }
    
    console.log('Successfully seeded 3 users.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed users:', err);
    process.exit(1);
  }
}

seedUsers();
