const express = require('express');
const multer = require('multer');
const { importData, exportData } = require('../controllers/censusController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// POST /api/v1/census/import
router.post('/import', upload.single('file'), importData);

// GET /api/v1/census/export
router.get('/export', exportData);

module.exports = router;