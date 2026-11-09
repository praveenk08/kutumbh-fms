/**
 * @file familyRoutes.js
 * @description Kutumbh FMS - Clean Routes for Family operations
 */

const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const memberController = require('../controllers/memberController');
const validate = require('../middlewares/validateMiddleware');
const { registerFamilySchema, memberSchema, verifyStatusSchema } = require('../validations/familyValidation');

// 1. Search & Listing
router.get('/', (req, res, next) => familyController.searchFamilies(req, res, next));
router.get('/search', (req, res, next) => familyController.searchFamilies(req, res, next));

// 2. Registration
router.post('/', validate(registerFamilySchema), (req, res, next) => familyController.registerFamily(req, res, next));
router.post('/register', validate(registerFamilySchema), (req, res, next) => familyController.registerFamily(req, res, next));

// 3. Member Sub-resource
router.post('/:familyToken/members', validate(memberSchema), (req, res, next) => memberController.addMember(req, res, next));

// 4. Verification Status
router.patch('/:familyToken/status', validate(verifyStatusSchema), (req, res, next) => familyController.updateVerificationStatus(req, res, next));
router.patch('/:familyToken/verify', validate(verifyStatusSchema), (req, res, next) => familyController.updateVerificationStatus(req, res, next));

// 5. Dynamic Token (Read Profile)
router.get('/:familyToken', (req, res, next) => familyController.getFamilyByToken(req, res, next));

module.exports = router;