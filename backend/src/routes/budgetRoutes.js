const express = require('express');
const router = express.Router();
const { getBudgets, upsertBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(upsertBudget);

module.exports = router;
