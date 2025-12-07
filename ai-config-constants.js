export const TARGET_LABELS = {
  services: 'Services',
  giftVouchers: 'Packages',
  promotions: 'Promotions'
};

export const TARGET_LABELS_TH = {
  services: 'บริการ',
  giftVouchers: 'แพคเกจ',
  promotions: 'โปรโมชั่น'
};

// Filter options for giftVouchers (packages and gift cards)
export const VOUCHER_FILTERS = {
  all: { label: 'All', labelTh: 'ทั้งหมด' },
  packages: { label: 'Packages', labelTh: 'แพคเกจ' },
  giftCards: { label: 'Gift Cards', labelTh: 'การ์ดของขวัญ' }
};

export const UI_STRINGS = {
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

export const GUIDE_CONTENT = {
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

export const GUIDED_PROMPTS = {
  services: [
    { label: 'Add a service', labelTh: 'เพิ่มบริการ', prompt: 'Create a new service. Ask for: name, duration (60/75/90 min), and price. Then draft a 1-2 sentence description if not provided. Show the preview.' },
    { label: 'Update pricing/details', labelTh: 'อัปเดตราคา/รายละเอียด', prompt: 'Update a service—change price, duration, description, or name. Ask which service by name, then what to change.' },
    { label: 'Remove a service', labelTh: 'ลบบริการ', prompt: 'Delete a service by name. Confirm the service name and mark for deletion.' }
  ],
  giftVouchers: [
    { label: 'Add package/gift card', labelTh: 'เพิ่มแพคเกจ/การ์ด', prompt: 'Create a new package or gift card. Ask: title, description, price, group (package or giftCard), and features. For gift cards, ask if it\'s for services or monetary value. Show the preview.' },
    { label: 'Update package/card details', labelTh: 'อัปเดตแพคเกจ/การ์ด', prompt: 'Update a package or gift card—change name, price, description, or features. Ask which item by name, then what to change. Include any discount info in the savings field.' },
    { label: 'Apply seasonal discount', labelTh: 'ใช้ส่วนลด', prompt: 'Update pricing/discounts for packages or gift cards. Ask which items to update, what discount to apply, and valid dates. Update the savings field with discount text (e.g., "10% off through 12/31"). Show the preview.' }
  ],
  promotions: [
    { label: 'Add a promotion', labelTh: 'เพิ่มโปรโมชั่น', prompt: 'Create a new promotion. Ask for: title, description, category, and when it runs. Show the preview.' },
    { label: 'Update promotion copy', labelTh: 'อัปเดตโปรโมชั่น', prompt: 'Update a promotion—change text, CTA, category, or dates. Ask which promotion by name, then what to change.' },
    { label: 'Remove a promotion', labelTh: 'ลบโปรโมชั่น', prompt: 'Delete a promotion by name. Confirm the promotion name and mark for deletion.' }
  ]
};

export const VALID_TARGETS = Object.keys(TARGET_LABELS);

export const API_ROUTES = {
  intent: ['/api/aiManagementIntent'],
  publish: ['/api/aiManagementPublish']
};

// Clickable field metadata for Phase 1: Field-level editing
export const CLICKABLE_FIELDS = {
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
