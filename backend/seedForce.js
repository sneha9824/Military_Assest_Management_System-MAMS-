require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./src/config/db');

async function forceSeed() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      { name: 'System Admin', email: 'admin@military.gov', role: 'ADMIN', base_id: null },
      { name: 'Commander Alpha', email: 'commander@military.gov', role: 'BASE_COMMANDER', base_id: 1 },
      { name: 'Logistics Officer Bravo', email: 'logistics@military.gov', role: 'LOGISTICS_OFFICER', base_id: 1 }
    ];

    for (const user of users) {
      // Upsert
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, base_id) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = ?, role = ?, base_id = ?`,
        [user.name, user.email, passwordHash, user.role, user.base_id, passwordHash, user.role, user.base_id]
      );
    }
    console.log('Force seeded users with password123 successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
}

forceSeed();
