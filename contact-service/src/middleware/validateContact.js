const { body, param, query, validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs').promises;

// ====================== VALIDATE CREATE CONTACT ======================
const validateContact = [
  body('subject')
    .trim()
    .notEmpty().withMessage('Tiêu đề không được để trống')
    .isLength({ min: 5, max: 100 }).withMessage('Tiêu đề phải từ 5-100 ký tự')
    .matches(/^[a-zA-Z0-9\s\u00C0-\u1EF9\u0020-\u007E\u00A0-\u00FF!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
    .withMessage('Tiêu đề chứa ký tự không hợp lệ'),
  body('reason')
    .notEmpty().withMessage('Lý do không được để trống')
    .isIn(['Order', 'Product', 'Service', 'Warranty', 'Other'])
    .withMessage('Lý do không hợp lệ'),
  body('message')
    .trim()
    .notEmpty().withMessage('Nội dung không được để trống')
    .isLength({ min: 10, max: 5000 }).withMessage('Nội dung phải từ 10-5000 ký tự'),
  body('priority')
    .notEmpty().withMessage('Độ ưu tiên không được để trống')
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Độ ưu tiên không hợp lệ'),
  body('attachments')
    .optional()
    .isArray().withMessage('Attachments phải là mảng')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Không được đính kèm quá 5 file');
      }
      return true;
    }),
  body('image')
    .optional({ nullable: true })
    .isString().withMessage('Image phải là string (URL hoặc path)'),
  async (req, res, next) => {
    console.log('📡 [validateContact] Request body:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Cleanup uploaded files
      if (req.files) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }
      if (req.body && req.body.imagePublicId) { // Thêm kiểm tra req.body
        await cloudinary.uploader.destroy(req.body.imagePublicId).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];

// ====================== VALIDATE REPLY ======================
const validateReply = [
  param('id')
    .isMongoId().withMessage('Contact ID không hợp lệ'),
  body('message')
    .trim()
    .notEmpty().withMessage('Nội dung phản hồi không được để trống')
    .isLength({ min: 5, max: 5000 }).withMessage('Nội dung phản hồi phải từ 5-5000 ký tự'),
  body('isInternal')
    .optional()
    .isBoolean().withMessage('isInternal phải là boolean')
    .toBoolean(),
  body('attachments')
    .optional()
    .isArray().withMessage('Attachments phải là mảng')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Reply không được đính kèm quá 5 file');
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files) {
        await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
      }
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];

// ====================== VALIDATE STATUS UPDATE ======================
const validateStatusUpdate = [
  param('id')
    .isMongoId().withMessage('Contact ID không hợp lệ'),
  body('status')
    .notEmpty().withMessage('Trạng thái không được để trống')
    .isIn(['Pending', 'In Progress', 'Resolved', 'Closed'])
    .withMessage('Trạng thái không hợp lệ'),
  (req, res, next) => {
    console.log('📡 [validateStatusUpdate] Request:', {
      params: req.params,
      body: JSON.stringify(req.body, null, 2)
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [validateStatusUpdate] Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    console.log('✅ [validateStatusUpdate] Validation passed');
    next();
  }
];

// ====================== VALIDATE CONTACT ID ======================
const validateContactId = [
  param('id')
    .isMongoId().withMessage('Contact ID không hợp lệ'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Contact ID không hợp lệ',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

// ====================== VALIDATE LIST QUERY ======================
const validateListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page phải là số nguyên dương')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Resolved', 'Closed', 'all'])
    .withMessage('Status không hợp lệ'),
  query('reason')
    .optional()
    .isIn(['Order', 'Product', 'Service', 'Warranty', 'Other', 'all'])
    .withMessage('Reason không hợp lệ'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'all'])
    .withMessage('Priority không hợp lệ'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'priority', 'status'])
    .withMessage('sortBy không hợp lệ'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order phải là asc hoặc desc'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search query không quá 200 ký tự'),
  query('dateFrom')
    .optional()
    .isISO8601().withMessage('dateFrom phải là định dạng ISO8601')
    .toDate(),
  query('dateTo')
    .optional()
    .isISO8601().withMessage('dateTo phải là định dạng ISO8601')
    .toDate(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Query parameters không hợp lệ',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateContact,
  validateReply,
  validateStatusUpdate,
  validateContactId,
  validateListQuery
};