import type { Entity } from './debtTracker';

export interface DebtRecurrenceTemplate {
  id: string;
  from: Entity;
  to: Entity;
  amount: number;
  description?: string;
  dayOfMonth: number;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtRecurrenceTemplateInput {
  from: Entity;
  to: Entity;
  amount: number;
  description?: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export interface UpdateDebtRecurrenceTemplateInput {
  from?: Entity;
  to?: Entity;
  amount?: number;
  description?: string | null;
  dayOfMonth?: number;
  startDate?: string;
  endDate?: string | null;
  active?: boolean;
}
