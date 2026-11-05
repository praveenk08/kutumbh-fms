const express = require('express');
const MemberController = require('../controllers/memberController');

const router = express.Router();

// POST /api/v1/families/:familyToken/members
router.post('/families/:familyToken/members', MemberController.addMember);

// PUT /api/v1/members/:memberId
router.put('/members/:memberId', MemberController.updateMember);

// DELETE /api/v1/members/:memberId
router.delete('/members/:memberId', MemberController.removeMember);

module.exports = router;