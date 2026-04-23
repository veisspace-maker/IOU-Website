# IOU Application - Complete Overview

A comprehensive business management system for tracking sales, debts, employee leave, and company operations.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Navigation](#navigation)
- [State Management](#state-management)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

The IOU Application is a full-stack web application designed to manage multiple aspects of a small business:

- **Sales Tracker**: Record and analyze sales transactions with item-level insights
- **Debt Tracker**: Track money owed between business partners with automatic calculations
- **Leave Tracker**: Manage employee leave with intelligent business day calculations
- **Settings**: Configure users, holidays, closed dates, and birthdays

The application provides a unified interface for financial tracking, HR management, and business analytics.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Date Handling**: date-fns
- **HTTP Client**: Axios

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session
- **Password Hashing**: bcrypt
- **2FA**: speakeasy (TOTP)
- **Validation**: Custom validators

### Database
- **RDBMS**: PostgreSQL 14+
- **ORM**: None (raw SQL queries with pg driver)
- **Migrations**: Custom migration scripts
- **Timezone**: Configurable (default: Australia/Melbourne)

## Features

### 1. Sales Tracker
- Record sales with item, price, quantity, and seller
- Item-level analytics and breakdowns
- Automatic debt transaction creation
- Seller performance tracking
- Pagination and filtering

**Key Components:**
- `SalesPage.tsx`
- `AddSalesTransactionForm.tsx`
- `SalesTransactionList.tsx`
- `ItemBreakdownTable.tsx`

**API Endpoints:**
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### 2. Debt Tracker
- Track money between Lev and Danik
- Support for shared expenses (2masters)
- Automatic net debt calculation
- Transaction history with edit/delete
- Real-time balance updates

**Key Components:**
- `DebtTrackerPage.tsx`
- `TransactionForm.tsx`
- `DebtDisplay.tsx`
- `TransactionHistory.tsx`

**API Endpoints:**
- `GET /api/debt-transactions-v2` - List transactions
- `POST /api/debt-transactions-v2` - Create transaction
- `GET /api/debt-transactions-v2/net-debt` - Get net debt
- `PUT /api/debt-transactions-v2/:id` - Update transaction
- `DELETE /api/debt-transactions-v2/:id` - Delete transaction

### 3. Leave Tracker
- Book employee leave with date ranges
- Automatic business day calculation
- Excludes weekends, holidays, and closed dates
- Overlap detection and warnings
- Calendar view for date selection

**Key Components:**
- `LeavePage.tsx`
- `LeaveEntryForm.tsx`
- `LeaveCalendar.tsx`
- `LeaveHistory.tsx`

**API Endpoints:**
- `GET /api/leave` - List leave records
- `POST /api/leave` - Create leave
- `PUT /api/leave/:id` - Update leave
- `DELETE /api/leave/:id` - Delete leave
- `POST /api/leave/calculate-business-days` - Calculate days
- `POST /api/leave/check-overlap` - Check overlap

### 4. Settings
- User account management
- Two-factor authentication setup
- Public holidays management
- Company closed dates
- Employee birthdays

**Key Components:**
- `SettingsPage.tsx`
- `AccountSettings.tsx`
- `PublicHolidaysManager.tsx`
- `ClosedDatesManager.tsx`
- `BirthdaysManager.tsx`

**API Endpoints:**
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/holidays/*` - Holidays
- `/api/closed-dates/*` - Closed dates
- `/api/birthdays/*` - Birthdays

## Technology Stack

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "@reduxjs/toolkit": "^1.9.x",
  "react-redux": "^8.x",
  "@mui/material": "^5.x",
  "@mui/x-date-pickers": "^6.x",
  "axios": "^1.x",
  "date-fns": "^2.x"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.x",
  "typescript": "^5.x",
  "pg": "^8.x",
  "passport": "^0.6.x",
  "passport-local": "^1.0.x",
  "express-session": "^1.17.x",
  "bcrypt": "^5.x",
  "speakeasy": "^2.x",
  "uuid": "^9.x",
  "dotenv": "^16.x",
  "cors": "^2.8.x"
}
```

### Development Tools
```json
{
  "vite": "^4.x",
  "vitest": "^0.34.x",
  "@testing-library/react": "^14.x",
  "tsx": "^3.x",
  "nodemon": "^3.x"
}
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd iou-application
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/iou_db
DB_TIMEZONE=Australia/Melbourne
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:3001
```

4. **Set up the database**
```bash
cd backend
npm run setup-db
```

5. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Initial Setup

1. Create your first user account through the login page
2. Configure public holidays in Settings
3. Add any company closed dates
4. Start tracking sales, debts, and leave!

## Project Structure

```
iou-application/
├── backend/
│   ├── src/
│   │   ├── business-logic/      # Business calculations
│   │   │   ├── calculations.ts
│   │   │   ├── debtCalculations.ts
│   │   │   ├── salesCalculations.ts
│   │   │   └── debtTracker/
│   │   ├── config/              # Database and configuration
│   │   │   ├── database.ts
│   │   │   └── schema.sql
│   │   ├── middleware/          # Express middleware
│   │   │   └── auth.ts
│   │   ├── repositories/        # Data access layer
│   │   │   ├── index.ts
│   │   │   └── TransactionRepository.ts
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── salesTransactions.ts
│   │   │   ├── debtTransactionsV2.ts
│   │   │   ├── leave.ts
│   │   │   ├── holidays.ts
│   │   │   ├── closedDates.ts
│   │   │   └── birthdays.ts
│   │   ├── scripts/             # Database scripts
│   │   ├── types/               # TypeScript types
│   │   │   ├── models.ts
│   │   │   └── debtTracker.ts
│   │   ├── utils/               # Utility functions
│   │   └── index.ts             # Express app entry
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client functions
│   │   │   ├── salesApi.ts
│   │   │   └── debtTrackerApi.ts
│   │   ├── components/          # React components
│   │   │   ├── AddSalesTransactionForm.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── LeaveEntryForm.tsx
│   │   │   └── ...
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   └── useScrollPreservation.ts
│   │   ├── pages/               # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── SalesPage.tsx
│   │   │   ├── DebtTrackerPage.tsx
│   │   │   ├── LeavePage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── store/               # Redux store
│   │   │   ├── index.ts
│   │   │   ├── hooks.ts
│   │   │   └── slices/
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── README.md
└── package.json
```

## Authentication

### Authentication Flow

1. **Login**: User provides username and password/PIN
2. **Validation**: Credentials verified against database
3. **2FA** (if enabled): User provides TOTP code
4. **Session**: Session created and stored
5. **Cookie**: Session ID sent to client
6. **Requests**: Cookie included in subsequent requests
7. **Middleware**: `isAuthenticated` verifies session

### Session Management

- **Storage**: In-memory (development) or Redis (production)
- **Duration**: 24 hours (default) or 30 days (remember me)
- **Security**: HTTP-only cookies, secure flag in production
- **Cleanup**: Automatic expiration and cleanup

### Two-Factor Authentication

- **Algorithm**: TOTP (Time-based One-Time Password)
- **Standard**: RFC 6238
- **Code Length**: 6 digits
- **Time Window**: 30 seconds
- **Apps**: Compatible with Google Authenticator, Authy, etc.

### Protected Routes

All API routes except `/api/auth/login` require authentication:
```typescript
router.use(isAuthenticated);
```

Frontend routes are protected by `AuthContext`:
```typescript
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};
```

## Navigation

### Route Structure

```
/ (Home)
├── /login (Login Page)
├── /debt-tracker (Debt Tracker)
├── /sales (Sales Tracker)
├── /leave (Leave Tracker)
├── /money (Money Mode Selection)
│   ├── /money/personal (Personal Money)
│   └── /money/company (Company Money)
└── /settings (Settings)
    ├── Account
    ├── Public Holidays
    ├── Closed Dates
    └── Birthdays
```

### Navigation Components

- **App Bar**: Top navigation with title and logout
- **Bottom Navigation**: Mobile-friendly bottom tabs
- **Drawer**: Side navigation for desktop
- **Breadcrumbs**: Current location indicator

## State Management

### Redux Store Structure

```typescript
{
  user: {
    currentUser: User | null,
    loading: boolean,
    error: string | null
  },
  transactions: {
    items: Transaction[],
    total: number,
    loading: boolean,
    error: string | null
  },
  leave: {
    records: LeaveRecord[],
    total: number,
    loading: boolean,
    error: string | null
  },
  holidays: {
    items: PublicHoliday[],
    loading: boolean,
    error: string | null
  },
  closedDates: {
    items: ClosedDate[],
    loading: boolean,
    error: string | null
  },
  birthdays: {
    items: Birthday[],
    loading: boolean,
    error: string | null
  }
}
```

### Redux Slices

- `userSlice.ts`: User authentication state
- `transactionsSlice.ts`: Transaction data
- `leaveSlice.ts`: Leave records
- `holidaysSlice.ts`: Public holidays
- `closedDatesSlice.ts`: Closed dates
- `birthdaysSlice.ts`: Birthday records

### Middleware

- `reactiveUpdates.ts`: Automatic data refresh on changes

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Header
```
Cookie: connect.sid=<session-id>
```

### Common Response Formats

**Success:**
```json
{
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ /* additional error details */ ]
  }
}
```

### Pagination

Endpoints supporting pagination accept:
- `limit`: Records per page (default varies, max 1000)
- `offset`: Records to skip (default 0)

Response includes:
```json
{
  "items": [ /* array of items */ ],
  "total": 250,
  "limit": 50,
  "offset": 0
}
```

## Database Schema

### Core Tables

**users**
- Primary authentication and user profiles
- Stores hashed passwords and 2FA secrets

**sales_transactions**
- Sales records with item, price, quantity
- Links to users table for creator

**debt_transactions_v2**
- Debt tracking between entities
- Supports Lev, Danik, and 2masters

**leave_records**
- Employee leave tracking
- Links to users table

**public_holidays**
- National and regional holidays
- Used in business day calculations

**closed_dates**
- Company closure periods
- Used in business day calculations

**birthdays**
- Employee birthday tracking
- Age calculated dynamically

### Relationships

```
users (1) ─── (N) sales_transactions
users (1) ─── (N) leave_records
```

### Indexes

- `idx_sales_date`: Sales by date (DESC)
- `idx_sales_seller`: Sales by seller
- `idx_debt_timestamp`: Debt by timestamp (DESC)
- `idx_leave_dates`: Leave by date range
- `idx_holiday_date`: Holidays by date

## Testing

### Frontend Tests

**Unit Tests:**
```bash
cd frontend
npm test
```

**Coverage:**
```bash
npm run test:coverage
```

**Test Files:**
- `*.test.tsx`: Component tests
- `*.test.ts`: Utility function tests
- `*.pbt.test.tsx`: Property-based tests

### Backend Tests

**Unit Tests:**
```bash
cd backend
npm test
```

**Integration Tests:**
```bash
npm run test:integration
```

**Test Files:**
- `*.test.ts`: Business logic and API tests
- `*.pbt.test.ts`: Property-based tests

### Testing Tools

- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **Supertest**: API endpoint testing

## Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output: dist/
```

**Backend:**
```bash
cd backend
npm run build
# Output: dist/
```

### Environment Variables

**Production Backend:**
```env
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/db
DB_TIMEZONE=Australia/Melbourne
SESSION_SECRET=<strong-random-secret>
NODE_ENV=production
```

**Production Frontend:**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Deployment Options

1. **Traditional Server**: Deploy to VPS with PM2
2. **Docker**: Use Docker Compose for containerization
3. **Cloud**: Deploy to AWS, Azure, or Google Cloud
4. **Serverless**: Use Vercel (frontend) + AWS Lambda (backend)

### Database Migration

```bash
cd backend
npm run migrate
```

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes with tests
3. Run tests and linting
4. Submit pull request
5. Code review
6. Merge to `main`

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Naming**: camelCase for variables, PascalCase for components

### Commit Messages

Follow conventional commits:
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
refactor: Refactor code
style: Format code
chore: Update dependencies
```

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: support@yourdomain.com
- Documentation: [docs-url]

## Acknowledgments

- Material-UI for the component library
- PostgreSQL for the database
- React and Express communities
