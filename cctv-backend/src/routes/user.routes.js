const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');

// All user routes are protected
router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
