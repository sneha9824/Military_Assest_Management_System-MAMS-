exports.getAssignments = async (req, res) => {
  try {
    const { from, to, baseId, equipmentTypeId } = req.query;
    
    let query = `
      SELECT a.*, 
        b.name as base_name, 
        e.name as equipment_name,
        u.name as assigner_name
      FROM assignments a
      JOIN bases b ON a.base_id = b.id
      JOIN equipment_types e ON a.equipment_type_id = e.id
      JOIN users u ON a.assigned_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (from && to) {
      query += ` AND a.assignment_date BETWEEN ? AND ?`;
      params.push(from, to);
    }
    if (equipmentTypeId) {
      query += ` AND a.equipment_type_id = ?`;
      params.push(equipmentTypeId);
    }

    const effectiveBaseId = req.user.role === 'ADMIN' ? (baseId || null) : req.user.base_id;
    if (effectiveBaseId) {
      query += ` AND a.base_id = ?`;
      params.push(effectiveBaseId);
    }

    query += ` ORDER BY a.assignment_date DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get Assignments Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
