# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-form-testing.spec.ts >> Mahajan Finance Suite - E2E Testing >> Contact form auto-fill and submit
- Location: tests\e2e-form-testing.spec.ts:30:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - link "+91 9730540215" [active] [ref=e7] [cursor=pointer]:
          - /url: tel:+919730540215
          - img [ref=e8]
          - text: +91 9730540215
        - link "info@mahajanfinance.com" [ref=e10] [cursor=pointer]:
          - /url: mailto:info@mahajanfinance.com
          - img [ref=e11]
          - text: info@mahajanfinance.com
      - generic [ref=e14]:
        - generic [ref=e17]:
          - img
          - textbox "Search services..." [ref=e18]
          - generic [ref=e19]: ⌘K
        - link "Login" [ref=e20] [cursor=pointer]:
          - /url: /auth
    - banner [ref=e21]:
      - generic [ref=e22]:
        - link "Mahajan Finance Logo MAHAJAN FINANCE" [ref=e23] [cursor=pointer]:
          - /url: /
          - img "Mahajan Finance Logo" [ref=e24]
          - heading "MAHAJAN FINANCE" [level=1] [ref=e25]
        - navigation [ref=e26]:
          - link "Home" [ref=e27] [cursor=pointer]:
            - /url: /
          - link "🏦 Loans" [ref=e28] [cursor=pointer]:
            - /url: /apply-loan
          - link "🛡️ Insurance" [ref=e29] [cursor=pointer]:
            - /url: /insurance
          - link "📈 Investments" [ref=e30] [cursor=pointer]:
            - /url: /investments
          - link "📊 Accounting" [ref=e31] [cursor=pointer]:
            - /url: /accounting
          - link "🧾 CSC Services" [ref=e32] [cursor=pointer]:
            - /url: /services
          - link "🏛️ Govt Schemes" [ref=e33] [cursor=pointer]:
            - /url: /govt-schemes
          - link "🛒 Deals" [ref=e34] [cursor=pointer]:
            - /url: /shopping
          - link "🤝 Partner" [ref=e35] [cursor=pointer]:
            - /url: /partner
          - link "💰 Cash Flow" [ref=e36] [cursor=pointer]:
            - /url: /tracker
          - link "About Us" [ref=e37] [cursor=pointer]:
            - /url: /about
          - link "Contact" [ref=e38] [cursor=pointer]:
            - /url: /contact
        - link "Apply Now" [ref=e40] [cursor=pointer]:
          - /url: /apply-loan
    - main [ref=e41]:
      - generic [ref=e43]:
        - heading "Contact Us" [level=1] [ref=e44]
        - paragraph [ref=e45]: Get in touch — we respond within 15 minutes
      - generic [ref=e47]:
        - generic [ref=e48]:
          - link "WhatsApp +91 9730540215" [ref=e50] [cursor=pointer]:
            - /url: https://wa.me/919730540215?text=Hello%20Mahajan%20Finance
            - img [ref=e52]
            - generic [ref=e54]:
              - paragraph [ref=e55]: WhatsApp
              - paragraph [ref=e56]: +91 9730540215
          - link "Call Us +91 9730540215" [ref=e58] [cursor=pointer]:
            - /url: tel:+919730540215
            - img [ref=e60]
            - generic [ref=e62]:
              - paragraph [ref=e63]: Call Us
              - paragraph [ref=e64]: +91 9730540215
          - link "Email info@mahajanfinance.com" [ref=e66] [cursor=pointer]:
            - /url: mailto:info@mahajanfinance.com
            - img [ref=e68]
            - generic [ref=e71]:
              - paragraph [ref=e72]: Email
              - paragraph [ref=e73]: info@mahajanfinance.com
          - link "Website www.mahajanfinance.com" [ref=e75] [cursor=pointer]:
            - /url: https://www.mahajanfinance.com
            - img [ref=e77]
            - generic [ref=e80]:
              - paragraph [ref=e81]: Website
              - paragraph [ref=e82]: www.mahajanfinance.com
          - generic [ref=e84] [cursor=pointer]:
            - img [ref=e86]
            - generic [ref=e89]:
              - paragraph [ref=e90]: Working Hours
              - paragraph [ref=e91]: "Mon – Sat: 9:00 AM – 7:00 PM"
          - generic [ref=e93] [cursor=pointer]:
            - img [ref=e95]
            - generic [ref=e98]:
              - paragraph [ref=e99]: Address
              - paragraph [ref=e100]: Opp. Ashta Nagar Parishad, Ashta, Tal. Walwa, Dist. Sangli
        - generic [ref=e102]:
          - heading "💳 Secure Payments" [level=3] [ref=e103]
          - paragraph [ref=e104]: All payments are processed securely via Razorpay (UPI, Cards, Netbanking, Wallets)
    - contentinfo [ref=e105]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - link "Mahajan Finance Logo MAHAJAN FINANCE" [ref=e109] [cursor=pointer]:
              - /url: /
              - img "Mahajan Finance Logo" [ref=e110]
              - generic [ref=e111]: MAHAJAN FINANCE
            - paragraph [ref=e112]: Your Trusted Financial Partner
            - list [ref=e113]:
              - listitem [ref=e114]: Personal, Home & Business Loans
              - listitem [ref=e115]: Gold, Vehicle & NRI Loans
              - listitem [ref=e116]: Car, Bike & Health Insurance
              - listitem [ref=e117]: ITR Filing & GST Returns
              - listitem [ref=e118]: PAN Card, FSSAI & Udyam
              - listitem [ref=e119]: Govt Schemes & Subsidies
          - generic [ref=e120]:
            - heading "Contact Us" [level=3] [ref=e121]
            - list [ref=e122]:
              - listitem [ref=e123]:
                - img [ref=e124]
                - link "+91 9730540215" [ref=e126] [cursor=pointer]:
                  - /url: tel:+919730540215
              - listitem [ref=e127]:
                - img [ref=e128]
                - link "info@mahajanfinance.com" [ref=e131] [cursor=pointer]:
                  - /url: mailto:info@mahajanfinance.com
              - listitem [ref=e132]: Opp. Ashta Nagar Parishad, Ashta, Tal. Walwa, Dist. Sangli
              - listitem [ref=e133]: www.mahajanfinance.com
          - generic [ref=e134]:
            - heading "Quick Links" [level=3] [ref=e135]
            - list [ref=e136]:
              - listitem [ref=e137]:
                - link "Home" [ref=e138] [cursor=pointer]:
                  - /url: /
                  - img [ref=e139]
                  - text: Home
              - listitem [ref=e141]:
                - link "Services" [ref=e142] [cursor=pointer]:
                  - /url: /services
                  - img [ref=e143]
                  - text: Services
              - listitem [ref=e145]:
                - link "Apply for Loan" [ref=e146] [cursor=pointer]:
                  - /url: /apply-loan
                  - img [ref=e147]
                  - text: Apply for Loan
              - listitem [ref=e149]:
                - link "Investments" [ref=e150] [cursor=pointer]:
                  - /url: /investments
                  - img [ref=e151]
                  - text: Investments
              - listitem [ref=e153]:
                - link "Partner Program" [ref=e154] [cursor=pointer]:
                  - /url: /partner
                  - img [ref=e155]
                  - text: Partner Program
              - listitem [ref=e157]:
                - link "Govt Schemes" [ref=e158] [cursor=pointer]:
                  - /url: /govt-schemes
                  - img [ref=e159]
                  - text: Govt Schemes
              - listitem [ref=e161]:
                - link "Deals & Shop" [ref=e162] [cursor=pointer]:
                  - /url: /shopping
                  - img [ref=e163]
                  - text: Deals & Shop
              - listitem [ref=e165]:
                - link "Cash Flow Manager" [ref=e166] [cursor=pointer]:
                  - /url: /tracker
                  - img [ref=e167]
                  - text: Cash Flow Manager
              - listitem [ref=e169]:
                - link "Login / Register" [ref=e170] [cursor=pointer]:
                  - /url: /auth
                  - img [ref=e171]
                  - text: Login / Register
          - generic [ref=e173]:
            - heading "Legal" [level=3] [ref=e174]
            - list [ref=e175]:
              - listitem [ref=e176]:
                - link "Privacy Policy" [ref=e177] [cursor=pointer]:
                  - /url: /privacy
                  - img [ref=e178]
                  - text: Privacy Policy
              - listitem [ref=e180]:
                - link "Terms & Conditions" [ref=e181] [cursor=pointer]:
                  - /url: /terms
                  - img [ref=e182]
                  - text: Terms & Conditions
              - listitem [ref=e184]:
                - link "Disclaimer" [ref=e185] [cursor=pointer]:
                  - /url: /disclaimer
                  - img [ref=e186]
                  - text: Disclaimer
            - generic [ref=e188]:
              - paragraph [ref=e189]: 💬 Quick Enquiry
              - link "WhatsApp Us" [ref=e190] [cursor=pointer]:
                - /url: https://wa.me/919730540215
        - generic [ref=e191]:
          - paragraph [ref=e192]: © 2026 Mahajan Finance. All rights reserved.
          - paragraph [ref=e193]: www.mahajanfinance.com
