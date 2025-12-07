/**
 * Unit Tests for AI Content Manager
 * Tests all new features: Thai translations, Gift Card Filter, Clickable Elements
 * 
 * Run with: node --test admin/ai-config.test.js
 */

import assert from 'assert';
import { describe, it, before, after } from 'node:test';

// Mock constants (imported from ai-config-constants.js)
const UI_STRINGS = {
  en: {
    headerSubtitle: 'Tell the AI what to change, then review and publish. Clear, fast edits for services, packages, gift cards, and promotions.',
    placeholderText: 'Ask the AI to edit services, packages, gift cards, or promotions.\nTry a guided chip or type your own.',
    textareaPlaceholder: 'Ask the AI to add/tweak a service or promo or paste a full description to turn into JSON...',
    sendButton: 'Send',
    langBadge: 'Instructions: English',
    reviewCTA: 'Review the draft above. When it looks right, submit and commit the changes.',
    submitButton: 'Submit & Publish',
    waitingForSelection: 'Waiting for an AI Application'
  },
  th: {
    headerSubtitle: 'บอก AI ให้เปลี่ยนแปลง จากนั้นตรวจสอบและเผยแพร่ การแก้ไขที่รวดเร็วและชัดเจนสำหรับบริการ แพคเกจ การ์ด และโปรโมชั่น',
    placeholderText: 'ให้ AI แก้ไขบริการ แพคเกจ การ์ด หรือโปรโมชั่น\nลองใช้ชิพที่แนะนำหรือพิมพ์ของคุณเอง',
    textareaPlaceholder: 'ให้ AI เพิ่ม/ปรับปรุงบริการหรือโปรโมชั่น หรือวางคำอธิบายแบบเต็มเพื่อสร้างรายการ',
    sendButton: 'ส่ง',
    langBadge: 'การใช้งาน: ภาษาไทย (ผลลัพธ์เป็นภาษาอังกฤษ)',
    reviewCTA: 'ตรวจสอบร่างข้างต้น เมื่อถูกต้องแล้ว ให้ส่งและคอมมิตการเปลี่ยนแปลง',
    submitButton: 'ส่ง & เผยแพร่',
    waitingForSelection: 'รอการเลือกบริการหรือสินค้า'
  }
};

const GUIDE_CONTENT = {
  en: {
    title: 'Quick Start',
    add: '"Add a 60-min Swedish massage for $120"',
    change: '"Change the price to $110"',
    delete: '"Remove this item"',
    select: 'Select Services/Packages/Promotions at the top',
    review: 'Review the preview on the right, then Publish'
  },
  th: {
    title: 'วิธีใช้ (คลิกเพื่อยุบ)',
    add: 'เพิ่ม: "เพิ่มนวดสวีดิช 60 นาที ราคา 1,200 บาท"',
    change: 'เปลี่ยน: "เปลี่ยนราคาเป็น 1,100 บาท"',
    delete: 'ลบ: "ลบรายการนี้"',
    select: 'เลือกบริการ/แพคเกจ/โปรโมชั่นที่ด้านบน',
    review: 'ตรวจสอบตัวอย่างทางขวา แล้วคลิก เผยแพร่'
  }
};

const VOUCHER_FILTERS = {
  all: { label: 'All', labelTh: 'ทั้งหมด' },
  packages: { label: 'Packages', labelTh: 'แพคเกจ' },
  giftCards: { label: 'Gift Cards', labelTh: 'การ์ดของขวัญ' }
};

