const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;
