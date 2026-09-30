const express = require('express');
const router = express.Router();
const transfersController = require('../controllers/transfers');
const { authenticate, authorize } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLogger');

// All roles can access these, but results are base-scoped for non-admins
router.use(authenticate);

// Create transfer triggers audit logger
router.post('/', 
  authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  auditLog('CREATE_TRANSFER', 'transfers'),
  transfersController.createTransfer
);

router.get('/',
  authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  transfersController.getTransfers
);

module.exports = router;
