const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignments');
const { authenticate, authorize } = require('../middlewares/auth');
const auditLog = require('../middlewares/auditLogger');

router.use(authenticate);

router.post('/', 
  authorize('ADMIN', 'BASE_COMMANDER'),
  auditLog('CREATE_ASSIGNMENT', 'assignments'),
  assignmentsController.createAssignment
);

router.get('/', assignmentsController.getAssignments);

router.patch('/:id/return',
  authorize('ADMIN', 'BASE_COMMANDER'),
  auditLog('RETURN_ASSIGNMENT', 'assignments'),
  assignmentsController.returnAssignment
);

module.exports = router;
