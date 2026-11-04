const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');

// Public routes
router.post('/register', familyController.registerFamily);
router.get('/:familyToken', familyController.getFamilyByToken);

module.exports = router;