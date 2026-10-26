const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]', {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
  });

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} ("${value}") already exists.`,
      field,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => el.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format for ${err.path}.`,
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    error: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
