const express = require('express');
const router = express.Router();
const { authAdminMiddleware } = require('../middleware/authMiddleware');
const {
    updateStaffStatusController,
    createStaffController,
    getStaffsController,
    getStaffDetailsController,
    searchStaffsController,
    filterStaffsController
} = require('../controller/StaffController');

// Áp dụng middleware kiểm tra quyền admin cho tất cả route
router.use(authAdminMiddleware);

router.put('/status/:staffId', updateStaffStatusController);
router.post('/staff', createStaffController);
router.get('/', getStaffsController);
router.get('/:id', getStaffDetailsController);
router.get('/search', searchStaffsController);
router.get('/filter', filterStaffsController);

module.exports = router;
