# Visual Guide: Gift Card Filter Feature

## Interface Layout

```
┌─────────────────────────────────────────────────────────────┐
│ AI Content Manager                                    EN│TH  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  [Reset][Download]  │
│  │ Services │ Packages │ Promotions     │                     │
│  └──────────────────────────────────────┘                     │
│  ┌────────────────────────────────────────────────┐           │
│  │ Show: [All] [Packages] [Gift Cards]            │ ← NEW!    │
│  └────────────────────────────────────────────────┘           │
│                                                                │
│  Tell the AI what to change...                               │
│  ┌─────────────────────────────────────────────────┐          │
│  │ [Chip: Add package/gift card]                  │          │
│  │ [Chip: Update package/card details]             │          │
│  │ [Chip: Apply seasonal discount] ← NEW!          │          │
│  └─────────────────────────────────────────────────┘          │
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Your message:        │  │ AI assistant:        │           │
│  │                      │  │                      │           │
│  │ "Apply 10% off to    │  │ "I'll apply 10% off  │           │
│  │ all gift cards thru  │  │ to your gift cards   │           │
│  │ December 31"         │  │ with dates. Here's   │           │
│  │                      │  │ the preview:         │           │
│  │ [Textarea]           │  │                      │           │
│  │ [🎤] [Send]          │  │ [Gift card previews] │           │
│  └──────────────────────┘  └──────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Filter States

### 1. Services Tab (No Filter Needed)
```
┌─────────────────────────┐
│ Services │ Packages │ Promotions
│
└─────────────────────────┘
← Filter is HIDDEN
```

### 2. Packages Tab - "All" Selected
```
┌─────────────────────────────────────────┐
│ Services │ Packages │ Promotions
│
│ Show: [●All●] [Packages] [Gift Cards]   ← Filter is VISIBLE
│
│ Items displayed: 2 Packages + 3 Gift Cards = 5 items total
└─────────────────────────────────────────┘
```

### 3. Packages Tab - "Packages" Selected
```
┌─────────────────────────────────────────┐
│ Services │ Packages │ Promotions
│
│ Show: [All] [●Packages●] [Gift Cards]   ← Filter active
│
│ Items displayed: Only 2 Packages
└─────────────────────────────────────────┘
```

### 4. Packages Tab - "Gift Cards" Selected
```
┌─────────────────────────────────────────┐
│ Services │ Packages │ Promotions
│
│ Show: [All] [Packages] [●Gift Cards●]   ← Filter active
│
│ Items displayed: Only 3 Gift Cards
└─────────────────────────────────────────┘
```

## Item List Organization

### When Viewing "Packages" Tab

**Before** (with filter):
```
All Items
├── 60-min Swedish massage package
├── 90-min luxury spa package
├── $50 gift card
├── $100 gift card
└── holiday special package
```

**After** (with "All" selected):
```
Show: All
├── 60-min Swedish massage package
├── 90-min luxury spa package
├── $50 gift card
├── $100 gift card
└── holiday special package
```

**After** (with "Packages" selected):
```
Show: Packages
├── 60-min Swedish massage package
├── 90-min luxury spa package
└── holiday special package
```

**After** (with "Gift Cards" selected):
```
Show: Gift Cards
├── $50 gift card
└── $100 gift card
```

## Gift Card Preview Example

### Without Discount
```
┌─────────────────────────────┐
│ [CARD DISPLAY]              │
│ $100 Gift Card              │
│                             │
│ Redeemable for any massage  │
│ service at Dantara Spa      │
│                             │
│ ✓ Valid for 12 months       │
│ ✓ Transferable              │
│ ✓ No expiration fees        │
│                             │
│ $100.00                     │
│ [Book Now Button]           │
└─────────────────────────────┘
```

### With 10% Discount
```
┌────────────────────────────────┐
│ [CARD DISPLAY]                 │
│ $100 Gift Card                 │
│                                │
│ Redeemable for any massage     │
│ service at Dantara Spa         │
│                                │
│ ✓ Valid for 12 months          │
│ ✓ Transferable                 │
│ ✓ No expiration fees           │
│                                │
│ ~~$100.00~~ $90.00             │
│ [10% off through 12/31]        │
│ [Book Now Button]              │
└────────────────────────────────┘
```

## User Workflow Diagram

### Seasonal Discount Campaign

```
Start
  │
  ├─→ Open AI Content Manager
  │     │
  │     ├─→ Click "Packages" tab
  │     │
  │     ├─→ (Filter appears: "Show: All | Packages | Gift Cards")
  │     │
  │     ├─→ Click "Show: Gift Cards"
  │     │     (Only gift cards now visible)
  │     │
  │     ├─→ Ask AI: "Apply 10% off to all gift cards through 12/31"
  │     │     │
  │     │     ├─→ AI processes request
  │     │     │   • Calculates: new_price = old_price × 0.9
  │     │     │   • Sets: savings = "10% off through 12/31"
  │     │     │   • Stores: priceLabel = original price
  │     │     │
  │     │     └─→ Shows preview
  │     │         ~~$100~~ $90 [10% off through 12/31]
  │     │
  │     ├─→ Review looks good?
  │     │   │
  │     │   ├─→ YES: Click "Publish Draft"
  │     │   │     │
  │     │   │     └─→ Changes saved to packages.json
  │     │   │         All gift cards updated with 10% discount
  │     │   │
  │     │   └─→ NO: Ask AI to adjust
  │     │         "Make it 15% off instead"
  │     │
  │     └─→ Done!

