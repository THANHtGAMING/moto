const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const genderController = require('../controllers/gender.controller');

// CRUD routes
router.post('/create', authAdmin, genderController.validateCreate(), asyncHandler(genderController.createGender));
router.get('/list', asyncHandler(genderController.getAllGenders));
router.get('/detail/:id', genderController.validateId(), asyncHandler(genderController.getGenderById));
router.put('/update/:id', authAdmin, genderController.validateUpdate(), asyncHandler(genderController.updateGender));
router.delete('/delete/:id', authAdmin, genderController.validateId(), asyncHandler(genderController.deleteGender));

module.exports = router;

