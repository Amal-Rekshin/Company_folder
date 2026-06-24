const cron = require('node-cron');
const { query } = require('../config/db');

function initCronJobs() {
  // Run every night at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Starting cleanup of expired quotations...');
      
      // Delete quotations that are in 'sent' status and were sent more than 7 days ago
      const result = await query(
        `DELETE FROM quotations 
         WHERE status = 'sent' 
         AND sent_at < NOW() - INTERVAL '7 days'`
      );

      if (result.rowCount > 0) {
        console.log(`[CRON] Successfully deleted ${result.rowCount} expired quotation(s).`);
      } else {
        console.log('[CRON] No expired quotations found to delete.');
      }
    } catch (err) {
      console.error('[CRON] Error during quotation cleanup:', err.message);
    }
  });

  console.log('[CRON] Scheduled jobs initialized.');
}

module.exports = { initCronJobs };