```

# Test source

```ts
  1   | ﻿import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:8080';
  4   | 
  5   | test.describe('Mahajan Finance Suite - E2E Testing', () => {
  6   |   
  7   |   test.beforeEach(async ({ page }) => {
  8   |     await page.goto(BASE_URL);
  9   |     await page.waitForLoadState('networkidle');
  10  |   });
  11  | 
  12  |   // TEST 1: Homepage Validation
  13  |   test('Homepage loads correctly', async ({ page }) => {
  14  |     console.log('Testing Homepage...');
  15  |     
  16  |     await expect(page).toHaveURL(BASE_URL);
  17  |     
  18  |     const logo = page.locator('img').first();
  19  |     await expect(logo).toBeVisible({ timeout: 5000 });
  20  |     
  21  |     const navMenu = page.locator('nav, header').first();
  22  |     await expect(navMenu).toBeVisible();
  23  |     
  24  |     await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
  25  |     
  26  |     console.log('Homepage validated!');
  27  |   });
  28  | 
  29  |   // TEST 2: Contact Form Auto-Fill
  30  |   test('Contact form auto-fill and submit', async ({ page }) => {
  31  |     console.log('Testing Contact Form...');
  32  |     
  33  |     await page.goto(BASE_URL + '/contact');
  34  |     await page.waitForLoadState('networkidle');
  35  |     
  36  |     // Fill name field
  37  |     const nameInput = page.locator('input[type="text"]').first();
> 38  |     await nameInput.fill('Auto Test User');
      |                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  39  |     console.log('Name filled');
  40  |     
  41  |     // Fill email field  
  42  |     const emailInput = page.locator('input[type="email"]').first();
  43  |     await emailInput.fill('autotest@example.com');
  44  |     console.log('Email filled');
  45  |     
  46  |     // Fill phone if exists
  47  |     const phoneInput = page.locator('input[type="tel"], input[name*="phone"]');
  48  |     if (await phoneInput.count() > 0) {
  49  |       await phoneInput.first().fill('+91 9876543210');
  50  |       console.log('Phone filled');
  51  |     }
  52  |     
  53  |     // Fill message
  54  |     const textarea = page.locator('textarea').first();
  55  |     if (await textarea.isVisible()) {
  56  |       await textarea.fill('Automated test from Playwright E2E suite.');
  57  |       console.log('Message filled');
  58  |     }
  59  |     
  60  |     await page.screenshot({ path: 'test-results/02-contact-filled.png' });
  61  |     
  62  |     // Submit form
  63  |     const submitBtn = page.locator('button[type="submit"]').first();
  64  |     await submitBtn.click();
  65  |     console.log('Submit clicked');
  66  |     
  67  |     await page.waitForTimeout(2000);
  68  |     await page.screenshot({ path: 'test-results/02-contact-submitted.png' });
  69  |     
  70  |     console.log('Contact form tested!');
  71  |   });
  72  | 
  73  |   // TEST 3: Auth/Login Form
  74  |   test('Authentication form testing', async ({ page }) => {
  75  |     console.log('Testing Auth Form...');
  76  |     
  77  |     await page.goto(BASE_URL + '/auth');
  78  |     await page.waitForLoadState('networkidle');
  79  |     
  80  |     await page.screenshot({ path: 'test-results/03-auth-initial.png', fullPage: true });
  81  |     
  82  |     // Try empty submit first (validation check)
  83  |     const submitBtn = page.locator('button[type="submit"]').first();
  84  |     await submitBtn.click();
  85  |     await page.waitForTimeout(1000);
  86  |     
  87  |     await page.screenshot({ path: 'test-results/03-auth-validation.png' });
  88  |     
  89  |     // Fill credentials
  90  |     const emailInput = page.locator('input[type="email"]').first();
  91  |     await emailInput.fill('testuser@test.com');
  92  |     
  93  |     const passwordInput = page.locator('input[type="password"]').first();
  94  |     await passwordInput.fill('TestPass123!');
  95  |     
  96  |     await page.screenshot({ path: 'test-results/03-auth-filled.png' });
  97  |     
  98  |     // Attempt login
  99  |     await submitBtn.click();
  100 |     await page.waitForTimeout(3000);
  101 |     
  102 |     await page.screenshot({ path: 'test-results/03-auth-result.png' });
  103 |     
  104 |     console.log('Auth form tested!');
  105 |   });
  106 | 
  107 |   // TEST 4: Loan Application Form
  108 |   test('Loan application form', async ({ page }) => {
  109 |     console.log('Testing Loan Application...');
  110 |     
  111 |     await page.goto(BASE_URL + '/loan');
  112 |     await page.waitForLoadState('networkidle');
  113 |     
  114 |     await page.screenshot({ path: 'test-results/04-loan-initial.png', fullPage: true });
  115 |     
  116 |     // Check for loan amount field
  117 |     const amountField = page.locator('input').first();
  118 |     await expect(amountField).toBeVisible();
  119 |     await amountField.fill('500000');
  120 |     console.log('Amount filled');
  121 |     
  122 |     await page.screenshot({ path: 'test-results/04-loan-filled.png' });
  123 |     
  124 |     console.log('Loan form tested!');
  125 |   });
  126 | 
  127 |   // TEST 5: Navigation Menu
  128 |   test('Navigation menu works', async ({ page }) => {
  129 |     console.log('Testing Navigation...');
  130 |     
  131 |     const navItems = [
  132 |       { name: 'Services', url: '/services' },
  133 |       { name: 'About', url: '/about' },
  134 |       { name: 'Contact', url: '/contact' }
  135 |     ];
  136 |     
  137 |     for (const item of navItems) {
  138 |       await page.goto(BASE_URL);
```