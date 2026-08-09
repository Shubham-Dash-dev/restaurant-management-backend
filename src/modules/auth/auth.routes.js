const express = require('express');
const router = express.Router();
const {registerValidation, loginValidation, refreshTokenValidation, updateProfileValidation, changePasswordValidation} = require('./auth.validator');
const validate = require('../../middlewares/validate.middleware');
const authController = require('./auth.controller');
const {protect} = require('../../middlewares/auth.middleware');

// Public Auth routes
router.post('/register',registerValidation,validate,authController.register);
router.post('/login',loginValidation,validate,authController.login);
router.post('/refresh-token',refreshTokenValidation,validate  , authController.refreshToken)


// Protected Auth Routes (Requires Bearer Access Token)
router.post('/logout',protect,authController.logout)
router.get('/profile',protect,authController.getProfile)
router.patch('/profile',protect,updateProfileValidation,validate,authController.updateProfile)
router.patch('/change-password',protect,changePasswordValidation,validate,authController.changePassword)


module.exports = router;

