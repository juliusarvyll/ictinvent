# Quick Start Guide - ICT Inventory System

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (2 minutes)
```bash
npm install
```

### Step 2: Run Migrations (30 seconds)
```bash
php artisan migrate
```

### Step 3: Create Admin User (30 seconds)
```bash
php artisan tinker
```
Then paste:
```php
\App\Models\User::create(['name' => 'Admin', 'email' => 'admin@test.com', 'password' => bcrypt('password')]);
exit
```

### Step 4: Start Servers (1 minute)

**Terminal 1:**
```bash
php artisan serve
```

**Terminal 2:**
```bash
npm run dev
```

### Step 5: Login
Open browser: **http://localhost:8000**

Login:
- Email: `admin@test.com`
- Password: `password`

## 🎯 Quick Test Flow

1. **Categories** → Add "Laptop", "Monitor", "Mouse"
2. **Assets** → Create "Dell Laptop" (Category: Laptop)
3. **Serial Numbers** → Add serial "SN001" for Dell Laptop
4. **Computers** → Add a computer with hostname "PC-001"
5. **Users** → Create a test user
6. **Borrowings** → Borrow the laptop serial to the test user
7. **Dashboard** → See statistics update

## 📋 Common Commands

### Development
```bash
# Start Laravel
php artisan serve

# Start Vite
npm run dev

# Watch for changes
npm run dev

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Database
```bash
# Run migrations
php artisan migrate

# Rollback
php artisan migrate:rollback

# Fresh migration
php artisan migrate:fresh

# Check migration status
php artisan migrate:status
```

### Production Build
```bash
# Build frontend
npm run build

# Optimize Laravel
php artisan optimize
```

## 🔑 API Testing

### Get Token
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

### Use Token
```bash
curl http://localhost:8000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 Key Files

### Backend
- `routes/api.php` - All API endpoints
- `app/Http/Controllers/Api/` - Controllers
- `app/Models/` - Database models
- `database/migrations/` - Database schema

### Frontend
- `resources/js/App.tsx` - Main app with routing
- `resources/js/pages/` - All pages
- `resources/js/contexts/AuthContext.tsx` - Auth logic
- `resources/js/lib/api.ts` - API client

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Database connection error
Check `.env` file database settings

### Port already in use
```bash
# Use different port
php artisan serve --port=8001
```

### Vite not loading
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

## 📚 Documentation

- Full setup: `README_SETUP.md`
- Detailed steps: `NEXT_STEPS.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`

## ✅ System Check

After starting, verify:
- [ ] Can access http://localhost:8000
- [ ] Can login with admin credentials
- [ ] Can see dashboard with stats
- [ ] Can navigate to all pages
- [ ] Can create a category
- [ ] Can create an asset
- [ ] Can logout

If all checked, you're ready to go! 🎉
