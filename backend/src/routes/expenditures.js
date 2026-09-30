const express = require('express');
const router = express.Router();
const expendituresController = require('../controllers/expenditures');
const { authenticate, authorize } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLogger');

router.use(authenticate);

router.post('/', 
  authorize('ADMIN', 'BASE_COMMANDER'),
  auditLog('CREATE_EXPENDITURE', 'expenditures'),
  expendituresController.createExpenditure
);

router.get('/', expendituresController.getExpenditures);

module.exports = router;
