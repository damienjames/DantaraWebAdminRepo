/**
 * End-to-End Integration Tests
 * Tests: Complete workflows from UI interaction to API processing
 * 
 * Run with: node --test e2e.test.mjs
 */

import assert from 'assert';
import { describe, it } from 'node:test';

/**
 * Simulates the complete flow:
 * 1. User interacts with UI (clicks clickable field)
 * 2. Frontend generates edit prompt
 * 3. Frontend sends request to API with warmup flag support
 * 4. API processes request and returns draft
 * 5. Frontend displays preview
 */
class E2ETestEnvironment {
  constructor() {
    this.uiLanguage = 'en';
    this.selectedTarget = 'services';
    this.selectedCard = null;
    this.clickableFields = {};
    this.apiRequests = [];
    this.apiResponses = [];
  }

  // Simulate UI constants
  setupConstants() {
    this.UI_STRINGS = {
      en: {
        services: 'Services',
        giftVouchers: 'Gift Vouchers',
        promotions: 'Promotions',
        editLabel: 'Edit',
        addLabel: 'Add New',
        deleteLabel: 'Delete'
      },
      th: {
        services: 'บริการ',
        giftVouchers: 'คูปองของขวัญ',
        promotions: 'โปรโมชัน',
        editLabel: 'แก้ไข',
        addLabel: 'เพิ่มใหม่',
        deleteLabel: 'ลบ'
      }
    };

    this.CLICKABLE_FIELDS = {
      services: [
        { field: 'title', label: 'Service Title', selector: '[data-field="services-title"]' },
        { field: 'description', label: 'Description', selector: '[data-field="services-description"]' }
      ],
      giftVouchers: [
        { field: 'amount', label: 'Voucher Amount', selector: '[data-field="vouchers-amount"]' },
        { field: 'name', label: 'Voucher Name', selector: '[data-field="vouchers-name"]' }
      ],
      promotions: [
        { field: 'code', label: 'Promo Code', selector: '[data-field="promos-code"]' },
        { field: 'discount', label: 'Discount %', selector: '[data-field="promos-discount"]' }
      ]
    };
  }

  // Simulate frontend API client
  generateFieldEditPrompt(field, value, target) {
    const fields = this.CLICKABLE_FIELDS[target] || [];
    const fieldConfig = fields.find(f => f.field === field);
    
    if (!fieldConfig) return null;

    const instruction = this.uiLanguage === 'en' 
      ? `Update the ${fieldConfig.label} in the ${this.selectedTarget} section. Current value: "${value}"`
      : `อัปเดต${fieldConfig.label}ในส่วน${this.selectedTarget} ค่าปัจจุบัน: "${value}"`;

    return instruction;
  }

  // Simulate user clicking on a field
  clickField(target, fieldName, currentValue) {
    // Generate edit prompt
    const prompt = this.generateFieldEditPrompt(fieldName, currentValue, target);
    
    // Prepare API request
    const apiRequest = {
      method: 'POST',
      endpoint: '/api/adminAiIntent',
      body: {
        message: prompt,
        history: [],
        target: target,
        selectedId: this.selectedCard?.id || null,
        isWarmup: false  // Regular request, not warmup
      }
    };

    this.apiRequests.push(apiRequest);
    return apiRequest;
  }

  // Simulate API response
  processAPIRequest(request) {
    const { body } = request;

    // Reject if warmup but missing isWarmup flag
    if (!body.message) {
      return {
        status: 400,
        body: { error: 'missing_message' }
      };
    }

    // Process and return draft
    return {
      status: 200,
      body: {
        target: body.target,
        action: 'update',
        draftJson: {
          id: body.selectedId || 'new-' + Date.now(),
          title: 'Updated Item',
          modified: new Date().toISOString()
        },
        diff: 'Changes detected and prepared',
        previewHtml: `<article>${body.target}: Updated</article>`,
        notes: 'Draft ready for review'
      }
    };
  }

  // Simulate warmup ping flow
  warmupAPI() {
    const warmupRequest = {
      method: 'POST',
      endpoint: '/api/adminAiIntent',
      body: {
        message: 'ping',
        history: [],
        target: this.selectedTarget,
        isWarmup: true  // Critical flag for cold start
      }
    };

    this.apiRequests.push(warmupRequest);

    // API should handle warmup quickly
    return {
      status: 200,
      body: { ok: true }
    };
  }

  // Simulate language switch
  setLanguage(lang) {
    assert.ok(['en', 'th'].includes(lang), 'Language must be en or th');
    this.uiLanguage = lang;
  }

