/**
 * @file memberRoutes.js
 * @description Kutumbh FMS - Clean Routes for Member operations with Zod Validation
 */

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const validate = require('../middlewares/validateMiddleware');
const { memberSchema, updateMemberSchema } = require('../validations/familyValidation');

// 1. Add Member to Family via Token
router.post('/:familyToken', validate(memberSchema), (req, res, next) => memberController.addMember(req, res, next));

// 2. Update Member by ID
router.put('/:memberId', validate(updateMemberSchema), (req, res, next) => memberController.updateMember(req, res, next));

// 3. Remove / Deactivate Member
router.delete('/:memberId', (req, res, next) => memberController.removeMember(req, res, next));
router.patch('/:memberRefId/deactivate', (req, res, next) => memberController.softDeleteMember(req, res, next));

module.exports = router;