const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const AppError = require('../utils/AppError');

// GET /api/users/profile
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, email, phone, password } = req.body;

    // Get current user to compare values
    const currentUserRes = await query('SELECT email, phone FROM users WHERE id = $1', [userId]);
    if (currentUserRes.rows.length === 0) throw new AppError('User not found', 404);
    const currentUser = currentUserRes.rows[0];

    // Check if email is taken by another user (only if changing)
    if (email && email !== currentUser.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
      if (emailCheck.rows.length > 0) throw new AppError('Email is already in use by another account', 409);
    }

    // Check if phone is taken by another user (only if changing)
    if (phone && phone !== currentUser.phone) {
      const phoneCheck = await query('SELECT id FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
      if (phoneCheck.rows.length > 0) throw new AppError('Phone is already in use by another account', 409);
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, phone, role, is_active`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile
};