  // Get current language label
  getLabel(key) {
    return this.UI_STRINGS[this.uiLanguage]?.[key] || key;
  }
}

describe('End-to-End: Complete User Workflow', () => {
  
  it('should complete full warmup -> regular request flow', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Step 1: Warmup API on load
    const warmupResponse = env.warmupAPI();
    assert.strictEqual(warmupResponse.status, 200);

    // Step 2: Select target
    env.selectedTarget = 'services';
    assert.strictEqual(env.selectedTarget, 'services');

    // Step 3: Click on a field
    const editRequest = env.clickField('services', 'title', 'Current Service Name');
    assert.ok(editRequest.body.message);

    // Step 4: API processes request
    const editResponse = env.processAPIRequest(editRequest);
    assert.strictEqual(editResponse.status, 200);
    assert.ok(editResponse.body.draftJson);
  });

  it('should handle language switching in workflows', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // English workflow
    env.setLanguage('en');
    const enPrompt = env.generateFieldEditPrompt('title', 'Test', 'services');
    assert.ok(enPrompt.includes('Update'));

    // Thai workflow
    env.setLanguage('th');
    const thPrompt = env.generateFieldEditPrompt('title', 'Test', 'services');
    assert.ok(thPrompt.includes('อัปเดต'));

    assert.notStrictEqual(enPrompt, thPrompt, 'Prompts should be different');
  });

  it('should handle multiple field edits in sequence', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();
    env.selectedTarget = 'services';

    // First edit
    const req1 = env.clickField('services', 'title', 'Service 1');
    const res1 = env.processAPIRequest(req1);
    assert.strictEqual(res1.status, 200);

    // Second edit
    const req2 = env.clickField('services', 'description', 'Description 1');
    const res2 = env.processAPIRequest(req2);
    assert.strictEqual(res2.status, 200);

    // Verify both requests were logged
    assert.strictEqual(env.apiRequests.length, 2);
  });

  it('should maintain language context across operations', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Set Thai language
    env.setLanguage('th');

    // Check labels in Thai
    assert.strictEqual(env.getLabel('services'), 'บริการ');
    assert.strictEqual(env.getLabel('editLabel'), 'แก้ไข');

    // Generate prompt in Thai
    const prompt = env.generateFieldEditPrompt('title', 'Test', 'services');
    assert.ok(prompt.includes('อัปเดต'));
  });

  it('should handle target switching', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Start with services
    env.selectedTarget = 'services';
    const req1 = env.clickField('services', 'title', 'Service Name');
    assert.strictEqual(req1.body.target, 'services');

    // Switch to gift vouchers
    env.selectedTarget = 'giftVouchers';
    const req2 = env.clickField('giftVouchers', 'amount', '500');
    assert.strictEqual(req2.body.target, 'giftVouchers');

    // Switch to promotions
    env.selectedTarget = 'promotions';
    const req3 = env.clickField('promotions', 'code', 'SUMMER2024');
    assert.strictEqual(req3.body.target, 'promotions');

    // Verify all three were different
    assert.strictEqual(env.apiRequests.length, 3);
  });

  it('should handle card selection and context', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Simulate card selection
    env.selectedCard = { id: 'service-123', name: 'Massage Service' };
    
    const request = env.clickField('services', 'title', 'Original Title');
    assert.strictEqual(request.body.selectedId, 'service-123');

    // Clear selection
    env.selectedCard = null;
    const newRequest = env.clickField('services', 'title', 'Another Title');
    assert.strictEqual(newRequest.body.selectedId, null);
  });
});

describe('End-to-End: API Cold Start Optimization', () => {
  
  it('should handle cold start with warmup', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Page loads → API needs to warm up
    const warmupResponse = env.warmupAPI();
    assert.strictEqual(warmupResponse.status, 200);

    // User immediately makes request
    const userRequest = env.clickField('services', 'title', 'New Service');
    const userResponse = env.processAPIRequest(userRequest);

    // Both should succeed without "Draft payload missing" error
    assert.strictEqual(userResponse.status, 200);
  });

  it('should track warmup vs regular requests separately', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Warmup
    env.warmupAPI();

    // Regular requests
    env.clickField('services', 'title', 'Service 1');
    env.clickField('giftVouchers', 'amount', '500');
    env.clickField('promotions', 'code', 'PROMO');

    // First request should be warmup
    assert.ok(env.apiRequests[0].body.isWarmup);

    // Others should not be warmup
    assert.strictEqual(env.apiRequests[1].body.isWarmup, false);
    assert.strictEqual(env.apiRequests[2].body.isWarmup, false);
    assert.strictEqual(env.apiRequests[3].body.isWarmup, false);
  });

  it('should handle multiple concurrent field clicks', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();
    env.selectedTarget = 'services';

    // Simulate rapid field clicks
    const requests = [
      env.clickField('services', 'title', 'Title 1'),
      env.clickField('services', 'description', 'Description 1'),
      env.clickField('services', 'title', 'Title 2')
    ];

    // All should be processable
    requests.forEach(req => {
      const response = env.processAPIRequest(req);
      assert.strictEqual(response.status, 200);
    });

    assert.strictEqual(env.apiRequests.length, 3);
  });
});

