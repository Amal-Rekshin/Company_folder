const { query } = require('../config/db');

/**
 * Generates a unique ticket number in the format TICK-XXXXXX
 * Uses a DB sequence-like approach: counts existing tickets + 1
 */
async function generateTicketNumber() {
  const prefix = process.env.TICKET_NUMBER_PREFIX || 'TICK';
  const result = await query('SELECT COUNT(*) AS cnt FROM tickets');
  const count = parseInt(result.rows[0].cnt, 10) + 1;
  const padded = String(count).padStart(6, '0');
  return `${prefix}-${padded}`;
}

module.exports = { generateTicketNumber };
