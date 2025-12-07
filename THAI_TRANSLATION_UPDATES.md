# Thai Language Translation Updates

## Summary of Changes

All UI elements now fully support Thai language. When users select "TH" in the top-left, the following elements automatically switch to Thai:

## Updated Elements

### 1. **Placeholder Text (Textarea)**
- **EN**: "Ask the AI to add/tweak a service or promo, or paste a full description to turn into JSON..."
- **TH**: "ให้ AI เพิ่ม/ปรับปรุงบริการหรือโปรโมชั่น หรือวางคำอธิบายแบบเต็มเพื่อสร้างรายการ"

### 2. **Send Button**
- **EN**: "Send"
- **TH**: "ส่ง"

### 3. **Guide Section Title**
- **EN**: "How to use (click to collapse)"
- **TH**: "วิธีใช้ (คลิกเพื่อยุบ)"

### 4. **Guide Labels**
- **Add Label**: "Add:" → "เพิ่ม:"
- **Change Label**: "Change:" → "เปลี่ยน:"
- **Delete Label**: "Delete:" → "ลบ:"

### 5. **Guide Examples (Thai Content)**
- **Add Example**: "เพิ่มนวดสวีดิช 60 นาที ราคา 1,200 บาท"
- **Change Example**: "เปลี่ยนราคาเป็น 1,100 บาท"
- **Delete Example**: "ลบรายการนี้"

### 6. **Placeholder (When No Items Selected)**
- **EN**: "Awaiting AI draft."
- **TH**: "รอการเลือกบริการหรือสินค้า" (Waiting for a product or service to be selected)

### 7. **Pending Deletion Message**
- **EN**: "Record pending deletion."
- **TH**: "รอการลบ"

### 8. **Language Badge (in Detail View)**
- **EN**: "Instruction language: English"
- **TH**: "การใช้งาน: ภาษาไทย (ผลลัพธ์เป็นภาษาอังกฤษ)" (Usage: Thai Language (Results in English))

### 9. **Publish CTA Text**
- **EN**: "Review the draft above. When it looks right, submit and commit the changes."
- **TH**: "ตรวจสอบร่างข้างต้น เมื่อถูกต้องแล้ว ให้ส่งและคอมมิตการเปลี่ยนแปลง"

### 10. **Submit & Publish Button**
- **EN**: "Submit & Publish"
- **TH**: "ส่ง & เผยแพร่"

### 11. **Status Message (Set on Language Change)**
- **EN**: "Instructions will be shown in Thai; outputs stay in English."
- **TH**: (Shown in status area when switching to Thai)

## Implementation Details

### Files Modified

1. **ai-config-constants.js**
   - Updated `UI_STRINGS` object with all new translations
   - Updated `GUIDE_CONTENT` object with Thai labels ("วิธีใช้", "เพิ่ม:", etc.)

2. **ai-config.html**
   - Added `data-*` attributes to dynamic elements:
     - `data-placeholder-text` (textarea)
     - `data-send-button` (send button)
     - `data-guide-summary` (guide title)
     - `data-guide-add-label`, `data-guide-change-label`, `data-guide-delete-label` (labels)
     - `data-publish-cta-text` (publish section text)
     - `data-publish-button` (submit button)

3. **ai-config.js**
   - New function: `updateUIStrings()` - Updates all dynamic UI elements
   - Enhanced `showPlaceholder()` - Uses translated placeholder text
   - Enhanced `updateGuideContent()` - Updates guide labels with Thai
   - Enhanced `renderDetail()` - Shows translated empty state message
   - Enhanced `updateLangBadge()` - Uses translated badge text
   - Updated `setLanguagePreference()` - Calls `updateUIStrings()`
   - Updated `init()` - Initializes `updateUIStrings()`

## How It Works

1. **On Page Load**: `init()` calls all `update*()` functions with default language (English)
2. **On Language Toggle**: User clicks "EN" or "TH" button
3. **Trigger**: `setLanguagePreference(lang)` is called
4. **Cascade**: Function calls all update functions in sequence:
   - `updateLangBadge()`
   - `updateUIStrings()` ← **NEW: updates all dynamic text**
   - `updateGuideContent()`
   - `updateHeaderSubtitle()`
   - `updateTabLabels()`
   - `updateVoucherFilterLabels()`
   - `renderChips()`
   - `highlightActiveCard()`

5. **Result**: All UI text switches to Thai instantly

## Testing Checklist

- [ ] Load page → all text in English
- [ ] Click "TH" button → all text switches to Thai
- [ ] Click "EN" button → all text switches back to English
- [ ] Textarea placeholder shows Thai text
- [ ] Send button says "ส่ง" in Thai
- [ ] Guide section title shows "วิธีใช้ (คลิกเพื่อยุบ)"
- [ ] Guide labels: "เพิ่ม:", "เปลี่ยน:", "ลบ:"
- [ ] Empty state shows "รอการเลือกบริการหรือสินค้า"
- [ ] Language badge shows "การใช้งาน: ภาษาไทย (ผลลัพธ์เป็นภาษาอังกฤษ)"
- [ ] Publish section shows Thai text and "ส่ง & เผยแพร่" button
- [ ] All elements preserve functionality while text changes

## Translation Notes

- "ผลลัพธ์" = "outputs/results"
- "การใช้งาน" = "usage/instruction" (more natural than "คำแนะนำ")
- "สินค้า" = "product" or "item" (more general than "service")
- "บริการ" = "service"
- All translations maintain the instruction language preference UI pattern
- Viewer will still render items in English (as requested)

---

**Status**: ✅ Complete  
**Date**: December 2025  
**Backward Compatible**: Yes - English remains default
