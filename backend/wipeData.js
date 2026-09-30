require('dotenv').config();
const pool = require('./src/config/db');

async function cleanSlate() {
  try {
    // Disable foreign key checks temporarily to allow truncating
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await pool.query('TRUNCATE TABLE purchases');
    await pool.query('TRUNCATE TABLE transfers');
    await pool.query('TRUNCATE TABLE assignments');
    await pool.query('TRUNCATE TABLE expenditures');
    await pool.query('TRUNCATE TABLE audit_logs');
    await pool.query('TRUNCATE TABLE inventory');

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Operational tables (inventory, purchases, etc.) wiped clean!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to wipe tables:', err);
    process.exit(1);
  }
}

cleanSlate();
