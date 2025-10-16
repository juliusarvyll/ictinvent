# Setup Instructions for Advanced Asset Management

## Quick Start

### 1. Run the Database Migration

Execute the migration to add all new fields to your database:

```bash
php artisan migrate
```

This will add the following to your database:
- **Assets table**: 20+ new fields for tracking, financial data, and compliance
- **Asset Serial Numbers table**: Asset tags, barcodes, QR codes, status, and maintenance dates

### 2. Verify the Changes

After migration, you should see:
- ✅ New columns in `assets` table
- ✅ New columns in `asset_serial_numbers` table
- ✅ All existing data preserved

### 3. Test the Features

1. **Navigate to the Assets page** in your application
2. **Click "Add Asset"** - you'll see the new tabbed form with 4 sections:
   - Basic Info
   - Quantity Tracking
   - Financial & Lifecycle
   - Compliance

3. **Create a test asset** with:
   - Name: "Test Laptop"
   - Category: Select any
   - Total Quantity: 10
   - Available: 8
   - In Use: 2
   - Min Quantity: 3 (to test low stock alerts)
   - Purchase Price: 1000
   - Depreciation Rate: 20

4. **Add serial numbers** with asset tags and barcodes

## What's New

### Enhanced Asset Form
- **Tabbed Interface**: Organized into logical sections
- **Quantity Breakdown**: Track available, in-use, and maintenance quantities
- **Alert Thresholds**: Set min/max quantities for automatic alerts
- **Financial Tracking**: Purchase price, current value, depreciation
- **Lifecycle Dates**: Purchase, retirement, warranty expiry
- **Compliance Flags**: License and calibration requirements

### Smart Alerts
The system now shows visual alerts for:
- 🔴 **Low Stock**: When available quantity ≤ minimum threshold
- ⚪ **Overstock**: When total quantity ≥ maximum threshold
- ⚠️ **Warranty Expired**: When warranty expiry date has passed
- 🔴 **Calibration Due**: When next calibration date is reached

### Serial Number Enhancements
Each asset unit can now have:
- **Asset Tag**: Physical sticker/label number
- **Barcode**: For barcode scanner integration
- **QR Code**: For mobile scanning
- **Status**: Track lifecycle (available → in_use → maintenance → retired)
- **Maintenance Dates**: Schedule and track servicing

## API Changes

All API endpoints remain the same, but now accept additional fields:

### POST/PUT `/api/assets`
New optional fields:
```json
{
  "min_quantity": 3,
  "max_quantity": 50,
  "purchase_price": 1500.00,
  "current_value": 1200.00,
  "depreciation_rate": 15.5,
  "purchase_date": "2024-01-15",
  "expected_lifespan_months": 36,
  "retirement_date": "2027-01-15",
  "warranty_expiry_date": "2025-01-15",
  "requires_license": true,
  "license_details": "Microsoft Office 365 E3",
  "requires_calibration": false,
  "last_calibration_date": null,
  "next_calibration_date": null,
  "calibration_interval_months": null
}
```

### POST/PUT `/api/asset-serial-numbers`
New optional fields:
```json
{
  "asset_tag": "TAG-001",
  "barcode": "BAR123456789",
  "qr_code": "QR-ABC-123",
  "status": "available",
  "last_maintenance_date": "2024-10-01",
  "next_maintenance_date": "2025-04-01"
}
```

## Model Helper Methods

The Asset model now includes utility methods:

```php
$asset->isLowStock();              // Returns true if below min threshold
$asset->isOverStock();             // Returns true if above max threshold
$asset->calculateDepreciatedValue(); // Auto-calculate depreciated value
$asset->isUnderWarranty();         // Check warranty status
$asset->isCalibrationDue();        // Check if calibration needed
$asset->isNearingRetirement();     // Alert if retiring within 3 months
```

## Backward Compatibility

✅ **All existing functionality preserved**
✅ **All new fields are optional (nullable)**
✅ **Existing assets will work without modification**
✅ **No breaking changes to API**

## Troubleshooting

### Migration Issues

If migration fails:
```bash
# Check migration status
php artisan migrate:status

# Rollback if needed
php artisan migrate:rollback

# Re-run migration
php artisan migrate
```

### Frontend Not Showing New Fields

1. Clear browser cache
2. Rebuild frontend assets:
```bash
npm run build
# or for development
npm run dev
```

### Validation Errors

All new fields are optional. If you get validation errors:
- Check that boolean fields are sent as `true`/`false` (not strings)
- Ensure date fields use format: `YYYY-MM-DD`
- Verify numeric fields don't contain non-numeric characters

## Next Steps

Consider implementing:
1. **Automated Alerts**: Email notifications for low stock
2. **Barcode Scanner Integration**: Use mobile devices to scan asset tags
3. **Depreciation Reports**: Generate financial reports
4. **Maintenance Calendar**: Schedule view for calibrations
5. **QR Code Generation**: Auto-generate QR codes for new assets

## Support

For questions or issues, refer to:
- `ASSET_MANAGEMENT_FEATURES.md` - Complete feature documentation
- Laravel logs: `storage/logs/laravel.log`
- Browser console for frontend errors
