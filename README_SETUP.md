# ICT Inventory System - Setup Guide

## Overview
A production-ready ICT Inventory System built with Laravel API backend and React + ShadCN UI frontend.

## Features
- **Authentication**: Laravel Sanctum token-based auth
- **9 Core Modules**:
  1. Users - Basic user management
  2. Categories - Asset classification
  3. Assets - Generic asset types with status tracking
  4. AssetSerialNumbers - Individual units with manual serial entry
  5. Computers - Dedicated hardware tracking with full specs
  6. Borrowing - Track borrowing of assets or computers
  7. Departments - Organizational units
  8. AssetHistory - Audit trail for all actions
  9. AuditLogs - System-wide change tracking

## Installation

### 1. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy .env.example if needed
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ictinvent
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Run Migrations

```bash
php artisan migrate
```

### 4. Create First User (Optional)

```bash
php artisan tinker
```

Then in tinker:
```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password')
]);
```

### 5. Start Development Servers

```bash
# Terminal 1: Laravel API
php artisan serve

# Terminal 2: Vite dev server
npm run dev
```

The application will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout (requires auth)
- `GET /api/me` - Get current user (requires auth)

### Protected Endpoints (require Bearer token)
- `/api/categories` - CRUD for categories
- `/api/departments` - CRUD for departments
- `/api/assets` - CRUD for assets
- `/api/asset-serial-numbers` - CRUD for serial numbers
- `/api/computers` - CRUD for computers
- `/api/inventory/computers` - Special endpoint for hardware discovery
- `/api/borrowings` - CRUD for borrowings
- `/api/borrowings/{id}/return` - Return borrowed item
- `/api/users` - CRUD for users

## Frontend Pages
- `/login` - Login page
- `/` - Dashboard with statistics
- `/categories` - Manage categories
- `/assets` - Manage assets
- `/serial-numbers` - Manage asset serial numbers
- `/computers` - Manage computers
- `/borrowings` - Manage borrowings
- `/users` - Manage users
- `/departments` - Manage departments

## Technology Stack

### Backend
- Laravel 12
- Laravel Sanctum for API authentication
- MySQL database
- API Resources for data transformation
- Form Request validation

### Frontend
- React 19
- React Router for routing
- TanStack Query for data fetching
- ShadCN UI components
- Tailwind CSS for styling
- Axios for HTTP requests
- Sonner for toast notifications
- React Hook Form + Zod for form validation

## Database Schema

### Users
- id, name, email, password

### Categories
- id, name, description

### Assets
- id, category_id, name, description, status (available, borrowed, repair, disposed)

### AssetSerialNumbers
- id, asset_id, serial_number, condition, assigned_to, notes

### Computers
- id, hostname, manufacturer, model, serial_number
- os_name, os_version, os_build
- cpu_name, cpu_cores_physical, cpu_cores_logical, cpu_speed_mhz
- ram_gb, storage (JSON), gpu
- ip_address, mac_address
- discovered_via, last_seen, notes

### Borrowings
- id, user_id, asset_serial_id, computer_id
- borrow_date, expected_return_date, return_date
- status (borrowed, returned, lost), remarks

### Departments
- id, name, description

### AssetHistories
- id, asset_serial_id, computer_id
- action_type (created, updated, borrowed, returned, repaired, disposed)
- note, created_at

### AuditLogs
- id, user_id, action, module, old_values, new_values, created_at

## Production Build

```bash
# Build frontend assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Notes
- No roles/permissions system (basic auth only as requested)
- Asset serial numbers are manually entered
- Computers can be tracked separately from generic assets
- Borrowing supports both asset serials and computers
- All CRUD operations include search and pagination
- Frontend uses ShadCN UI components for modern, accessible interface