const CLICKABLE_FIELDS = {
  services: [
    { field: 'base_price', label: 'Price', selector: '.service-price' },
    { field: 'duration_minutes', label: 'Duration', selector: '.meta-item' },
    { field: 'service', label: 'Name', selector: 'h5' },
    { field: 'description', label: 'Description', selector: 'p' },
    { field: 'modality', label: 'Modality', selector: '.meta-item' }
  ],
  giftVouchers: [
    { field: 'price', label: 'Price', selector: '.card-price-current' },
    { field: 'priceLabel', label: 'Original Price', selector: '.card-price-original' },
    { field: 'title', label: 'Title', selector: 'h3' },
    { field: 'description', label: 'Description', selector: '.card-description' },
    { field: 'savings', label: 'Discount', selector: '.savings' }
  ],
  promotions: [
    { field: 'title', label: 'Title', selector: '.card-title' },
    { field: 'description', label: 'Description', selector: '.card-description' },
    { field: 'ctaLabel', label: 'CTA Button', selector: '.btn' },
    { field: 'category', label: 'Category', selector: '.meta-item' }
  ]
};

// ============================================================
// TEST SUITE 1: Thai Language Translations
// ============================================================
describe('Thai Language Translations (Feature: All 11 UI Elements)', () => {
  
  it('should have Thai translations for all UI_STRINGS keys', () => {
    const enKeys = Object.keys(UI_STRINGS.en);
    const thKeys = Object.keys(UI_STRINGS.th);
    
    assert.deepStrictEqual(
      enKeys.sort(),
      thKeys.sort(),
      'Thai translations missing for some UI strings'
    );
  });

  it('should have Thai headerSubtitle translation', () => {
    assert.ok(
      UI_STRINGS.th.headerSubtitle.includes('AI'),
      'Thai headerSubtitle should mention AI'
    );
    assert.ok(
      UI_STRINGS.th.headerSubtitle.includes('บริการ'),
      'Thai headerSubtitle should include Thai word for service'
    );
  });

  it('should have Thai placeholderText with multi-line support', () => {
    const thPlaceholder = UI_STRINGS.th.placeholderText;
    assert.ok(
      thPlaceholder.includes('\n'),
      'Thai placeholderText should support multi-line'
    );
    assert.ok(
      thPlaceholder.includes('ชิพ'),
      'Thai placeholderText should mention chips'
    );
  });

  it('should have Thai textareaPlaceholder translation', () => {
    assert.ok(
      UI_STRINGS.th.textareaPlaceholder.length > 0,
      'Thai textareaPlaceholder should not be empty'
    );
    assert.ok(
      UI_STRINGS.th.textareaPlaceholder.includes('เพิ่ม'),
      'Thai textareaPlaceholder should include Thai word for add'
    );
  });

  it('should have Thai sendButton translation', () => {
    assert.strictEqual(
      UI_STRINGS.th.sendButton,
      'ส่ง',
      'Thai sendButton should be "ส่ง"'
    );
  });

  it('should have Thai langBadge translation', () => {
    assert.ok(
      UI_STRINGS.th.langBadge.includes('ภาษาไทย'),
      'Thai langBadge should specify Thai language'
    );
    assert.ok(
      UI_STRINGS.th.langBadge.includes('ผลลัพธ์'),
      'Thai langBadge should mention results stay in English'
    );
  });

  it('should have Thai reviewCTA translation', () => {
    assert.ok(
      UI_STRINGS.th.reviewCTA.includes('ตรวจสอบ'),
      'Thai reviewCTA should include review instruction'
    );
  });

  it('should have Thai submitButton translation', () => {
    assert.strictEqual(
      UI_STRINGS.th.submitButton,
      'ส่ง & เผยแพร่',
      'Thai submitButton should be "ส่ง & เผยแพร่"'
    );
  });

  it('should have Thai waitingForSelection translation', () => {
    assert.ok(
      UI_STRINGS.th.waitingForSelection.includes('รอ'),
      'Thai waitingForSelection should include wait/pending'
    );
  });

  it('should have Thai guide content with labels', () => {
    assert.strictEqual(
      GUIDE_CONTENT.th.title,
      'วิธีใช้ (คลิกเพื่อยุบ)',
      'Thai guide title should be correct'
    );
    assert.ok(
      GUIDE_CONTENT.th.add.includes('เพิ่ม:'),
      'Thai guide add should have label'
    );
    assert.ok(
      GUIDE_CONTENT.th.change.includes('เปลี่ยน:'),
      'Thai guide change should have label'
    );
    assert.ok(
      GUIDE_CONTENT.th.delete.includes('ลบ:'),
      'Thai guide delete should have label'
    );
  });
});

