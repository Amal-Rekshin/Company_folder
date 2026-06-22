const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

function signTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '86400s',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '604800s',
  });
  return { accessToken, refreshToken };
}

function buildAuthResponse(user, tokens) {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check duplicate email
    const emailCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) throw new AppError('Email is already in use!', 409);

    // Check duplicate phone
    const phoneCheck = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (phoneCheck.rows.length > 0) throw new AppError('Phone is already in use!', 409);

    const allowedRoles = ['customer', 'admin', 'technician', 'partner'];
    if (!allowedRoles.includes(role)) throw new AppError('Invalid role', 400);

    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email, phone, passwordHash, role]
    );
    const user = userResult.rows[0];

    // Create linked profile
    if (role === 'technician') {
      await query(
        'INSERT INTO technician_profiles (user_id, is_available) VALUES ($1, true)',
        [user.id]
      );
    } else if (role === 'partner') {
      await query(
        `INSERT INTO partner_profiles (user_id, company_name, commission_rate)
         VALUES ($1, $2, $3)`,
        [user.id, `${name} Co.`, parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 10.0]
      );
    }

    const tokens = signTokens(user);
    return res.status(201).json(buildAuthResponse(user, tokens));
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const userResult = await query(
      'SELECT id, name, email, phone, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) throw new AppError('Invalid credentials', 401);

    const user = userResult.rows[0];
    if (!user.is_active) throw new AppError('Account is deactivated', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    // Map snake_case from DB to camelCase for token payload
    const userForToken = { id: user.id, email: user.email, role: user.role };
    const tokens = signTokens(userForToken);

    return res.json(buildAuthResponse({ ...user, name: user.name }, tokens));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
