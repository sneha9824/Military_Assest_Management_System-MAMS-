const pool = require('../config/db');

/**
 * Middleware to log mutating actions to audit_logs
 * Uses a factory function so we can specify the action type or entity dynamically
 */
const auditLog = (actionName, entityType) => {
  return async (req, res, next) => {
    // We want to log *after* the request finishes successfully.
    res.on('finish', async () => {
      // Only log on successful creation/update (2xx statuses)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // req.auditEntityId should be set by the controller when the item is created
          const entityId = req.auditEntityId || null;
          const userId = req.user ? req.user.id : null;
          const role = req.user ? req.user.role : 'ANONYMOUS';
          const baseId = req.user ? req.user.base_id : null;
          
          // Clean up payload so passwords aren't logged
          const payload = { ...req.body, role, baseId };
          if (payload.password) delete payload.password;

          await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, http_method, endpoint, request_summary, ip_address, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              actionName,
              entityType,
              entityId,
              req.method,
              req.originalUrl,
              JSON.stringify(payload),
              req.ip || req.connection.remoteAddress,
              'SUCCESS'
            ]
          );
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }
    });
    next();
  };
};

module.exports = auditLog;
