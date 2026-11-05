const express = require('express');
const MemberController = require('../controllers/memberController');

const router = express.Router();

// Route to add member under a specific family
router.post('/families/:familyToken/members', MemberController.addMember);

// Direct member actions by ID
router.put('/members/:memberId', MemberController.updateMember);
router.delete('/members/:memberId', MemberController.removeMember);

module.exports = router;