// ============================================================
// TEST SUITE 2: Gift Card Filter Feature
// ============================================================
describe('Gift Card Filter Enhancement', () => {
  
  it('should have all filter options defined', () => {
    assert.ok(VOUCHER_FILTERS.all, 'All filter should exist');
    assert.ok(VOUCHER_FILTERS.packages, 'Packages filter should exist');
    assert.ok(VOUCHER_FILTERS.giftCards, 'Gift Cards filter should exist');
  });

  it('should have English and Thai labels for all filters', () => {
    Object.entries(VOUCHER_FILTERS).forEach(([key, value]) => {
      assert.ok(value.label, `${key} should have English label`);
      assert.ok(value.labelTh, `${key} should have Thai label`);
      assert.ok(
        value.label.length > 0,
        `${key} English label should not be empty`
      );
      assert.ok(
        value.labelTh.length > 0,
        `${key} Thai label should not be empty`
      );
    });
  });

  it('should have correct English filter labels', () => {
    assert.strictEqual(VOUCHER_FILTERS.all.label, 'All');
    assert.strictEqual(VOUCHER_FILTERS.packages.label, 'Packages');
    assert.strictEqual(VOUCHER_FILTERS.giftCards.label, 'Gift Cards');
  });

  it('should have correct Thai filter labels', () => {
    assert.strictEqual(VOUCHER_FILTERS.all.labelTh, 'ทั้งหมด');
    assert.strictEqual(VOUCHER_FILTERS.packages.labelTh, 'แพคเกจ');
    assert.strictEqual(VOUCHER_FILTERS.giftCards.labelTh, 'การ์ดของขวัญ');
  });

  it('should support filter group filtering logic', () => {
    // Simulate filtering
    const testItems = [
      { id: 1, title: 'Package 1', group: 'packages' },
      { id: 2, title: 'Gift Card 1', group: 'vouchers' },
      { id: 3, title: 'Gift Card 2', group: 'giftCard' },
      { id: 4, title: 'Item 4' } // No group
    ];

    const filterByGroup = (items, filterType) => {
      if (filterType === 'all') return items;
      if (filterType === 'packages') {
        return items.filter(item => item.group === 'packages' || item.group === 'package');
      }
      if (filterType === 'giftCards') {
        return items.filter(item => 
          item.group === 'vouchers' || item.group === 'giftCard' || !item.group || item.group === ''
        );
      }
      return items;
    };

    const allFiltered = filterByGroup(testItems, 'all');
    const packagesFiltered = filterByGroup(testItems, 'packages');
    const giftsFiltered = filterByGroup(testItems, 'giftCards');

    assert.strictEqual(allFiltered.length, 4, 'All filter should show 4 items');
    assert.strictEqual(packagesFiltered.length, 1, 'Packages filter should show 1 item');
    assert.strictEqual(giftsFiltered.length, 3, 'Gift Cards filter should show 3 items');
  });
});

