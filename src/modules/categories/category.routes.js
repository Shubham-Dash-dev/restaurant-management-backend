const express = require('express');
const router = express.Router();
const {protect, restrictTo, optionalAuth} = require('../../middlewares/auth.middleware')
const categoryController = require('./category.controller')
const validate = require('../../middlewares/validate.middleware')
const {createCategoryValidation , updateCategoryValidation} = require('./category.validator')
const validateUUID = require('../../middlewares/uuid.middleware')

// Public Routes (Anyone can view categories to browse menu)
router.get('/',optionalAuth,categoryController.getAllCategories);
router.get('/:id',validateUUID,categoryController.getCategoryById);


// Protected Routes (Only ADMIN & STAFF can create/update, only ADMIN can delete)
router.use(protect);
router.post('/',restrictTo('ADMIN','STAFF'),createCategoryValidation,validate, categoryController.createCategory);
router.patch('/:id',restrictTo('ADMIN','STAFF'),validateUUID,updateCategoryValidation,validate, categoryController.updateCategory);
router.delete('/:id',restrictTo('ADMIN'),validateUUID,categoryController.deleteCategory);



module.exports = router;