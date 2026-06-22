const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack || '');

  // Operational errors: known AppErrors we threw intentionally
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Value violates a database constraint.' });
  }

  // Validation errors from express-validator (passed as array)
  if (Array.isArray(err)) {
    return res.status(422).json({ errors: err });
  }

  // Unknown / programming error — hide details in production
  return res.status(500).json({ error: 'An unexpected error occurred.' });
}

module.exports = errorHandler;
