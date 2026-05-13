import { Pool, PoolClient } from 'pg';
import { validate } from '../business-logic/debtTracker/TransactionValidator';
import { enumerateDueMonths, parseLocalDateOnly } from '../business-logic/debtRecurrence/debtRecurrenceDates';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { DebtRecurrenceRepository } from '../repositories/DebtRecurrenceRepository';
import type { DebtRecurrenceTemplate } from '../types/debtRecurrence';

/**
 * Creates debt_transactions_v2 rows for all due months that do not yet have an occurrence row.
 */
export async function processDebtRecurrence(
  pool: Pool,
  transactionRepository: TransactionRepository,
  recurrenceRepository: DebtRecurrenceRepository,
  runDate: Date = new Date()
): Promise<number> {
  const templates = await recurrenceRepository.listActive();
  if (templates.length === 0) return 0;

  const today = parseLocalDateOnly(
    `${runDate.getFullYear()}-${String(runDate.getMonth() + 1).padStart(2, '0')}-${String(runDate.getDate()).padStart(2, '0')}`
  );

  let created = 0;
  const client = await pool.connect();
  try {
    for (const t of templates) {
      const n = await processOneTemplate(client, transactionRepository, recurrenceRepository, t, today);
      created += n;
    }
  } finally {
    client.release();
  }
  return created;
}

async function processOneTemplate(
  client: PoolClient,
  transactionRepository: TransactionRepository,
  recurrenceRepository: DebtRecurrenceRepository,
  template: DebtRecurrenceTemplate,
  today: Date
): Promise<number> {
  const startDate = parseLocalDateOnly(template.startDate);
  const endDate = template.endDate ? parseLocalDateOnly(template.endDate) : null;

  const due = enumerateDueMonths({
    startDate,
    endDate,
    dayOfMonth: template.dayOfMonth,
    today,
  });

  let n = 0;
  for (const period of due) {
    await client.query('BEGIN');
    try {
      const exists = await recurrenceRepository.occurrenceExists(client, template.id, period.year, period.month);
      if (exists) {
        await client.query('COMMIT');
        continue;
      }

      const ts = period.occurrenceDate.getTime();
      const txPayload = {
        from: template.from,
        to: template.to,
        amount: template.amount,
        timestamp: ts,
        description: template.description,
      };
      const validation = validate(txPayload);
      if (!validation.valid) {
        await client.query('ROLLBACK');
        console.error(
          `[debt recurrence] template ${template.id} period ${period.year}-${period.month} validation failed:`,
          validation.errors
        );
        continue;
      }

      const createdTx = await transactionRepository.create(txPayload, client);
      await recurrenceRepository.insertOccurrence(client, template.id, period.year, period.month, createdTx.id);
      await client.query('COMMIT');
      n += 1;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`[debt recurrence] template ${template.id} period ${period.year}-${period.month}:`, e);
    }
  }
  return n;
}
