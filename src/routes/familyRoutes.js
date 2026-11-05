const express = require('express');
const familyController = require('../controllers/familyController');

const router = express.Router();

// POST /api/v1/families/register
router.post('/families/register', (req, res, next) => familyController.registerFamily(req, res, next));

// GET /api/v1/families/:familyToken
router.get('/families/:familyToken', (req, res, next) => familyController.getFamilyByToken(req, res, next));

// PATCH /api/v1/families/:familyToken/verify
router.patch('/families/:familyToken/verify', (req, res, next) => familyController.updateVerificationStatus(req, res, next));

module.exports = router;