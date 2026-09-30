const express = require('express');
const router = express.Router();
const globalsController = require('../controllers/globals');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/bases', globalsController.getBases);
router.post('/bases', globalsController.createBase);
router.delete('/bases/:id', globalsController.deleteBase);

router.get('/equipment-types', globalsController.getEquipmentTypes);
router.post('/equipment-types', globalsController.createEquipmentType);
router.delete('/equipment-types/:id', globalsController.deleteEquipmentType);

module.exports = router;
