const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// 1. Add member
router.post('/:familyToken', (req, res, next) => memberController.addMember(req, res, next));

// 2. Update member details
router.put('/:memberId', (req, res, next) => memberController.updateMember(req, res, next));

// 3. Remove / Deactivate member (Matches DELETE {{baseUrl}}/api/v1/members/:memberId)
router.delete('/:memberId', (req, res, next) => memberController.removeMember(req, res, next));
router.patch('/:memberRefId/deactivate', (req, res, next) => memberController.removeMember(req, res, next));

module.exports = router;