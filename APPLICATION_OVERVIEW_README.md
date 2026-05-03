# UOMe Application - Complete Overview

A comprehensive business management system for tracking sales, debts, and employee leave for a two-person business partnership.

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
- [Progressive Web App](#progressive-web-app)

## Overview

The UOMe Application is a full-stack Progressive Web App designed for a two-person business partnership (Lev and Danik):

- **Sales Tracker**: Record and analyze sales transactions with item-level insights, quantity tracking, and seller attribution
- **Debt Tracker**: Track money owed between Lev and Danik with automatic 50/50 split calculations for shared expenses
- **Leave Tracker**: Manage employee leave with intelligent business day calculations excluding weekends, holidays, and closed dates
- **Settings**: Configure users, holidays, closed dates, birthdays, and sales items

The application provides a unified interface for financial tracking, HR management, and business analytics with automatic debt integration between sales and debt tracking.

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
- Record sales with item, price per unit, quantity, date, and seller (Leva or Danik)
- Item-level analytics with total revenue and quantity tracking
- Automatic debt transaction creation (2masters → seller for total amount)
- Seller performance tracking
- Pagination (50 transactions per page)
- Sales items management for quick item selection from dropdown
- Drill-down views for detailed item analysis
- Optional descriptions for context

**Key Components:**
- `SalesPage.tsx` - Main page with Transactions and Stats tabs
- `AddSalesTransactionForm.tsx` - Form with item dropdown and quantity support
- `SalesTransactionList.tsx` - Paginated transaction list
- `ItemBreakdownTable.tsx` - Item statistics with quantity and revenue
- `SalesItemsManager.tsx` - Manage predefined sales items
- `DrillDownView.tsx` - Detailed item analysis
- `SalesStatsCards.tsx` - Summary statistics cards

**API Endpoints:**
- `GET /api/sales` - List sales with pagination (limit, offset)
- `POST /api/sales` - Create sale (auto-creates debt transaction)
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale
- `GET /api/sales-items` - List sales items
- `POST /api/sales-items` - Create sales item
- `PUT /api/sales-items/:id` - Update sales item
- `DELETE /api/sales-items/:id` - Delete sales item

### 2. Debt Tracker
- Track money between Lev and Danik
- Support for shared expenses via "2masters" entity (50/50 split)
- Automatic net debt calculation with split transaction logic
- Transaction history with edit/delete capabilities
- Real-time balance updates
- Pagination (100 transactions per page)
- Integration with Sales Tracker (sales auto-create debt transactions)
- Entity selector with validation (prevents same entity for from/to)

**Key Components:**
- `DebtTrackerPage.tsx` - Main debt tracking page
- `TransactionForm.tsx` - Create new debt transactions
- `DebtDisplay.tsx` - Shows current net debt
- `TransactionHistory.tsx` - Paginated transaction list
- `EditTransactionDialog.tsx` - Edit existing transactions
- `EntitySelector.tsx` - Entity selection component
- `DebtSummaryCard.tsx` - Summary card for home page

**API Endpoints:**
- `GET /api/debt-transactions-v2` - List transactions with pagination
- `POST /api/debt-transactions-v2` - Create transaction
- `GET /api/debt-transactions-v2/net-debt` - Calculate net debt
- `PUT /api/debt-transactions-v2/:id` - Update transaction
- `DELETE /api/debt-transactions-v2/:id` - Delete transaction

### 3. Leave Tracker
- Book employee leave with date range selection
- Automatic business day calculation excluding weekends, holidays, and closed dates
- Overlap detection with warnings (non-blocking)
- Past date warnings (non-blocking)
- Calendar interface for visual date selection
- Pagination (50 records per page)
- Automatic recalculation when holidays/closed dates change

**Key Components:**
- `LeavePage.tsx` - Main leave management page
- `LeaveEntryForm.tsx` - Date range selection form
- `LeaveCalendar.tsx` - Visual calendar with date selection
- `LeaveHistory.tsx` - Paginated leave records list
- `LeaveSummaryCards.tsx` - Summary statistics
- `LeaveModal.tsx` - Modal for leave entry
- `LeavePersonSelector.tsx` - Person selection for leave

**API Endpoints:**
- `GET /api/leave` - List leave records with pagination
- `POST /api/leave` - Create leave
- `PUT /api/leave/:id` - Update leave
- `DELETE /api/leave/:id` - Delete leave
- `POST /api/leave/calculate-business-days` - Calculate business days for date range
- `POST /api/leave/check-overlap` - Check for overlapping leave

### 4. Settings
- User account management with username and password updates
- Two-factor authentication (TOTP) setup and management
- PIN authentication for quick login (4-6 digits)
- Public holidays management with bulk import from Nager.Date API
- Company closed dates tracking with date ranges
- Employee birthdays with age calculation
- Birthday notification preferences (browser notifications)
- Sales items management for quick item selection

**Key Components:**
- `SettingsPage.tsx` - Tabbed settings interface
- `AccountSettings.tsx` - User account and security
- `PublicHolidaysManager.tsx` - Holiday management with import
- `ClosedDatesManager.tsx` - Company closure periods
- `BirthdaysManager.tsx` - Birthday tracking
- `NotificationSettings.tsx` - Birthday notification preferences
- `SalesItemsManager.tsx` - Sales item management
- `BirthdayBanner.tsx` - Birthday display on home page
- `PublicHolidayWidget.tsx` - Upcoming holidays widget

**API Endpoints:**
- `/api/auth/*` - Authentication (login, logout, verify-2fa, `/2fa/setup`, `/2fa/enable`, `/2fa/disable`)
- `/api/users/*` - User management (list, update own profile)

- `/api/holidays/*` - Holidays CRUD
- `/api/holiday-import/*` - Holiday bulk import (import, countries)
- `/api/closed-dates/*` - Closed dates CRUD
- `/api/birthdays/*` - Birthdays CRUD
- `/api/sales-items/*` - Sales items CRUD

### 5. Progressive Web App (PWA)
- Installable on mobile and desktop devices (iOS, Android, desktop browsers)
- Offline support with service worker caching
- Auto-update functionality with user notification
- App-like experience with custom icons and splash screens
- Push notification support for birthdays (browser notifications)
- Network-first caching strategy for API calls with 5-minute fallback
- Static asset caching for offline use

**Key Components:**
- `PWAInstallPrompt.tsx` - Install prompt for supported devices
- `PWAUpdatePrompt.tsx` - Update notification when new version available
- Service worker with caching strategies (auto-generated by vite-plugin-pwa)
- `useBirthdayNotifications.ts` - Birthday notification hook

**Features:**
- Install prompt appears automatically on supported devices
- Update notification when new version available
- Offline caching for static assets (HTML, CSS, JS, fonts)
- Network-first strategy for API calls with cache fallback
- Custom app icons (192x192, 512x512, apple-touch-icon)
- Birthday notifications when app is open in browser

## Technology Stack

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.1",
  "@mui/material": "^5.15.3",
  "@mui/icons-material": "^5.15.3",
  "@mui/x-date-pickers": "^6.18.7",
  "@emotion/react": "^11.11.3",
  "@emotion/styled": "^11.11.0",
  "@reduxjs/toolkit": "^2.0.1",
  "react-redux": "^9.0.4",
  "axios": "^1.6.5",
  "date-fns": "^3.0.6",
  "date-fns-tz": "^2.0.0",
  "vite-plugin-pwa": "^0.17.4",
  "workbox-window": "^7.0.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "typescript": "^5.3.3",
  "pg": "^8.11.3",
  "passport": "^0.7.0",
  "passport-local": "^1.0.0",
  "express-session": "^1.17.3",
  "bcrypt": "^5.1.1",
  "speakeasy": "^2.0.0",
  "uuid": "^13.0.0",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "date-fns": "^3.0.6",
  "date-fns-tz": "^2.0.0"
}
```

### Development Tools
```json
{
  "vite": "^5.0.11",
  "vitest": "^1.1.0",
  "@testing-library/react": "^14.1.2",
  "tsx": "^4.7.0",
  "fast-check": "^3.15.0",
  "supertest": "^7.2.2"
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
cd uome-application
```

2. **Install dependencies**
```bash
# Install all dependencies (root, backend, and frontend)
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=company_tracker
DB_USER=postgres
DB_PASSWORD=postgres
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

Both servers:
```bash
npm run dev
```

Or separately:

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
- Frontend: http://localhost:5176 (see `frontend/vite.config.ts` `server.port`)
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

### Initial Setup

1. Sign in using users seeded by `npm run setup-db` (initial password printed by that script); change passwords afterward
2. Configure public holidays in Settings
3. Add any company closed dates
4. Start tracking sales, debts, and leave!

## Project Structure

```
uome-application/
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

### State Management Approach

The application uses a hybrid approach combining React Context and Redux Toolkit:

- **AuthContext**: Manages user authentication state, login/logout, and session handling
- **Redux Toolkit**: Manages global application state (currently minimal usage)
- **Component State**: Local state for forms and UI interactions
- **API Calls**: Direct API calls with axios for data fetching and mutations

This approach provides:
- Simple authentication flow with Context API
- Scalable state management with Redux Toolkit
- Minimal boilerplate
- Easy to understand and maintain
- Room for growth as application complexity increases

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
- Stores hashed passwords and 2FA secrets (TOTP)
- Optional PIN for quick login (hashed)
- Fields: id (UUID), username, password_hash, two_factor_secret, two_factor_enabled, created_at, updated_at

**sales_transactions**
- Sales records with item, price per unit, quantity, and seller
- Links to users table for creator
- Automatic debt transaction creation on insert
- Fields: id (UUID), item, price, quantity, date, description, seller ('leva' | 'danik'), created_by (user_id), created_at, updated_at

**debt_transactions_v2**
- Debt tracking between Lev, Danik, and 2masters (50/50 split entity)
- Stores transactions in original form (not converted)
- Fields: id (UUID), from_entity ('lev' | 'danik' | '2masters'), to_entity, amount, timestamp, description, created_at, updated_at
- Constraint: from_entity != to_entity

**leave_records**
- Employee leave tracking with business day calculations
- Links to users table
- Fields: id (UUID), user_id, start_date, end_date, business_days, created_at, updated_at
- Constraint: start_date <= end_date, business_days > 0

**public_holidays**
- National and regional holidays
- Used in business day calculations
- Fields: id (UUID), name, date, created_at, updated_at

**closed_dates**
- Company closure periods (date ranges)
- Used in business day calculations
- Fields: id (UUID), start_date, end_date, note, created_at, updated_at
- Constraint: start_date <= end_date

**birthdays**
- Employee birthday tracking
- Age calculated dynamically
- Fields: id (UUID), name, date_of_birth, created_at, updated_at

**sales_items**
- Predefined sales items for quick selection
- Used in sales transaction dropdown
- Fields: id (UUID), name (unique), created_at, updated_at

### Relationships

```
users (1) ─── (N) sales_transactions (created_by)
users (1) ─── (N) leave_records (user_id)
```

### Indexes

- `idx_sales_date`: Sales by date (DESC)
- `idx_sales_seller`: Sales by seller
- `idx_sales_item`: Sales by item (lowercase)
- `idx_debt_timestamp`: Debt by timestamp (DESC)
- `idx_debt_entities`: Debt by from/to entities
- `idx_leave_dates`: Leave by date range
- `idx_leave_user`: Leave by user
- `idx_holiday_date`: Holidays by date
- `idx_closed_dates`: Closed dates by range
- `idx_sales_items_name`: Sales items by name (lowercase)

## Testing

### Frontend Tests

**Unit Tests:**
```bash
cd frontend
npm test
```

**Watch Mode:**
```bash
npm run test:watch
```

**Test Files:**
- `*.test.tsx`: Component tests (React Testing Library)
- `*.test.ts`: Utility function tests
- `*.pbt.test.tsx`: Property-based tests (fast-check)

**Key Test Suites:**
- Sales: `AddSalesTransactionForm.test.tsx`, `SalesTransactionList.test.tsx`, `SalesPage.test.tsx`, `salesApi.test.ts`
- Debt: `TransactionForm.test.tsx`, `DebtDisplay.test.tsx`, `TransactionHistory.test.tsx`, `EditTransactionDialog.test.tsx`
- Leave: `LeaveCalendar.test.tsx`, `LeaveCalendar.pbt.test.tsx`
- Components: `EntitySelector.test.tsx`, `ItemFilter.test.tsx`, `ItemBreakdownTable.test.tsx`

### Backend Tests

**Unit Tests:**
```bash
cd backend
npm test
```

**Watch Mode:**
```bash
npm run test:watch
```

**Test Files:**
- `*.test.ts`: Business logic and API tests
- `*.pbt.test.ts`: Property-based tests (fast-check)

**Key Test Suites:**
- Business Logic: `debtCalculations.test.ts`, `salesCalculations.test.ts`, `calculations.test.ts`
- Repositories: `TransactionRepository.test.ts`
- Routes: `salesTransactions.test.ts`, `salesTransactions.pbt.test.ts`
- Debt Tracker: `DebtCalculator.test.ts`, `TransactionValidator.test.ts`, `formatters.test.ts`

### Testing Tools

- **Vitest**: Test runner for both frontend and backend
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing (100+ iterations per property)
- **Supertest**: API endpoint testing
- **jsdom**: DOM simulation for frontend tests

### Property-Based Testing

The application uses property-based testing with fast-check to verify correctness properties:
- Each property test runs minimum 100 iterations
- Tests tagged with format: `// Feature: {feature}, Property {number}: {description}`
- Validates universal properties across all valid inputs
- Complements unit tests for comprehensive coverage

## Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Output: dist/
# Includes service worker and PWA manifest
```

**Backend:**
```bash
cd backend
npm run build
# Output: dist/
```

### Environment Variables

**Production Backend (.env):**
```env
PORT=3001
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=company_tracker
DB_USER=postgres
DB_PASSWORD=<secret>
DB_TIMEZONE=Australia/Melbourne
SESSION_SECRET=<strong-random-secret-change-this>
NODE_ENV=production
FRONTEND_ORIGINS=https://your-frontend-origin
COOKIE_SECURE=false
```
(Set `COOKIE_SECURE=true` when the API is only reached over HTTPS.)

**Production Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Database Setup

1. Create PostgreSQL database
2. Run schema setup:
```bash
cd backend
npm run setup-db
# Or manually run: backend/src/config/schema.sql
```

3. Optional — extra seed scripts (only if needed): run `npx tsx src/scripts/initUsers.ts` from `backend/` (default users are already created by `setup-db`).

### Deployment Options

1. **Traditional Server (VPS)**:
   - Deploy backend with PM2 or systemd
   - Serve frontend with Nginx
   - Use PostgreSQL on same or separate server

2. **Docker**:
   - Create Dockerfile for backend and frontend
   - Use Docker Compose for multi-container setup
   - Include PostgreSQL container

3. **Cloud Platforms**:
   - Frontend: Vercel, Netlify, or AWS S3 + CloudFront
   - Backend: AWS EC2, DigitalOcean, or Heroku
   - Database: AWS RDS, DigitalOcean Managed PostgreSQL

4. **Serverless**:
   - Frontend: Vercel or Netlify
   - Backend: AWS Lambda with API Gateway
   - Database: AWS RDS or Supabase

### PWA Deployment Notes

- HTTPS required for PWA features (except localhost)
- Service worker only works in production builds
- Generate PWA icons before deployment (see PWA_SETUP.md)
- Test install prompt on actual mobile devices
- Verify service worker registration in production

### Post-Deployment Checklist

- [ ] Database schema created and initialized
- [ ] Environment variables configured
- [ ] Default users created (Leva, Danik)
- [ ] HTTPS enabled (for PWA)
- [ ] PWA icons generated and deployed
- [ ] Service worker registered successfully
- [ ] Session secret changed from default
- [ ] Database backups configured
- [ ] Health check endpoint responding
- [ ] CORS configured for production domain

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

## Progressive Web App

### Installation
- Install prompt appears automatically on supported devices
- Custom install button available in app interface
- Works on iOS (Safari), Android (Chrome), and desktop browsers
- App icon and splash screen customization
- Standalone mode for app-like experience

### Offline Support
- Service worker caches static assets (HTML, CSS, JS, fonts)
- Network-first strategy for API calls with 5-minute cache fallback
- Offline page displayed when network unavailable
- Background sync for pending operations (future enhancement)

### Updates
- Automatic update detection when new version deployed
- User-friendly update prompt with "Update Now" button
- Seamless update installation without data loss
- Service worker updates in background

### Notifications
- Browser push notifications for birthdays
- Configurable notification preferences in Settings
- Permission management with browser API
- Daily birthday reminders when app is open
- Shows person's name and age in notification

### PWA Configuration

**Manifest (auto-generated by vite-plugin-pwa):**
- App name: "UOMe"
- Theme color: #4caf50 (green)
- Background color: #ffffff
- Display: standalone
- Icons: 192x192, 512x512, apple-touch-icon (180x180)

**Service Worker:**
- Auto-generated by vite-plugin-pwa
- Workbox-based caching strategies
- Network-first for API calls
- Cache-first for static assets
- Font caching for 1 year

**Caching Strategies:**
- Static assets (JS, CSS, HTML): Precached
- API calls: NetworkFirst with 5-minute cache
- Fonts: CacheFirst with 1-year expiry
- Images: CacheFirst with 30-day expiry

### Testing PWA

1. Build production version: `npm run build`
2. Preview: `npm run preview`
3. Open Chrome DevTools > Application > Manifest
4. Test service worker in Application > Service Workers
5. Try installing via browser's install prompt
6. Test offline by disabling network in DevTools

### PWA Icons

Generate icons before deployment:
1. Use `frontend/public/pwa-icon-generator.html`
2. Or convert `frontend/public/icon.svg` to PNG at required sizes
3. Required sizes: 192x192, 512x512, 180x180 (apple-touch-icon)

See `frontend/PWA_SETUP.md` for detailed instructions.

## Support

For issues and questions:
- Review documentation in README files
- Check spec files in `.kiro/specs/` for detailed requirements
- Examine test files for usage examples
- Review API endpoints in backend route files

## Key Documentation Files

- `APPLICATION_OVERVIEW_README.md` - This file, complete system overview
- `SALES_TRACKER_README.md` - Sales tracking feature documentation
- `DEBT_TRACKER_README.md` - Debt tracking feature documentation
- `LEAVE_TRACKER_README.md` - Leave management feature documentation
- `SETTINGS_README.md` - Settings and configuration documentation
- `frontend/PWA_SETUP.md` - PWA setup and icon generation instructions
- `.kiro/specs/` - Detailed requirements, design, and tasks for each feature