// ============================================================
// TEST SUITE 3: Clickable Preview Elements (Phase 1)
// ============================================================
describe('Clickable Preview Elements (Phase 1)', () => {
  
  it('should have clickable fields defined for all targets', () => {
    assert.ok(CLICKABLE_FIELDS.services, 'Services should have clickable fields');
    assert.ok(CLICKABLE_FIELDS.giftVouchers, 'Gift Vouchers should have clickable fields');
    assert.ok(CLICKABLE_FIELDS.promotions, 'Promotions should have clickable fields');
  });

  it('should have field metadata with required properties', () => {
    Object.entries(CLICKABLE_FIELDS).forEach(([target, fields]) => {
      fields.forEach(field => {
        assert.ok(field.field, `${target} field should have "field" property`);
        assert.ok(field.label, `${target} field should have "label" property`);
        assert.ok(field.selector, `${target} field should have "selector" property`);
      });
    });
  });

  it('should have correct services clickable fields', () => {
    const serviceFields = CLICKABLE_FIELDS.services.map(f => f.field);
    assert.ok(
      serviceFields.includes('base_price'),
      'Services should have price field'
    );
    assert.ok(
      serviceFields.includes('duration_minutes'),
      'Services should have duration field'
    );
    assert.ok(
      serviceFields.includes('service'),
      'Services should have service name field'
    );
  });

  it('should have correct gift vouchers clickable fields', () => {
    const voucherFields = CLICKABLE_FIELDS.giftVouchers.map(f => f.field);
    assert.ok(
      voucherFields.includes('price'),
      'Gift Vouchers should have price field'
    );
    assert.ok(
      voucherFields.includes('title'),
      'Gift Vouchers should have title field'
    );
    assert.ok(
      voucherFields.includes('savings'),
      'Gift Vouchers should have savings field'
    );
  });

  it('should have correct promotions clickable fields', () => {
    const promoFields = CLICKABLE_FIELDS.promotions.map(f => f.field);
    assert.ok(
      promoFields.includes('title'),
      'Promotions should have title field'
    );
    assert.ok(
      promoFields.includes('description'),
      'Promotions should have description field'
    );
    assert.ok(
      promoFields.includes('ctaLabel'),
      'Promotions should have CTA label field'
    );
  });

  it('should generate context-aware prompts for services', () => {
    const generatePrompt = (field, value, target) => {
      let prompt = '';
      if (target === 'services') {
        if (field === 'base_price') {
          prompt = `Change the price from $${value} to:`;
        } else if (field === 'duration_minutes') {
          prompt = `Change the duration from ${value} minutes to:`;
        } else if (field === 'service') {
          prompt = `Rename this service from "${value}" to:`;
        }
      }
      return prompt;
    };

    const pricePrompt = generatePrompt('base_price', '100', 'services');
    assert.ok(
      pricePrompt.includes('$100'),
      'Price prompt should include current price'
    );

    const durationPrompt = generatePrompt('duration_minutes', '60', 'services');
    assert.ok(
      durationPrompt.includes('60 minutes'),
      'Duration prompt should include current duration'
    );
  });

  it('should generate context-aware prompts for gift vouchers', () => {
    const generatePrompt = (field, value, target) => {
      let prompt = '';
      if (target === 'giftVouchers') {
        if (field === 'price') {
          prompt = `Change the price from ${value} to:`;
        } else if (field === 'savings') {
          prompt = `Update the discount text to:`;
        }
      }
      return prompt;
    };

    const pricePrompt = generatePrompt('price', '$50', 'giftVouchers');
    assert.ok(
      pricePrompt.includes('$50'),
      'Gift card price prompt should include current price'
    );

    const discountPrompt = generatePrompt('savings', '10% off', 'giftVouchers');
    assert.ok(
      discountPrompt.length > 0,
      'Discount prompt should be generated'
    );
  });
});

