import cron from 'node-cron';
import pool from '../config/database';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { DebtRecurrenceRepository } from '../repositories/DebtRecurrenceRepository';
import { processDebtRecurrence } from '../services/debtRecurrenceService';

/**
 * Daily at 00:05 server local time: backfill missed monthly debt transactions from templates.
 */
export function startDebtRecurrenceScheduler(): void {
  if (process.env.VITEST === 'true' || process.env.DISABLE_DEBT_RECURRENCE_CRON === 'true') {
    return;
  }

  const transactionRepository = new TransactionRepository(pool);
  const recurrenceRepository = new DebtRecurrenceRepository(pool);

  cron.schedule(
    '5 0 * * *',
    async () => {
      try {
        const n = await processDebtRecurrence(pool, transactionRepository, recurrenceRepository, new Date());
        if (n > 0) {
          console.log(`[debt recurrence] created ${n} transaction(s)`);
        }
      } catch (err) {
        console.error('[debt recurrence] scheduled run failed:', err);
      }
    }
  );

  console.log('[debt recurrence] cron registered: daily at 00:05 (server local time)');
}
