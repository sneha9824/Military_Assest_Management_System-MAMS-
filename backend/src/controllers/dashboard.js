const pool = require('../config/db');

exports.getDashboardSummary = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;

    let baseFilter = effectiveBaseId ? ' AND base_id = ? ' : '';
    let eqFilter = equipmentTypeId ? ' AND equipment_type_id = ? ' : '';
    let params = [];
    if (effectiveBaseId) params.push(effectiveBaseId);
    if (equipmentTypeId) params.push(equipmentTypeId);

    // Get current total assigned
    const [assigned] = await pool.query(
      `SELECT SUM(quantity) as total_assigned FROM assignments WHERE status = 'ACTIVE' ${baseFilter} ${eqFilter}`,
      params
    );

    // Get current total expended
    const [expended] = await pool.query(
      `SELECT SUM(quantity) as total_expended FROM expenditures WHERE 1=1 ${baseFilter} ${eqFilter}`,
      params
    );

    // Get opening & current balance from inventory
    const [inv] = await pool.query(
      `SELECT SUM(opening_balance) as total_opening, SUM(current_balance) as total_current 
       FROM inventory WHERE 1=1 ${baseFilter} ${eqFilter}`,
      params
    );

    res.json({
      total_assigned: assigned[0].total_assigned || 0,
      total_expended: expended[0].total_expended || 0,
      total_opening: inv[0].total_opening || 0,
      total_current: inv[0].total_current || 0
    });
  } catch (error) {
    console.error('Dashboard Summary Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
