const express = require('express');
const router = express.Router();
const { getDashboardSummary, getAnalyticsReports } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/analytics', getAnalyticsReports);

module.exports = router;
