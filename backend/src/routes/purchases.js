const express = require('express');
const router = express.Router();
const purchasesController = require('../controllers/purchases');
const { authenticate, authorize } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLogger');

router.use(authenticate);

router.post('/', 
  authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  auditLog('CREATE_PURCHASE', 'purchases'),
  purchasesController.createPurchase
);

router.get('/',
  authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'),
  purchasesController.getPurchases
);

module.exports = router;
