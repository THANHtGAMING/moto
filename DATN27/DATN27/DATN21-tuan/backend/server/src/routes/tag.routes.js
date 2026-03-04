const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../auth/checkAuth');
const { authAdmin } = require('../middleware/authUser');
const tagController = require('../controllers/tag.controller');

// CRUD routes
router.post('/create', authAdmin, tagController.validateCreate(), asyncHandler(tagController.createTag));
router.get('/list', asyncHandler(tagController.getAllTags));
router.get('/detail/:id', tagController.validateId(), asyncHandler(tagController.getTagById));
router.put('/update/:id', authAdmin, tagController.validateUpdate(), asyncHandler(tagController.updateTag));
router.delete('/delete/:id', authAdmin, tagController.validateId(), asyncHandler(tagController.deleteTag));

module.exports = router;