End
```

## Data Flow During Discount Application

```
User Request: "Apply 10% off to all gift cards"
        │
        ↓
AI Intent Handler (Backend)
        │
        ├─→ Identify: giftVouchers target
        ├─→ Filter: Show only gift cards (group = "vouchers")
        ├─→ For each gift card:
        │   ├─→ Save current price to priceLabel
        │   ├─→ Calculate new price (90% of original)
        │   └─→ Set savings: "10% off through 12/31"
        │
        ├─→ Generate preview HTML
        │   ├─→ Show original ~~struck-through~~
        │   ├─→ Show discounted price (bold, prominent)
        │   └─→ Show savings badge (green callout)
        │
        └─→ Return to UI
            │
            ├─→ Display preview
            └─→ Wait for "Publish" confirmation
                    │
                    ↓
                Publish Handler
                    │
                    ├─→ Save to packages.json
                    ├─→ Include: id, title, group, price, priceLabel, savings
                    ├─→ Update: website catalog
                    └─→ Done!
```

## Filter Button Visual States

### Inactive (Unselected)
```
┌──────────┐
│ Packages │  ← Light background
│  (teal   │     Light border
│  border) │     Teal text
└──────────┘
```

### Active (Selected)
```
┌──────────┐
│ Packages │  ← Dark teal background
│  (white) │     Dark teal border
│  text    │     White text
└──────────┘
```

### Hover (Mouse Over)
```
┌──────────┐
│ Packages │  ← Lighter teal background
│  (teal   │     Teal border
│  text)   │     Slight shadow
└──────────┘
```

## Language Toggle Example

### English
```
Show: [All] [Packages] [Gift Cards]
```

### Thai (ไทย)
```
แสดง: [ทั้งหมด] [แพคเกจ] [การ์ดของขวัญ]
```

*Toggles automatically when "EN"/"TH" button clicked at top left*

---

## Quick Decision Tree

```
Are you managing packages or gift cards?
│
├─→ Both (seasonal campaign, etc.)
│   └─→ Click "Show: All"
│       └─→ See and edit all items
│
├─→ Only packages
│   └─→ Click "Show: Packages"
│       └─→ See only packages
│
└─→ Only gift cards
    └─→ Click "Show: Gift Cards"
        └─→ See only gift cards
            (Perfect for: 10% off campaign)
```

