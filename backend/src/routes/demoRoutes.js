const express = require('express');
const router = express.Router();
const { seedSampleData, clearUserData } = require('../controllers/demoController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/seed', seedSampleData);
router.post('/clear', clearUserData);

module.exports = router;
