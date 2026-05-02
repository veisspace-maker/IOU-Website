# Settings

Comprehensive application settings management including user accounts, authentication, and calendar configurations.

## Overview

The Settings module provides centralized management for user accounts, security settings, public holidays, company closed dates, and employee birthdays. All settings are accessible through a tabbed interface for easy navigation.

## Features

### Account Management
- Username and password updates
- Two-factor authentication (2FA) setup
- PIN authentication option
- Session management
- Profile information

### Calendar Settings
- Public holidays management with bulk import
- Company closed dates tracking
- Birthday tracking with notifications
- Calendar color customization

### Sales Settings
- Sales items management
- Predefined item list for quick selection
- Item name editing and deletion

### Security Features
- Password strength validation
- Two-factor authentication (TOTP)
- Secure session handling
- Remember me functionality

## User Interface

### Settings Page Tabs
1. **Account**: User profile and security settings
2. **Public Holidays**: National and regional holidays with bulk import
3. **Closed Dates**: Company closure periods
4. **Birthdays**: Employee birthday tracking
5. **Notifications**: Birthday notification preferences
6. **Sales Items**: Manage predefined sales items

## Account Settings

### Features
- Change username
- Update password with strength validation
- Set up two-factor authentication
- Enable/disable 2FA
- Configure PIN for quick login
- View account creation date

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Two-Factor Authentication (2FA)
- TOTP-based (Time-based One-Time Password)
- Compatible with Google Authenticator, Authy, etc.
- QR code for easy setup
- Backup codes provided
- Can be disabled at any time

### PIN Authentication
- 4-6 digit PIN for quick access
- Optional alternative to password
- Stored securely (hashed)
- Can be changed or removed

## Public Holidays Management

### Features
- Add new public holidays manually
- Bulk import holidays from external API
- Edit existing holidays
- Delete holidays
- View all holidays in chronological order
- Automatic integration with leave calculations
- Import by country and year

### Holiday Import
- Import holidays from Nager.Date API
- Select country from dropdown list
- Choose year for import
- Automatic duplicate detection
- Filters out non-public holidays (observances)
- Batch import with status reporting

