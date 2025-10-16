# Advanced Asset Management Features

## Overview
This document outlines the comprehensive asset management features that have been implemented in the ICT Inventory system.

## Features Implemented

### 1. Asset Tag System
- **Physical Label/Sticker Number**: Unique identifier for quick physical identification
- **Location**: Added to `asset_serial_numbers` table
- **Usage**: Each individual asset unit can have a physical tag for easy scanning and identification

### 2. Quantity Tracking
**IMPORTANT**: Availability is tracked at the serial number level, not the asset level.

- **Total Quantity**: Maximum number of units for this asset type (set manually)
- **Available**: Automatically calculated from serial numbers with status='available'
- **In Use**: Automatically calculated from serial numbers with status='in_use'
- **Maintenance**: Automatically calculated from serial numbers with status='maintenance'
- **Retired**: Automatically calculated from serial numbers with status='retired'
- **Disposed**: Automatically calculated from serial numbers with status='disposed'

Each individual asset unit (serial number) has its own status, and the asset-level quantities are dynamically calculated from these statuses.

### 3. Min/Max Quantity Alerts
- **Minimum Quantity**: Triggers low stock alert when available quantity falls below threshold
- **Maximum Quantity**: Triggers overstock alert when total quantity exceeds threshold
- **Visual Indicators**: Alert badges and warning icons in the asset list

### 4. Financial Tracking
- **Purchase Price**: Original acquisition cost
- **Current Value**: Present market/book value
- **Depreciation Rate**: Annual percentage depreciation
- **Purchase Date**: Date of acquisition
- **Auto-calculation**: Helper method `calculateDepreciatedValue()` in Asset model

### 5. Lifecycle Management
- **Expected Lifespan**: Duration in months
- **Retirement Date**: Planned end-of-life date
- **Warranty Expiry Date**: Warranty coverage end date
- **Alerts**: Visual indicators for approaching retirement and expired warranties

### 6. Compliance Fields
- **License Requirements**:
  - Boolean flag for license requirement
  - License details text field
- **Calibration Tracking**:
  - Requires calibration flag
  - Last calibration date
  - Next calibration date
  - Calibration interval (months)
  - Due date alerts

### 7. Multiple Identifiers
For each serial number/asset unit:
- **Serial Number**: Primary identifier
- **Asset Tag**: Physical label number
- **Barcode**: Barcode identifier for scanning
- **QR Code**: QR code identifier for mobile scanning

### 8. Enhanced Serial Number Tracking
- **Status**: available, in_use, maintenance, retired, disposed
- **Maintenance Dates**: Last and next maintenance dates
- **Condition**: new, good, fair, poor
- **Assignment**: Track who/which department has the asset

## Database Changes

### Migration: `2025_10_14_010400_add_advanced_asset_management_fields.php`

**Assets Table Additions:**
- `min_quantity`, `max_quantity` (nullable integers for alert thresholds)
- `purchase_price`, `current_value` (decimal 12,2)
- `depreciation_rate` (decimal 5,2)
- `purchase_date`, `retirement_date`, `warranty_expiry_date` (dates)
- `expected_lifespan_months`, `calibration_interval_months` (integers)
- `requires_license`, `requires_calibration` (booleans)
- `license_details` (text)
- `last_calibration_date`, `next_calibration_date` (dates)

**Asset Serial Numbers Table Additions:**
- `asset_tag`, `barcode`, `qr_code` (unique strings)
- `status` (enum: available, in_use, maintenance, retired, disposed)
- `last_maintenance_date`, `next_maintenance_date` (dates)

## Model Enhancements

### Asset Model Helper Methods

```php
// Quantity calculations (from serial number statuses)
getQuantityAvailableAttribute(): int    // Count of 'available' serial numbers
getQuantityInUseAttribute(): int        // Count of 'in_use' serial numbers
getQuantityMaintenanceAttribute(): int  // Count of 'maintenance' serial numbers
getQuantityRetiredAttribute(): int      // Count of 'retired' serial numbers
getQuantityDisposedAttribute(): int     // Count of 'disposed' serial numbers

// Alert checks
isLowStock(): bool                      // Check if below minimum threshold
isOverStock(): bool                     // Check if above maximum threshold
calculateDepreciatedValue()             // Calculate current depreciated value
isUnderWarranty(): bool                 // Check warranty validity
isCalibrationDue(): bool                // Check if calibration is due
isNearingRetirement(): bool             // Alert if within 3 months of retirement
```

**Note**: Quantity attributes are computed properties, not database fields. They are calculated in real-time from the status of associated serial numbers.

## Frontend Changes

### Tabbed Asset Form
The asset creation/edit form is now organized into 4 tabs:

1. **Basic Info**: Name, category, status, description
2. **Quantity**: Total quantity limit, min/max alert thresholds (availability is auto-calculated from serial numbers)
3. **Financial**: Purchase price, current value, depreciation, lifecycle dates
4. **Compliance**: License requirements, calibration tracking

### Enhanced Asset Table
- **Quantity Breakdown**: Shows total with available/in-use/maintenance details
- **Alert Column**: Visual badges for:
  - Low Stock (red)
  - Overstock (gray)
  - Warranty Expired (outline)
  - Calibration Due (red)
- **Warning Icons**: Alert triangle for assets with issues

### Serial Number Management
- **Comprehensive Form**: All identifier fields (S/N, tag, barcode, QR)
- **Status Tracking**: Visual status badges
- **Maintenance Dates**: Track service history
- **Enhanced Display**: Grid layout showing all asset details

## Usage Instructions

### To Run the Migration:
```bash
php artisan migrate
```

### Creating an Asset with Full Tracking:
1. Fill in basic information (name, category)
2. Set quantity thresholds for alerts
3. Add financial data for depreciation tracking
4. Configure compliance requirements
5. Add individual serial numbers with tags/barcodes

### Monitoring Alerts:
- Check the "Alerts" column in the asset list
- Low stock items show red "Low Stock" badge
- Calibration due items show red "Calibration Due" badge
- Warning triangle icon appears next to asset names with issues

## Benefits

1. **Improved Tracking**: Granular visibility into asset status and location
2. **Proactive Management**: Automated alerts for reordering and maintenance
3. **Financial Oversight**: Track depreciation and asset value over time
4. **Compliance**: Ensure licensed and calibrated equipment stays current
5. **Quick Identification**: Multiple scanning options (barcode, QR, asset tag)
6. **Lifecycle Planning**: Plan for asset retirement and replacement

## Next Steps (Optional Enhancements)

1. **Barcode/QR Code Generation**: Auto-generate codes for new assets
2. **Depreciation Reports**: Dashboard showing total asset value trends
3. **Maintenance Scheduling**: Automated reminders for calibration/maintenance
4. **Low Stock Notifications**: Email alerts when stock falls below minimum
5. **Asset History**: Track all movements and status changes
6. **Bulk Import**: CSV import for asset tags and identifiers
