/**
 * @file memberRoutes.js
 * @description Kutumbh FMS - Clean Routes for Member operations
 */

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Add, Update, Remove
router.post('/:familyToken', (req, res, next) => memberController.addMember(req, res, next));
router.put('/:memberId', (req, res, next) => memberController.updateMember(req, res, next));
router.delete('/:memberId', (req, res, next) => memberController.removeMember(req, res, next));
router.patch('/:memberRefId/deactivate', (req, res, next) => memberController.removeMember(req, res, next));

module.exports = router;