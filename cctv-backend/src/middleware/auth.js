const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Middleware: verify Bearer JWT and attach req.user = { id, email, role }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
}

/**
 * Middleware factory: check that req.user.role is one of the allowed roles
 * Usage: requireRole('admin', 'technician')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }
    const userRole = req.user.role.toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
