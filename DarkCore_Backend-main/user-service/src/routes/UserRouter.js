const express = require('express');
const router = express.Router();
const {
    updateUserStatusController,
    createStaffController,
    getUsersController,
    getUserDetailsController,
    searchUsersController,
    filterUsersController
} = require('../controller/UserController');

router.put('/status/:userId', updateUserStatusController);
router.post('/staff', createStaffController);
router.get('/', getUsersController);
router.get('/:id', getUserDetailsController);
router.get('/search', searchUsersController);
router.get('/filter', filterUsersController);

module.exports = router;
