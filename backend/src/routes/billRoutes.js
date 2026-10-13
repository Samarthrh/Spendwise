const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadAndProcessBill,
  getBills,
  getBillById,
  confirmAndSaveBill,
  deleteBill,
  getOcrStatus,
} = require('../controllers/billController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/ocr-status', getOcrStatus);
router.post('/scan', upload.single('billFile'), uploadAndProcessBill);
router.post('/upload', upload.single('billFile'), uploadAndProcessBill);
router.get('/', getBills);
router.get('/:id', getBillById);
router.post('/:id/confirm', confirmAndSaveBill);
router.delete('/:id', deleteBill);

module.exports = router;
