/**
 * @file memberRoutes.js
 * @description Kutumbh FMS - Dedicated Member management routes and Swagger definitions
 */

const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

/**
 * @swagger
 * /api/v1/members/{memberId}:
 *   put:
 *     summary: Update member details dynamically
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         description: Numeric ID or Member Ref ID (e.g. BAL-2026-052382-M01)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryOccupation:
 *                 type: string
 *                 example: Business
 *               educationalQualification:
 *                 type: string
 *                 example: Graduate
 *     responses:
 *       200:
 *         description: Member updated successfully.
 *   delete:
 *     summary: Soft-delete / deactivate member with remarks
 *     tags: [Members]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Migrated to Delhi for work"
 *     responses:
 *       200:
 *         description: Member deactivated successfully.
 */
router.post('/:familyToken', (req, res, next) => memberController.addMember(req, res, next));
router.put('/:memberId', (req, res, next) => memberController.updateMember(req, res, next));
router.delete('/:memberId', (req, res, next) => memberController.removeMember(req, res, next));
router.patch('/:memberRefId/deactivate', (req, res, next) => memberController.removeMember(req, res, next));

module.exports = router;