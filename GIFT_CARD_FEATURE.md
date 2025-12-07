# Gift Card & Package Management Enhancement

## Overview

The AI Content Manager now supports **separate gift card and package management** with an intuitive filter interface. This enhancement makes it easy for staff to manage both types of vouchers, particularly useful for seasonal campaigns like the 10% off gift cards promotion.

## What Changed

### 1. **Smart Filter Controls** (New)
- Added a "Show:" filter to the Packages tab with three options:
  - **All**: Display both packages and gift cards
  - **Packages**: Show only service packages (group = 'packages')
  - **Gift Cards**: Show only gift cards (group = 'vouchers' or empty)

### 2. **Enhanced AI Prompts** (Updated)
The giftVouchers prompts now include:
- **"Add package/gift card"**: Creates new packages or gift cards with proper grouping
- **"Update package/card details"**: Modifies any voucher type with discount support
- **"Apply seasonal discount"** (NEW): Bulk applies discounts with savings text (e.g., "10% off through 12/31")

### 3. **Bilingual Support** (Full)
- Filter labels render in English and Thai (ทั้งหมด | แพคเกจ | การ์ดของขวัญ)
- Updates automatically when language preference changes
- Discount prompts include Thai translations

### 4. **Discount Display Support** (Already Existed)
The system ALREADY supports discount rendering:
- `priceLabel`: Original price (struck through)
- `price`: Final discounted price
- `savings`: Discount text ("10% off", "Save $30", etc.)

## How to Use It

### For Staff: Managing Gift Cards

#### Basic Flow
1. Click the **"Packages"** tab
2. Use the filter: **"Show: All | Packages | Gift Cards"**
3. Click on a gift card to edit
4. Ask AI to modify or apply discounts

#### Example: 10% Off Gift Cards Campaign
```
"Apply 10% off to all gift cards valid through December 31st"
```
The AI will:
- Filter to show gift cards only
- Add `savings: "10% off through 12/31"` to each card
- Display the discount in the preview

#### Example: Create a New Gift Card
```
"Add a $100 gift card for spa services"
```
Or for specific gift card type:
```
"Create a $50 gift card and make sure it's marked as a gift card, not a package"
```

### For Developers: Technical Details

#### File Structure
- **Frontend**: `admin/ai-config.html`, `admin/ai-config.js`, `admin/ai-config.css`
- **Constants**: `admin/ai-config-constants.js` (VOUCHER_FILTERS, GUIDED_PROMPTS)
- **Backend**: Uses existing `aiManagementIntent` and preview system (no changes needed)

#### Gift Voucher Data Structure
```json
{
  "id": "gift-card-001",
  "title": "$100 Gift Card",
  "description": "Redeemable for any spa service",
  "group": "vouchers",  // or "packages", "giftCard"
  "price": "$100.00",
  "priceLabel": "$120.00",  // Original before discount
  "savings": "Save $20",  // Or "15% off", "10% off through 12/31"
  "features": [
    { "icon": "✓", "text": "Valid for 12 months" },
    { "icon": "✓", "text": "Transferable to others" }
  ]
}
```

#### Filter Logic (JavaScript)
```javascript
// In filterVouchersByGroup():
if (filterType === 'packages') {
  // Matches: group === 'packages' or group === 'package'
}
if (filterType === 'giftCards') {
  // Matches: group === 'vouchers' || group === 'giftCard' 
  //         || !group || group === ''
}
```

## Key Features

✅ **Compact UI**: Single "Packages" tab with sub-filter (no tab bloat)
✅ **Bilingual**: Filter labels auto-update for EN/TH
✅ **Discount-Ready**: System already renders price/discount/savings fields
✅ **AI-Assisted**: Three guided prompts cover add/update/discount use cases
✅ **Staff-Friendly**: 2-minute learning curve for non-technical users

## Use Case: Seasonal Promotions

### October-December Gift Card Campaign: "10% Off"

**Staff Steps:**
1. Open AI Content Manager → "Packages" tab
2. Click "Show: Gift Cards"
3. Ask AI: "Apply 10% off to all gift cards valid through December 31st"
4. Review the preview (savings field should show "10% off through 12/31")
5. Click "Publish Draft"

**Behind the Scenes:**
- AI filters to show only gift cards
- Updates each card's `savings` field
- Preview displays: `[Original Price struck-through] [Final Price] [10% off through 12/31]`
- Publishes to `packages.json`

## Testing Checklist

- [ ] Filter buttons appear only on "Packages" tab
- [ ] Filter persists when switching between packages/gift cards
- [ ] Language toggle updates filter labels (EN → TH)
- [ ] AI prompts mention both packages and gift cards
- [ ] Discount text renders in preview with struck-through original price
- [ ] "Apply seasonal discount" prompt works for bulk updates
- [ ] Published JSON includes group field for all vouchers

## Future Enhancements (Optional)

1. **Bulk Edit UI**: Direct UI to update multiple gift cards' discounts simultaneously
2. **Discount Calendar**: Visual calendar to set discount start/end dates
3. **Inventory Integration**: Track gift card stock/redemptions
4. **Export Promo Codes**: Generate QR codes or coupon codes for discounts
5. **Gift Card Templates**: Pre-defined templates for common denominations ($25, $50, $100)

## Notes

- **Backend**: No changes needed—uses existing `aiManagementIntent` and `aiManagementPublish`
- **Data Structure**: Existing `packages.json` handles both types (group field distinguishes them)
- **Caching**: 3-tier cache system still applies (filters are client-side, no cache invalidation needed)
- **Backwards Compatibility**: Existing packages/gift cards work as-is; new filter just organizes the view

---

**Version**: 1.0  
**Date**: 2024  
**Status**: Ready for Production
