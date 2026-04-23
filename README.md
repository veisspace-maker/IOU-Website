# IOU

Internal web application for tracking money transactions and employee leave.

## Project Structure

```
company-tracker/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── config/   # Database and configuration
│   │   └── index.ts  # Server entry point
│   └── package.json
├── frontend/         # React application
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── package.json      # Root workspace configuration
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend workspaces.

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb company_tracker
```

Set up the database schema:

```bash
psql -d company_tracker -f backend/src/config/schema.sql
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your database credentials and desired timezone.

### 4. Initialize User Passwords

The schema creates three users with placeholder passwords. You'll need to update these with proper bcrypt hashes. You can use the backend application to generate hashes or use a script.

## Development

Start both frontend and backend in development mode with hot reload:

```bash
npm run dev
```

Or start them separately:

```bash
# Backend (runs on port 3001)
npm run dev:backend

# Frontend (runs on port 5173)
npm run dev:frontend
```

## Testing

Run tests for both workspaces:

```bash
npm test
```

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI)
- Redux Toolkit
- React Router
- Vite

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL with pg driver
- Passport.js for authentication
- bcrypt for password hashing

**Testing:**
- Vitest for unit tests
- fast-check for property-based testing

## Database Schema

The application uses the following tables:
- `users` - User authentication and profiles
- `transactions` - Money transfers between users
- `leave_records` - Employee leave tracking
- `public_holidays` - National holidays
- `closed_dates` - Company closure periods
- `birthdays` - Employee birthdays

All tables use UUID primary keys and include `created_at` and `updated_at` timestamps with automatic triggers.

## Timezone Configuration

The application uses a single consistent timezone (configurable via `DB_TIMEZONE` environment variable) for all date operations to ensure consistency across the system.
