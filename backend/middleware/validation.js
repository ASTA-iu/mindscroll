const { validationResult, body } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validateRequest
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
  validateRequest
];

const validatePost = [
  body('content').optional().isLength({ max: 20000 }).withMessage('Post content too long'),
  body('image').optional().custom((value) => {
    if (!value) return true;
    // Check base64 length (5MB = ~6,666,666 base64 chars)
    if (value.length > 6666666) {
      throw new Error('Image too large (max 5MB)');
    }
    return true;
  }),
  validateRequest
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePost,
  validateRequest
};