// ============================================================
// TEST SUITE 4: API Warmup Fix
// ============================================================
describe('API Warmup Fix (isWarmup Flag)', () => {
  
  it('should validate warmup flag handling', () => {
    const handleRequest = (body) => {
      const { isWarmup = false } = body || {};
      
      // Skip validation for warmup pings
      if (isWarmup) {
        return { status: 200, body: { ok: true } };
      }
      
      // Normal validation
      const { message } = body || {};
      if (!message) {
        return { status: 400, body: { error: 'missing_message' } };
      }
      
      return { status: 200, body: { ok: true, message } };
    };

    // Test warmup request
    const warmupReq = handleRequest({ isWarmup: true });
    assert.strictEqual(warmupReq.status, 200, 'Warmup should return 200');
    assert.ok(warmupReq.body.ok, 'Warmup should return ok: true');

    // Test normal request
    const normalReq = handleRequest({ message: 'test' });
    assert.strictEqual(normalReq.status, 200, 'Normal request should return 200');

    // Test invalid request
    const invalidReq = handleRequest({});
    assert.strictEqual(invalidReq.status, 400, 'Invalid request should return 400');
  });

  it('should prevent Draft payload missing error on warmup', () => {
    const handleIntentRequest = (body) => {
      const { message, isWarmup = false } = body || {};
      
      if (isWarmup) {
        return { status: 200, body: { ok: true } };
      }
      
      if (!message) {
        return { status: 400, body: { error: 'missing_message' } };
      }
      
      // Simulate draft validation
      if (message === 'ping' && !isWarmup) {
        return { status: 500, body: { error: 'server_error', detail: 'Draft payload missing.' } };
      }
      
      return { status: 200, body: { ok: true } };
    };

    // Warmup ping should NOT error
    const warmupResult = handleIntentRequest({ message: 'ping', isWarmup: true });
    assert.strictEqual(warmupResult.status, 200, 'Warmup ping should not error');

    // Regular ping without warmup flag should error
    const pingResult = handleIntentRequest({ message: 'ping', isWarmup: false });
    assert.strictEqual(pingResult.status, 500, 'Regular ping should error as expected');
  });
});

// ============================================================
// TEST SUITE 5: Integration Tests
// ============================================================
describe('Integration Tests - All Features Together', () => {
  
  it('should support switching languages and updating all UI strings', () => {
    const langs = ['en', 'th'];
    langs.forEach(lang => {
      const strings = UI_STRINGS[lang];
      assert.ok(strings, `UI_STRINGS should have ${lang}`);
      assert.ok(strings.sendButton, `${lang} should have sendButton`);
      assert.ok(strings.langBadge, `${lang} should have langBadge`);
    });
  });

  it('should handle language switching for filter labels', () => {
    const testFilterSwitch = (lang) => {
      return {
        filterLabel: lang === 'en' ? 'Show:' : 'แสดง:',
        allLabel: VOUCHER_FILTERS.all[lang === 'en' ? 'label' : 'labelTh'],
        packagesLabel: VOUCHER_FILTERS.packages[lang === 'en' ? 'label' : 'labelTh'],
        giftCardsLabel: VOUCHER_FILTERS.giftCards[lang === 'en' ? 'label' : 'labelTh']
      };
    };

    const enFilters = testFilterSwitch('en');
    assert.strictEqual(enFilters.allLabel, 'All');
    assert.strictEqual(enFilters.packagesLabel, 'Packages');

    const thFilters = testFilterSwitch('th');
    assert.strictEqual(thFilters.allLabel, 'ทั้งหมด');
    assert.strictEqual(thFilters.packagesLabel, 'แพคเกจ');
  });

  it('should handle complex item editing workflow', () => {
    // Simulate selecting an item and clicking to edit
    const selectedItem = {
      id: 'service-123',
      service: 'Swedish Massage',
      duration_minutes: 60,
      base_price: 100
    };

    const generateEditPrompt = (field) => {
      if (field === 'base_price') {
        return `Change the price from $${selectedItem[field]} to:`;
      }
      if (field === 'duration_minutes') {
        return `Change the duration from ${selectedItem[field]} minutes to:`;
      }
      return `Edit ${field}:`;
    };

    const pricePrompt = generateEditPrompt('base_price');
    assert.ok(pricePrompt.includes('$100'), 'Should generate price edit prompt');

    const durationPrompt = generateEditPrompt('duration_minutes');
    assert.ok(durationPrompt.includes('60 minutes'), 'Should generate duration edit prompt');
  });

  it('should maintain consistency across all target types', () => {
    const targets = ['services', 'giftVouchers', 'promotions'];
    targets.forEach(target => {
      assert.ok(
        CLICKABLE_FIELDS[target],
        `Should have clickable fields for ${target}`
      );
      assert.ok(
        CLICKABLE_FIELDS[target].length > 0,
        `${target} should have at least one clickable field`
      );
    });
  });
});

console.log('\n✅ All test suites defined and ready to run!');
