const express = require('express');
const router = express.Router();

const authController = require('../controllers/authControl');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (requires JWT)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// Route to save events
router.post('/saveEvent', authMiddleware, authController.saveEvent);

module.exports = router;
