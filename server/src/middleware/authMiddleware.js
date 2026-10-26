const jwt = require('jsonwebtoken');
const config = require('../config/env');

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
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, role, email, internId, name }
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
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
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
