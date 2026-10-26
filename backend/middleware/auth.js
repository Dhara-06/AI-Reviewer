const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_ai_review_system_2026_dev_seed';

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, role, email, internId }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
      error: error.message,
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }
  next();
};

const requireInternOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }
  // If user is intern, ensure they are requesting their own ID if route contains an ID
  if (req.user.role === 'intern' && req.params.internId && req.params.internId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Interns can only access their own records.',
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireInternOrAdmin,
};
