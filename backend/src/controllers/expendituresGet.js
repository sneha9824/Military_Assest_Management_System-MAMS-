exports.getExpenditures = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    
    let query = `
      SELECT e.*, 
        b.name as base_name, 
        eq.name as equipment_name,
        u.name as recorder_name
      FROM expenditures e
      JOIN bases b ON e.base_id = b.id
      JOIN equipment_types eq ON e.equipment_type_id = eq.id
      JOIN users u ON e.recorded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND e.expenditure_date BETWEEN ? AND ?`;
      params.push(from, to);
    }
    if (equipmentTypeId) {
      query += ` AND e.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND e.base_id = ?`;
      params.push(effectiveBaseId);
    }

    query += ` ORDER BY e.expenditure_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Expenditures Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
