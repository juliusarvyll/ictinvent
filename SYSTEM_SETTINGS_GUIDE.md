# System Settings Management Guide

## Overview
Super Admins can now manage system settings, including the Groq API key, through the API without needing to modify environment files.

## Features
- **Secure Storage**: API keys are automatically encrypted in the database
- **Role-Based Access**: Only Super Admin role can access system settings
- **API Testing**: Built-in endpoint to test Groq API connectivity
- **Fallback Support**: System checks database first, then falls back to .env configuration

## API Endpoints

All endpoints require authentication and Super Admin role.

### 1. Get All Settings
```http
GET /api/system-settings
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "key": "groq_api_key",
    "value": "********",
    "type": "string",
    "description": "Groq API key for barcode scanning and AI features",
    "is_encrypted": true,
    "updated_at": "2025-10-28T00:00:00.000000Z"
  }
]
```

### 2. Get Specific Setting
```http
GET /api/system-settings/{key}
Authorization: Bearer {token}
```

**Example:**
```http
GET /api/system-settings/groq_api_key
```

### 3. Update/Create Setting
```http
PUT /api/system-settings/{key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "value": "your-groq-api-key-here",
  "description": "Groq API key for barcode scanning"
}
```

**Response:**
```json
{
  "message": "Setting updated successfully",
  "setting": {
    "id": 1,
    "key": "groq_api_key",
    "value": "********",
    "type": "string",
    "description": "Groq API key for barcode scanning",
    "is_encrypted": true,
    "updated_at": "2025-10-28T00:00:00.000000Z"
  }
}
```

### 4. Test Groq API Connection
```http
POST /api/system-settings/test-groq
Authorization: Bearer {token}
Content-Type: application/json

{
  "api_key": "your-groq-api-key-to-test"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Groq API connection successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Groq API connection failed",
  "error": "Invalid API key"
}
```

### 5. Delete Setting
```http
DELETE /api/system-settings/{key}
Authorization: Bearer {token}
```

## Setup Instructions

### 1. Run Migration
```bash
php artisan migrate
```

### 2. Seed Initial Settings (Optional)
```bash
php artisan db:seed --class=SystemSettingsSeeder
```

This will migrate any existing `GROQ_API_KEY` from your `.env` file to the database.

### 3. Access as Super Admin
Only users with the "Super Admin" role can access these endpoints. The system uses the Gate::before() rule defined in `AppServiceProvider` to automatically grant Super Admins access to all features.

## How It Works

### Priority Order
1. **Database Settings** - Checked first
2. **Environment Variables** - Fallback if database setting doesn't exist

### Automatic Encryption
The following setting keys are automatically encrypted:
- Any key containing: `api_key`, `secret`, `password`

### Usage in Code
```php
use App\Models\SystemSetting;

// Get a setting
$apiKey = SystemSetting::get('groq_api_key');

// Set a setting
SystemSetting::set('groq_api_key', 'your-key', 'string', true, 'Description');
```

## Security Notes

1. **Encrypted Storage**: Sensitive settings are encrypted using Laravel's encryption
2. **Masked Values**: API responses show `********` for encrypted values
3. **Role Protection**: Only Super Admin role can access these endpoints
4. **Audit Logging**: All setting changes are logged

## Example Usage with cURL

### Update Groq API Key
```bash
curl -X PUT http://localhost:8000/api/system-settings/groq_api_key \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "gsk_your_groq_api_key_here",
    "description": "Groq API key for AI-powered barcode scanning"
  }'
```

### Test Connection
```bash
curl -X POST http://localhost:8000/api/system-settings/test-groq \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "gsk_your_groq_api_key_here"
  }'
```

## Troubleshooting

### Issue: "Groq API key not configured"
**Solution**: Set the API key using the update endpoint or add it to your `.env` file

### Issue: "Unauthorized" when accessing endpoints
**Solution**: Ensure your user has the "Super Admin" role assigned

### Issue: API key not working after update
**Solution**: Use the test endpoint to verify the API key is valid before saving

## Files Modified/Created

### New Files
- `database/migrations/2025_10_28_000000_create_system_settings_table.php`
- `app/Models/SystemSetting.php`
- `app/Http/Controllers/Api/SystemSettingsController.php`
- `database/seeders/SystemSettingsSeeder.php`

### Modified Files
- `routes/api.php` - Added system settings routes
- `app/Http/Controllers/Api/BarcodeScanController.php` - Updated to check database settings
- `database/seeders/DatabaseSeeder.php` - Added SystemSettingsSeeder
