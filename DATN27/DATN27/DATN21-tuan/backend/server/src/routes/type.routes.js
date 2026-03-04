const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const typeController = require('../controllers/type.controller');

// CRUD routes - no image upload needed
router.post('/create', authAdmin, typeController.validateCreate(), asyncHandler(typeController.createType));
router.get('/list', asyncHandler(typeController.getAllType));
router.get('/detail/:id', typeController.validateId(), asyncHandler(typeController.getTypeById));
router.put('/update/:id', authAdmin, typeController.validateUpdate(), asyncHandler(typeController.updateType));
router.delete('/delete/:id', authAdmin, typeController.validateId(), asyncHandler(typeController.deleteType));

module.exports = router;
