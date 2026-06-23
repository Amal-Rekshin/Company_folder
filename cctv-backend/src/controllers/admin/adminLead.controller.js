const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

// GET /api/admin/leads
async function getAllLeads(req, res, next) {
  try {
    const result = await query(
      `SELECT l.id, l.query_id, l.assigned_to, l.customer_id, l.status, l.notes, l.created_at, l.updated_at,
              q.name, q.phone, q.email, q.city, q.issue_type,
              u.name AS assigned_to_name
       FROM leads l
       JOIN queries q ON q.id = l.query_id
       LEFT JOIN users u ON u.id = l.assigned_to
       ORDER BY l.created_at DESC`
    );
    const leads = result.rows.map(row => ({
      id: row.id,
      query_id: row.query_id,
      queryId: row.query_id,
      assigned_to: row.assigned_to,
      assignedTo: row.assigned_to,
      customer_id: row.customer_id,
      customerId: row.customer_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
      assigned_to_name: row.assigned_to_name,
      assignedToName: row.assigned_to_name,
      query: {
        id: row.query_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        issueType: row.issue_type
      }
    }));
    return res.json(leads);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/leads/:id
async function getLead(req, res, next) {
  try {
    const result = await query(
      `SELECT l.id, l.query_id, l.assigned_to, l.customer_id, l.status, l.notes, l.created_at, l.updated_at,
              q.name, q.phone, q.email, q.city, q.state, q.pincode, q.issue_type, q.description,
              u.name AS assigned_to_name
       FROM leads l
       JOIN queries q ON q.id = l.query_id
       LEFT JOIN users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    
    const row = result.rows[0];
    const lead = {
      id: row.id,
      query_id: row.query_id,
      queryId: row.query_id,
      assigned_to: row.assigned_to,
      assignedTo: row.assigned_to,
      customer_id: row.customer_id,
      customerId: row.customer_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
      assigned_to_name: row.assigned_to_name,
      assignedToName: row.assigned_to_name,
      query: {
        id: row.query_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        issueType: row.issue_type,
        description: row.description
      }
    };
    return res.json(lead);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/leads/:id/assign
async function assignLead(req, res, next) {
  try {
    const { assignedTo } = req.body;

    const userCheck = await query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (userCheck.rows.length === 0) throw new AppError('User not found', 404);

    const result = await query(
      `UPDATE leads SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assignedTo, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/leads/:id/notes
async function addNote(req, res, next) {
  try {
    const { note } = req.body;
    const result = await query(
      `UPDATE leads SET notes = COALESCE(notes || E'\n', '') || $1,
       updated_at = NOW() WHERE id = $2 RETURNING *`,
      [note, req.params.id]
    );
    if (result.rows.length === 0) throw new AppError('Lead not found', 404);
    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/leads
async function createLead(req, res, next) {
  try {
    const { name, phone, email, city, state, pincode, issueType, description, assignedTo, notes } = req.body;

    if (!name || !phone || !email || !city || !issueType || !description) {
      throw new AppError('Name, phone, email, city, issueType, and description are required', 400);
    }

    // Start a transaction
    await query('BEGIN');

    // 1. Create a query record
    const queryResult = await query(
      `INSERT INTO queries (name, phone, email, city, state, pincode, issue_type, source, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', $8, 'converted_to_lead')
       RETURNING *`,
      [name, phone, email, city, state || null, pincode || null, issueType, description]
    );
    const q = queryResult.rows[0];

    // 2. Find or create the customer user matching the email
    let customerResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    let customerId;
    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].id;
    } else {
      const bcrypt = require('bcryptjs');
      const defaultHash = await bcrypt.hash('changeme123', 10);
      const newCustomer = await query(
        `INSERT INTO users (name, email, phone, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, 'customer', true) RETURNING id`,
        [name, email, phone, defaultHash]
      );
      customerId = newCustomer.rows[0].id;
    }

    // 3. Create the lead record
    const leadResult = await query(
      `INSERT INTO leads (query_id, customer_id, assigned_to, notes, status)
       VALUES ($1, $2, $3, $4, 'qualified')
       RETURNING *`,
      [q.id, customerId, assignedTo || null, notes || null]
    );
    const newLead = leadResult.rows[0];

    await query('COMMIT');

    // Fetch the newly created lead formatted properly (just like getLead does)
    const result = await query(
      `SELECT l.id, l.query_id, l.assigned_to, l.customer_id, l.status, l.notes, l.created_at, l.updated_at,
              q.name, q.phone, q.email, q.city, q.state, q.pincode, q.issue_type, q.description,
              u.name AS assigned_to_name
       FROM leads l
       JOIN queries q ON q.id = l.query_id
       LEFT JOIN users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [newLead.id]
    );

    const row = result.rows[0];
    const lead = {
      id: row.id,
      query_id: row.query_id,
      queryId: row.query_id,
      assigned_to: row.assigned_to,
      assignedTo: row.assigned_to,
      customer_id: row.customer_id,
      customerId: row.customer_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      createdAt: row.created_at,
      updated_at: row.updated_at,
      updatedAt: row.updated_at,
      assigned_to_name: row.assigned_to_name,
      assignedToName: row.assigned_to_name,
      query: {
        id: row.query_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        issueType: row.issue_type,
        description: row.description
      }
    };

    return res.status(201).json(lead);
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
}

module.exports = { getAllLeads, getLead, assignLead, addNote, createLead };
