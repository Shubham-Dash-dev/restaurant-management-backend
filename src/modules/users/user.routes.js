const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { createUserValidation, updateUserValidation } = require('./user.validator');
const validate = require('../../middlewares/validate.middleware');
const validateUUID = require('../../middlewares/uuid.middleware');

router.post('/', createUserValidation, validate, userController.createUser);
router.get('/', userController.getAllUsers);
router.get('/:id', validateUUID, userController.getUserById);
router.patch('/:id', validateUUID, updateUserValidation, validate, userController.updateUser);
router.delete('/:id', validateUUID, userController.deleteUser);

module.exports = router;
