# Next Steps to Run the ICT Inventory System

## Quick Start

### 1. Install Node Dependencies
The TypeScript errors you're seeing are because npm packages aren't installed yet.

```bash
npm install
```

This will install all the React, TypeScript, and UI library dependencies defined in `package.json`.

### 2. Run Database Migrations

```bash
php artisan migrate
```

This creates all 9 database tables:
- users
- departments
- categories
- assets
- asset_serial_numbers
- computers
- borrowings
- asset_histories
- audit_logs

### 3. Create a Test User

Option A - Using Tinker:
```bash
php artisan tinker
```
Then:
```php
\App\Models\User::create([
    'name' => 'Admin User',
    'email' => 'admin@test.com',
    'password' => bcrypt('password123')
]);
```

Option B - Using the API (after starting servers):
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### 4. Start Development Servers

**Terminal 1 - Laravel API:**
```bash
php artisan serve
```

**Terminal 2 - Vite (React):**
```bash
npm run dev
```

### 5. Access the Application

Open your browser to: **http://localhost:8000**

Login with:
- Email: `admin@test.com`
- Password: `password123`

## What's Been Built

### Backend (Laravel API)
✅ 8 Migrations for all database tables
✅ 8 Models with relationships (User, Category, Department, Asset, AssetSerialNumber, Computer, Borrowing, AssetHistory, AuditLog)
✅ 7 API Controllers with full CRUD operations
✅ 7 API Resources for data transformation
✅ Laravel Sanctum authentication configured
✅ API routes configured at `/api/*`
✅ CORS configured for frontend access

### Frontend (React + ShadCN UI)
✅ React Router setup with protected routes
✅ Auth context with login/logout functionality
✅ API client with Axios and token management
✅ 9 Pages:
  - Login
  - Dashboard (with statistics)
  - Categories
  - Departments
  - Assets
  - Asset Serial Numbers
  - Computers
  - Borrowings
  - Users
✅ Layout with sidebar navigation
✅ ShadCN UI components (Table, Dialog, Input, Button, etc.)
✅ TanStack Query for data fetching
✅ Search and pagination support
✅ Toast notifications

## Testing the Features

### 1. Categories
- Go to Categories page
- Click "Add Category"
- Create categories like: Laptop, Monitor, Keyboard, Mouse, Printer

### 2. Assets
- Go to Assets page
- Create assets and assign them to categories
- Set status: available, borrowed, repair, disposed

### 3. Asset Serial Numbers
- Go to Serial Numbers page
- Add serial numbers for each asset
- Assign to users or departments

### 4. Computers
- Go to Computers page
- Add computer hardware details
- Track hostname, specs, IP, MAC address

### 5. Borrowings
- Go to Borrowings page
- Create a borrowing record
- Select user and either an asset serial or computer
- Set borrow and expected return dates
- Use the return button to mark items as returned

### 6. Users
- Go to Users page
- Create additional users
- Users can login and borrow items

## API Testing with Postman/Insomnia

### Login
```
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}
```

Response will include a `token`. Use it in subsequent requests:
```
Authorization: Bearer {your-token-here}
```

### Get Categories
```
GET http://localhost:8000/api/categories
Authorization: Bearer {token}
```

### Create Asset
```
POST http://localhost:8000/api/assets
Authorization: Bearer {token}
Content-Type: application/json

{
  "category_id": 1,
  "name": "Dell Laptop",
  "description": "Dell Latitude 5420",
  "status": "available"
}
```

### Hardware Discovery Endpoint
```
POST http://localhost:8000/api/inventory/computers
Authorization: Bearer {token}
Content-Type: application/json

{
  "hostname": "DESKTOP-ABC123",
  "manufacturer": "Dell",
  "model": "OptiPlex 7090",
  "serial_number": "SN123456",
  "os_name": "Windows 11",
  "os_version": "22H2",
  "cpu_name": "Intel Core i7-11700",
  "cpu_cores_physical": 8,
  "cpu_cores_logical": 16,
  "cpu_speed_mhz": 2500,
  "ram_gb": 16,
  "storage": [
    {"type": "SSD", "size_gb": 512, "model": "Samsung 980 Pro"}
  ],
  "gpu": "Intel UHD Graphics 750",
  "ip_address": "192.168.1.100",
  "mac_address": "00:1A:2B:3C:4D:5E",
  "discovered_via": "PowerShell Script",
  "last_seen": "2025-01-13T10:00:00Z"
}
```

## Troubleshooting

### TypeScript Errors
Run `npm install` - all the "Cannot find module" errors will disappear.

### Database Connection Error
Check your `.env` file and ensure database credentials are correct.

### CORS Errors
The CORS config is already set up in `config/cors.php` to allow all origins for development.

### 404 on API Routes
Make sure `routes/api.php` is loaded in `bootstrap/app.php` (already configured).

### React Router Not Working
The catch-all route in `routes/web.php` serves the React SPA for all routes.

## Production Deployment

1. Set `APP_ENV=production` in `.env`
2. Run `npm run build`
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`
5. Configure your web server (Apache/Nginx) to point to `/public`
6. Set up proper CORS origins in `config/cors.php`
7. Use a proper database (MySQL/PostgreSQL)
8. Set up SSL certificate
9. Configure proper session and cache drivers

## File Structure

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   ├── DepartmentController.php
│   │   ├── AssetController.php
│   │   ├── AssetSerialNumberController.php
│   │   ├── ComputerController.php
│   │   ├── BorrowingController.php
│   │   └── UserController.php
│   └── Resources/
│       ├── CategoryResource.php
│       ├── DepartmentResource.php
│       ├── AssetResource.php
│       ├── AssetSerialNumberResource.php
│       ├── ComputerResource.php
│       ├── BorrowingResource.php
│       └── UserResource.php
├── Models/
│   ├── User.php
│   ├── Category.php
│   ├── Department.php
│   ├── Asset.php
│   ├── AssetSerialNumber.php
│   ├── Computer.php
│   ├── Borrowing.php
│   ├── AssetHistory.php
│   └── AuditLog.php

database/migrations/
├── 2025_01_01_000001_create_departments_table.php
├── 2025_01_01_000002_create_categories_table.php
├── 2025_01_01_000003_create_assets_table.php
├── 2025_01_01_000004_create_asset_serial_numbers_table.php
├── 2025_01_01_000005_create_computers_table.php
├── 2025_01_01_000006_create_borrowings_table.php
├── 2025_01_01_000007_create_asset_histories_table.php
└── 2025_01_01_000008_create_audit_logs_table.php

resources/js/
├── App.tsx (Main React app with routing)
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts (Axios client)
│   └── utils.ts
├── components/
│   ├── Layout.tsx
│   └── ui/ (ShadCN components)
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── Categories.tsx
    ├── Departments.tsx
    ├── Assets.tsx
    ├── AssetSerialNumbers.tsx
    ├── Computers.tsx
    ├── Borrowings.tsx
    └── Users.tsx

routes/
├── api.php (All API endpoints)
└── web.php (SPA catch-all route)
```

## Support

For issues or questions, refer to:
- Laravel Documentation: https://laravel.com/docs
- React Documentation: https://react.dev
- ShadCN UI: https://ui.shadcn.com
- TanStack Query: https://tanstack.com/query
