import { Pool, PoolClient } from 'pg';
import type {
  CreateDebtRecurrenceTemplateInput,
  DebtRecurrenceTemplate,
  UpdateDebtRecurrenceTemplateInput,
} from '../types/debtRecurrence';
import type { Entity } from '../types/debtTracker';

function mapTemplateRow(row: any): DebtRecurrenceTemplate {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
  return {
    id: row.id,
    from: row.from_entity as Entity,
    to: row.to_entity as Entity,
    amount: parseFloat(row.amount),
    description: row.description ?? undefined,
    dayOfMonth: row.day_of_month,
    startDate: row.start_date as string,
    endDate: row.end_date ?? null,
    active: row.active,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export class DebtRecurrenceRepository {
  constructor(private pool: Pool) {}

  async listAll(): Promise<DebtRecurrenceTemplate[]> {
    const result = await this.pool.query(
      `SELECT id, from_entity, to_entity, amount, description, day_of_month,
              start_date::text AS start_date, end_date::text AS end_date, active,
              created_at, updated_at
       FROM debt_recurrence_templates
       ORDER BY created_at DESC`
    );
    return result.rows.map(mapTemplateRow);
  }

  async listActive(): Promise<DebtRecurrenceTemplate[]> {
    const result = await this.pool.query(
      `SELECT id, from_entity, to_entity, amount, description, day_of_month,
              start_date::text AS start_date, end_date::text AS end_date, active,
              created_at, updated_at
       FROM debt_recurrence_templates
       WHERE active = TRUE
       ORDER BY created_at ASC`
    );
    return result.rows.map(mapTemplateRow);
  }

  async getById(id: string): Promise<DebtRecurrenceTemplate | null> {
    const result = await this.pool.query(
      `SELECT id, from_entity, to_entity, amount, description, day_of_month,
              start_date::text AS start_date, end_date::text AS end_date, active,
              created_at, updated_at
       FROM debt_recurrence_templates WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return mapTemplateRow(result.rows[0]);
  }

  async create(input: CreateDebtRecurrenceTemplateInput): Promise<DebtRecurrenceTemplate> {
    const result = await this.pool.query(
      `INSERT INTO debt_recurrence_templates
        (from_entity, to_entity, amount, description, day_of_month, start_date, end_date, active)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, COALESCE($8, TRUE))
       RETURNING id, from_entity, to_entity, amount, description, day_of_month,
                 start_date::text AS start_date, end_date::text AS end_date, active,
                 created_at, updated_at`,
      [
        input.from,
        input.to,
        input.amount,
        input.description ?? null,
        input.dayOfMonth,
        input.startDate,
        input.endDate ?? null,
        input.active,
      ]
    );
    return mapTemplateRow(result.rows[0]);
  }

  async update(id: string, input: UpdateDebtRecurrenceTemplateInput): Promise<DebtRecurrenceTemplate | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (input.from !== undefined) {
      fields.push(`from_entity = $${i++}`);
      values.push(input.from);
    }
    if (input.to !== undefined) {
      fields.push(`to_entity = $${i++}`);
      values.push(input.to);
    }
    if (input.amount !== undefined) {
      fields.push(`amount = $${i++}`);
      values.push(input.amount);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(input.description);
    }
    if (input.dayOfMonth !== undefined) {
      fields.push(`day_of_month = $${i++}`);
      values.push(input.dayOfMonth);
    }
    if (input.startDate !== undefined) {
      fields.push(`start_date = $${i++}::date`);
      values.push(input.startDate);
    }
    if (input.endDate !== undefined) {
      fields.push(`end_date = $${i++}::date`);
      values.push(input.endDate);
    }
    if (input.active !== undefined) {
      fields.push(`active = $${i++}`);
      values.push(input.active);
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    values.push(id);
    const result = await this.pool.query(
      `UPDATE debt_recurrence_templates SET ${fields.join(', ')}
       WHERE id = $${i}
       RETURNING id, from_entity, to_entity, amount, description, day_of_month,
                 start_date::text AS start_date, end_date::text AS end_date, active,
                 created_at, updated_at`,
      values
    );
    if (result.rows.length === 0) return null;
    return mapTemplateRow(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM debt_recurrence_templates WHERE id = $1 RETURNING id', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async occurrenceExists(
    client: Pool | PoolClient,
    templateId: string,
    calendarYear: number,
    calendarMonth: number
  ): Promise<boolean> {
    const r = await client.query(
      `SELECT 1 FROM debt_recurrence_occurrences
       WHERE template_id = $1 AND calendar_year = $2 AND calendar_month = $3`,
      [templateId, calendarYear, calendarMonth]
    );
    return r.rows.length > 0;
  }

  async insertOccurrence(
    client: PoolClient,
    templateId: string,
    calendarYear: number,
    calendarMonth: number,
    transactionId: string
  ): Promise<void> {
    await client.query(
      `INSERT INTO debt_recurrence_occurrences (template_id, calendar_year, calendar_month, transaction_id)
       VALUES ($1, $2, $3, $4)`,
      [templateId, calendarYear, calendarMonth, transactionId]
    );
  }
}