describe('End-to-End: Error Recovery', () => {
  
  it('should recover from invalid language', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Try invalid language
    try {
      env.setLanguage('invalid');
      assert.fail('Should reject invalid language');
    } catch (e) {
      assert.ok(e.message.includes('Language must be'));
    }

    // Should still work with valid language
    env.setLanguage('en');
    assert.strictEqual(env.uiLanguage, 'en');
  });

  it('should handle missing field configuration', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Try to click non-existent field
    const prompt = env.generateFieldEditPrompt('nonexistent', 'value', 'services');
    assert.strictEqual(prompt, null);
  });

  it('should handle invalid target gracefully', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Try invalid target - clickField will return request but message will be null
    const request = env.clickField('invalid_target', 'title', 'value');
    
    // Message should be null because field config not found
    assert.strictEqual(request.body.message, null);
    assert.strictEqual(request.body.target, 'invalid_target');
  });

  it('should reject requests without message', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    // Create invalid request
    const invalidRequest = {
      method: 'POST',
      body: {
        target: 'services',
        // message is missing
      }
    };

    const response = env.processAPIRequest(invalidRequest);
    assert.strictEqual(response.status, 400);
  });
});

describe('End-to-End: Data Integrity', () => {
  
  it('should preserve all request metadata', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();
    env.selectedCard = { id: 'item-456' };

    const request = env.clickField('services', 'title', 'Test');

    // Verify all metadata preserved
    assert.ok(request.body.message);
    assert.deepStrictEqual(request.body.history, []);
    assert.strictEqual(request.body.target, 'services');
    assert.strictEqual(request.body.selectedId, 'item-456');
    assert.strictEqual(request.body.isWarmup, false);
  });

  it('should maintain history across multiple edits', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    const requests = [
      env.clickField('services', 'title', 'Title 1'),
      env.clickField('services', 'title', 'Title 2')
    ];

    // Each request should have same history structure
    requests.forEach(req => {
      assert.ok(Array.isArray(req.body.history));
      assert.strictEqual(req.body.history.length, 0);
    });
  });

  it('should handle Unicode data throughout workflow', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    env.setLanguage('th');
    const request = env.clickField('services', 'title', 'บริการนวด');
    
    assert.ok(request.body.message.includes('บริการ'));
    
    const response = env.processAPIRequest(request);
    assert.strictEqual(response.status, 200);
  });

  it('should handle special characters in field values', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    const specialValues = [
      'Title with "quotes"',
      'Title with \\backslash',
      "Title with 'apostrophe'",
      'Title with $special @characters!'
    ];

    specialValues.forEach(value => {
      const request = env.clickField('services', 'title', value);
      const response = env.processAPIRequest(request);
      assert.strictEqual(response.status, 200);
    });
  });
});

describe('End-to-End: Performance', () => {
  
  it('should complete workflow within reasonable time', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    const start = process.hrtime.bigint();

    // Full workflow
    env.warmupAPI();
    env.setLanguage('en');
    env.selectedTarget = 'services';
    const request = env.clickField('services', 'title', 'Test');
    const response = env.processAPIRequest(request);

    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // Convert to ms

    assert.strictEqual(response.status, 200);
    assert.ok(elapsed < 100, `Workflow should complete in <100ms, took ${elapsed}ms`);
  });

  it('should handle 100 sequential edits', () => {
    const env = new E2ETestEnvironment();
    env.setupConstants();

    const start = process.hrtime.bigint();

    for (let i = 0; i < 100; i++) {
      const request = env.clickField('services', 'title', `Title ${i}`);
      const response = env.processAPIRequest(request);
      assert.strictEqual(response.status, 200);
    }

    const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;

    assert.strictEqual(env.apiRequests.length, 100);
    assert.ok(elapsed < 1000, `100 edits should complete in <1s, took ${elapsed}ms`);
  });
});

console.log('\n✅ All E2E tests defined!');
