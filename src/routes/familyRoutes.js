/**
 * @file familyRoutes.js
 * @description Kutumbh FMS - Routes for Family and Nested Member operations
 */

const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const memberController = require('../controllers/memberController');

// 1. Search & Listing Endpoints (Always put static paths before /:familyToken)
router.get('/', (req, res, next) => familyController.searchFamilies(req, res, next));
router.get('/search', (req, res, next) => familyController.searchFamilies(req, res, next));

// 2. Family Registration
router.post('/', (req, res, next) => familyController.registerFamily(req, res, next));
router.post('/register', (req, res, next) => familyController.registerFamily(req, res, next));

// 3. Member Endpoints (Postman collection compatibility)
router.post('/:familyToken/members', (req, res, next) => memberController.addMember(req, res, next));

// 4. Status/Verify Endpoints
router.patch('/:familyToken/status', (req, res, next) => familyController.updateVerificationStatus(req, res, next));
router.patch('/:familyToken/verify', (req, res, next) => familyController.updateVerificationStatus(req, res, next));

// 5. Dynamic Token Parameter (Sabse aakhiri me aayega)
router.get('/:familyToken', (req, res, next) => familyController.getFamilyByToken(req, res, next));

module.exports = router;