### Holiday Data Model
```typescript
PublicHoliday {
  id: string              // UUID
  name: string            // Holiday name (e.g., "Christmas Day")
  date: Date              // Holiday date
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

#### GET /api/holidays
List all public holidays.

**Response:**
```json
{
  "holidays": [
    {
      "id": "uuid",
      "name": "Christmas Day",
      "date": "2026-12-25",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/holidays
Create a new public holiday.

**Request Body:**
```json
{
  "name": "Christmas Day",
  "date": "2026-12-25"
}
```

#### PUT /api/holidays/:id
Update a public holiday.

#### DELETE /api/holidays/:id
Delete a public holiday.

#### POST /api/holiday-import/import
Bulk import holidays from external API.

**Request Body:**
```json
{
  "year": 2026,
  "countryCode": "AU"
}
```

**Response:**
```json
{
  "message": "Holiday import completed",
  "inserted": 10,
  "skipped": 2,
  "insertedHolidays": [ /* array of inserted holidays */ ],
  "skippedHolidays": [ /* array with skip reasons */ ]
}
```

#### GET /api/holiday-import/countries
Get list of available countries for import.

**Response:**
```json
{
  "countries": [
    {
      "countryCode": "AU",
      "name": "Australia"
    }
  ]
}
```

## Closed Dates Management

### Features
- Add company closure periods
- Support for date ranges
- Optional notes for context
- Edit and delete closures
- Automatic integration with leave calculations

### Closed Date Data Model
```typescript
ClosedDate {
  id: string              // UUID
  startDate: Date         // First day of closure
  endDate: Date           // Last day of closure
  note?: string           // Optional note (e.g., "Christmas shutdown")
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

#### GET /api/closed-dates
List all closed date periods.

**Response:**
```json
{
  "closedDates": [
    {
      "id": "uuid",
      "startDate": "2026-12-24",
      "endDate": "2027-01-02",
      "note": "Christmas and New Year shutdown",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/closed-dates
Create a new closed date period.

**Request Body:**
```json
{
  "startDate": "2026-12-24",
  "endDate": "2027-01-02",
  "note": "Christmas and New Year shutdown"
}
```

#### PUT /api/closed-dates/:id
Update a closed date period.

#### DELETE /api/closed-dates/:id
Delete a closed date period.

### Common Use Cases
- Annual Christmas shutdown
- Company-wide training days
- Office renovation periods
- Emergency closures

## Birthdays Management

### Features
- Add employee birthdays
- Edit birthday information
- Delete birthday records
- View upcoming birthdays
- Age calculation (automatic)
- Birthday banner on home page
- Configurable birthday notifications

### Birthday Data Model
```typescript
Birthday {
  id: string              // UUID
  name: string            // Employee name
  dateOfBirth: Date       // Birth date (year included)
  createdAt: Date
  updatedAt: Date
}
```

### Birthday Notifications

The application supports browser notifications for birthdays:

- **Enable/Disable**: Toggle notifications in Settings → Notifications
- **Permission**: Browser will request notification permission when enabled
- **Timing**: Notifications appear on the actual birthday
- **Frequency**: Once per day per birthday
- **Persistence**: Preference stored in browser localStorage

**Notification Settings:**
- Managed in Settings → Notifications tab
- Requires browser notification permission
- Works when application is open in browser
- Shows person's name and age

### API Endpoints

#### GET /api/birthdays
List all birthdays.

**Response:**
```json
{
  "birthdays": [
    {
      "id": "uuid",
      "name": "John Doe",
      "dateOfBirth": "1990-05-15",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/birthdays
Create a new birthday record.

**Request Body:**
```json
{
  "name": "John Doe",
  "dateOfBirth": "1990-05-15"
}
```

#### PUT /api/birthdays/:id
Update a birthday record.

#### DELETE /api/birthdays/:id
Delete a birthday record.

### Birthday Features
- Automatic age calculation
- Upcoming birthday notifications
- Birthday banner on home page (shows on actual birthday)
- Sorted by upcoming birthdays

## Sales Items Management

### Features
- Add predefined sales items
- Edit item names
- Delete unused items
- Alphabetically sorted display
- Duplicate prevention
- Quick selection in sales transactions

### Sales Item Data Model
```typescript
SalesItem {
  id: string              // UUID
  name: string            // Item name (unique)
  createdAt: Date
  updatedAt: Date
}
```

### API Endpoints

#### GET /api/sales-items
List all sales items.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Coffee",
      "createdAt": "2026-04-23T10:00:00Z",
      "updatedAt": "2026-04-23T10:00:00Z"
    }
  ]
}
```

#### POST /api/sales-items
Create a new sales item.

**Request Body:**
```json
{
  "name": "Coffee"
}
```

**Error Codes:**
- `400`: Item name is required
- `409`: Item with this name already exists

#### PUT /api/sales-items/:id
Update a sales item.

**Request Body:**
```json
{
  "name": "Espresso"
}
```

#### DELETE /api/sales-items/:id
Delete a sales item.

### Common Use Cases
- Add frequently sold items for quick selection
- Standardize item names across transactions
- Reduce typing when creating sales
- Maintain consistent naming conventions

## Authentication System

### Login Methods
1. **Username + Password**: Standard authentication
2. **Username + PIN**: Quick authentication
3. **2FA**: Additional security layer (optional)

### Session Management
- Session-based authentication using express-session
- Configurable session duration
- Remember me option (extends session to 30 days)
- Automatic session cleanup
- Secure cookie settings

### API Endpoints

#### POST /api/auth/login
Authenticate user.

**Request Body:**
```json
{
  "username": "user",
  "password": "password123",
  "rememberMe": true
}
```

Or with PIN:
```json
{
  "username": "user",
  "pin": "1234",
  "rememberMe": false
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "user",
    "twoFactorEnabled": false
  },
  "message": "Login successful"
}
```

If 2FA is enabled:
```json
{
  "requiresTwoFactor": true,
  "message": "Two-factor authentication required"
}
```

#### POST /api/auth/verify-2fa
Verify two-factor authentication code.

**Request Body:**
```json
{
  "token": "123456"
}
```

#### POST /api/auth/logout
Log out current user.

#### GET /api/auth/me
Get current user information.

#### POST /api/auth/2fa/setup
Generate 2FA secret and QR code URL (authenticated).

**Response:**
```json
{
  "secret": "base32-secret",
  "qrCodeUrl": "otpauth://totp/..."
}
```

#### POST /api/auth/2fa/enable
Enable 2FA after verification.

**Request Body:**
```json
{
  "token": "123456"
}
```

#### POST /api/auth/2fa/disable
Disable 2FA (requires account password).

**Request Body:**
```json
{
  "password": "your-password"
}
```

## User Management

### API Endpoints

#### GET /api/users
List all users (authenticated).

#### PUT /api/users/:id
Update user information.

**Request Body:**
```json
{
  "username": "newusername",
  "password": "newpassword123"
}
```

#### User PIN (CLI script)

There is **no** `POST /api/users/:id/set-pin` HTTP endpoint. To set a PIN for login-alternate authentication, run from `backend/`:

```bash
npx tsx src/scripts/setPin.ts
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_secret VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  pin_hash VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE closed_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_closed_date_range CHECK (start_date <= end_date)
);

CREATE TABLE birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## Security Best Practices

### Password Storage
- Passwords hashed using bcrypt
- Salt rounds: 10
- Never stored in plain text
- Secure comparison for validation

### Two-Factor Authentication
- TOTP algorithm (RFC 6238)
- 30-second time window
- 6-digit codes
- Secret stored encrypted
- Compatible with standard authenticator apps

### Session Security
- HTTP-only cookies
- Secure flag in production
- Session secret from environment variable
- Automatic session expiration
- CSRF protection

### PIN Security
- Hashed using bcrypt (same as passwords)
- 4-6 digit requirement
- Rate limiting on attempts
- Optional feature (can be disabled)

## Testing

### Unit Tests
- `AccountSettings.test.tsx`: Account management UI
- `PublicHolidaysManager.test.tsx`: Holiday management with import
- `ClosedDatesManager.test.tsx`: Closed dates management
- `BirthdaysManager.test.tsx`: Birthday management
- `NotificationSettings.test.tsx`: Notification preferences
- `SalesItemsManager.test.tsx`: Sales items management
- `passwordValidation.test.ts`: Password strength validation
- `twoFactor.test.ts`: 2FA functionality (TOTP)

### Integration Tests
- `auth.test.ts`: Authentication endpoints (login, logout, 2FA)
- `users.test.ts`: User management endpoints
- `holidays.test.ts`: Holiday endpoints
- `holidayImport.test.ts`: Holiday bulk import functionality
- `closedDates.test.ts`: Closed dates endpoints
- `birthdays.test.ts`: Birthday endpoints
- `salesItems.test.ts`: Sales items endpoints

## Mobile Responsiveness

- Touch-optimized forms
- Responsive layouts
- Large touch targets
- Mobile-friendly date pickers
- Optimized for 320px+ screens

## Common Use Cases

### Changing Password
1. Navigate to Settings → Account
2. Enter current password
3. Enter new password (must meet requirements)
4. Confirm new password
5. Click "Update Password"

### Setting Up 2FA
1. Navigate to Settings → Account
2. Click "Setup Two-Factor Authentication"
3. Scan QR code with authenticator app
4. Enter verification code
5. Click "Enable 2FA"
6. Save backup codes

### Adding Public Holiday
1. Navigate to Settings → Public Holidays
2. Click "Add Holiday"
3. Enter holiday name
4. Select date
5. Click "Save"

### Adding Closed Date Period
1. Navigate to Settings → Closed Dates
2. Click "Add Closed Date"
3. Select start date
4. Select end date
5. Add optional note
6. Click "Save"

### Adding Birthday
1. Navigate to Settings → Birthdays
2. Click "Add Birthday"
3. Enter employee name
4. Select date of birth
5. Click "Save"

### Configuring Birthday Notifications
1. Navigate to Settings → Notifications
2. Toggle "Enable Birthday Notifications"
3. Grant browser notification permission when prompted
4. Notifications will appear on birthdays when app is open

### Importing Public Holidays
1. Navigate to Settings → Public Holidays
2. Click "Import Holidays" button
3. Select country from dropdown list (e.g., Australia, United States)
4. Enter year for import (e.g., 2026)
5. Click "Import" button
6. Review import results showing:
   - Number of holidays inserted
   - Number of holidays skipped (duplicates)
   - List of inserted holidays with names and dates
   - List of skipped holidays with skip reasons
7. Imported holidays automatically integrate with leave calculations

**Note**: The import uses the Nager.Date API and filters out non-public holidays (observances). Duplicate holidays are automatically detected and skipped.

### Managing Sales Items
1. Navigate to Settings → Sales Items
2. Click "Add Item"
3. Enter item name
4. Click "Add"
5. Edit or delete items as needed

## Future Enhancements

- Role-based access control (admin, manager, employee roles)
- Password reset via email with secure tokens
- Account recovery options (security questions, backup email)
- Audit log for settings changes with timestamps
- Holiday templates by region/state (auto-populate based on location)
- Birthday reminder emails and SMS notifications
- Custom calendar color schemes and themes
- Multi-language support (i18n)
- Dark mode with user preference
- Export/import settings to JSON for backup
- Bulk sales item import from CSV files
- Sales item categories and tags for organization
- Item price history tracking and analytics
- Automated holiday updates from external APIs
- User profile pictures and avatars
- Custom notification schedules (not just birthdays)
- Integration with external calendar systems (Google Calendar, Outlook)
- Advanced password policies (expiry, history, complexity rules)
