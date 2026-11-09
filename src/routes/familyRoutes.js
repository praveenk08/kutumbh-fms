/**
 * @file familyRoutes.js
 * @description Kutumbh FMS - Routes and OpenAPI specifications for Family and Member operations
 */

const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const memberController = require('../controllers/memberController');
const validate = require('../middlewares/validateMiddleware');
const { registerFamilySchema, memberSchema, verifyStatusSchema } = require('../validations/familyValidation');

/**
 * @swagger
 * components:
 *   schemas:
 *     MemberInput:
 *       type: object
 *       required:
 *         - fullName
 *         - gender
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Rahul Prasad"
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER]
 *           example: "MALE"
 *         dob:
 *           type: string
 *           format: date
 *           example: "2005-06-12"
 *         relationshipWithHead:
 *           type: string
 *           example: "SON"
 *         maritalStatus:
 *           type: string
 *           example: "UNMARRIED"
 *         educationalQualification:
 *           type: string
 *           example: "Intermediate"
 *         primaryOccupation:
 *           type: string
 *           example: "Student"
 *     FamilyRegistrationInput:
 *       type: object
 *       required:
 *         - familyData
 *         - membersData
 *       properties:
 *         familyData:
 *           type: object
 *           required:
 *             - headName
 *             - guardianName
 *           properties:
 *             headName:
 *               type: string
 *               example: "Ramesh Kumar Verma"
 *             guardianName:
 *               type: string
 *               example: "Shri Ramkishun Verma"
 *             contactNumber:
 *               type: string
 *               example: "9876543210"
 *             habitation:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "Uttar Pradesh"
 *                 district:
 *                   type: string
 *                   example: "Ballia"
 *                 block:
 *                   type: string
 *                   example: "Dubahar"
 *                 village:
 *                   type: string
 *                   example: "Rustampur"
 *                 habitationName:
 *                   type: string
 *                   example: "Purwa"
 *             economicProfile:
 *               type: object
 *               properties:
 *                 rationCardCategory:
 *                   type: string
 *                   enum: [AAY, BPL, APL, NONE]
 *                   example: "BPL"
 *                 annualIncome:
 *                   type: number
 *                   example: 48000
 *         membersData:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MemberInput'
 *     StatusVerificationInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [VERIFIED, REJECTED, PENDING]
 *           example: "VERIFIED"
 *         verifiedBy:
 *           type: string
 *           example: "ADMIN_OFFICER"
 */

/**
 * @swagger
 * /api/v1/families:
 *   get:
 *     summary: Search and paginate families
 *     tags: [Families]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by Head Name or Token
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         description: Village name (e.g. Rustampur)
 *       - in: query
 *         name: rationCardCategory
 *         schema:
 *           type: string
 *           enum: [AAY, BPL, APL, NONE]
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated families retrieved successfully.
 *   post:
 *     summary: Register a complete family unit with initial members (ACID Transaction)
 *     tags: [Families]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FamilyRegistrationInput'
 *     responses:
 *       201:
 *         description: Family registered successfully.
 *       400:
 *         description: Payload validation failed.
 */
router.get('/', (req, res, next) => familyController.searchFamilies(req, res, next));
router.get('/search', (req, res, next) => familyController.searchFamilies(req, res, next));
router.post('/', validate(registerFamilySchema), (req, res, next) => familyController.registerFamily(req, res, next));
router.post('/register', validate(registerFamilySchema), (req, res, next) => familyController.registerFamily(req, res, next));

/**
 * @swagger
 * /api/v1/families/{familyToken}/members:
 *   post:
 *     summary: Add an individual member to an existing family
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: familyToken
 *         required: true
 *         schema:
 *           type: string
 *         example: "BAL-2026-052382"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MemberInput'
 *     responses:
 *       201:
 *         description: Member added successfully.
 */
router.post('/:familyToken/members', validate(memberSchema), (req, res, next) => memberController.addMember(req, res, next));

/**
 * @swagger
 * /api/v1/families/{familyToken}/verify:
 *   patch:
 *     summary: Update administrative verification status
 *     tags: [Families]
 *     parameters:
 *       - in: path
 *         name: familyToken
 *         required: true
 *         schema:
 *           type: string
 *         example: "BAL-2026-052382"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StatusVerificationInput'
 *     responses:
 *       200:
 *         description: Verification status updated.
 */
router.patch('/:familyToken/status', validate(verifyStatusSchema), (req, res, next) => familyController.updateVerificationStatus(req, res, next));
router.patch('/:familyToken/verify', validate(verifyStatusSchema), (req, res, next) => familyController.updateVerificationStatus(req, res, next));

/**
 * @swagger
 * /api/v1/families/{familyToken}:
 *   get:
 *     summary: Retrieve family details along with all active members
 *     tags: [Families]
 *     parameters:
 *       - in: path
 *         name: familyToken
 *         required: true
 *         schema:
 *           type: string
 *         example: "BAL-2026-052382"
 *     responses:
 *       200:
 *         description: Full family entity retrieved.
 *       404:
 *         description: Family not found.
 */
router.get('/:familyToken', (req, res, next) => familyController.getFamilyByToken(req, res, next));

module.exports = router;