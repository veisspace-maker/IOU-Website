// Data model interfaces for IOU

/** Subset attached to req.user — never includes password or TOTP secret */
export interface SessionUser {
  id: string;
  username: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Full user row shape used during login / Passport local verification */
export interface User extends SessionUser {
  passwordHash: string;
  twoFactorSecret?: string;
}

export interface Transaction {
  id: string;
  fromUserId: string | null;  // Person who received value (left person) - NULL for company transactions
  toUserId: string;           // Person who provided value (right person) - For company: person who received
  amount: number;             // Must be > 0
  date: Date;
  description?: string;
  transactionType: 'personal' | 'company';
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalTransaction {
  id: string;
  fromUserId: string;  // Person who received value (left person)
  toUserId: string;    // Person who provided value (right person)
  amount: number;      // Must be > 0, in AUD
  date: Date;
  description?: string;
  createdAt: Date;
}

export interface CompanyTransaction {
  id: string;
  userId: string;      // Person who paid or received
  amount: number;      // Must be > 0, in AUD
  date: Date;
  description?: string;
  transactionType: 'personal_for_company' | 'company_for_personal' | 'company_income_personal' | 'company_for_company';
  createdAt: Date;
}

export interface CompanyDebt {
  userAId: string;
  userBId: string;
  debtAmount: number;     // Positive = A owes B, Negative = B owes A
  lastTransactionDate: Date;
}

export interface CombinedBalance {
  userAId: string;
  userBId: string;
  personalBalance: number;
  companyDebt: number;
  combinedBalance: number;  // personalBalance + companyDebt
  lastTransactionDate: Date;
}

export interface NetBalance {
  userAId: string;
  userBId: string;
  netAmount: number;      // Positive = A owes B, Negative = B owes A
  lastTransactionDate: Date;
}

export interface LeaveRecord {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  businessDays: number;  // Calculated field
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClosedDate {
  id: string;
  startDate: Date;
  endDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Birthday {
  id: string;
  name: string;
  dateOfBirth: Date;  // Store only date, not age
  createdAt: Date;
  updatedAt: Date;
}

export interface BirthdayWithAge {
  id: string;
  name: string;
  dateOfBirth: Date;
  turningAge: number;  // Calculated dynamically
  isToday: boolean;
}

export interface SalesTransaction {
  id: string;
  item: string;            // Product/service name (stored with original casing)
  price: number;           // Sale amount (must be > 0)
  quantity: number;        // Quantity sold (must be > 0, defaults to 1)
  date: string;            // ISO 8601 date string (YYYY-MM-DD)
  seller: string;          // Seller name/identifier
  description: string | null;  // Optional additional details
  createdBy: string;       // User ID who created the record
  createdAt?: Date;        // Timestamp when record was created
}

export interface ItemStats {
  item: string;            // Original item name (first occurrence casing)
  totalRevenue: number;    // Sum of all prices for this item
  count: number;           // Number of transactions for this item
  transactions: SalesTransaction[];  // All transactions for this item
}
