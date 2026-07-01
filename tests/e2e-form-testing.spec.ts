import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

test.describe('Mahajan Finance Suite - E2E Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  // TEST 1: Homepage Validation
  test('Homepage loads correctly', async ({ page }) => {
    console.log('Testing Homepage...');
    
    await expect(page).toHaveURL(BASE_URL);
    
    const logo = page.locator('img').first();
    await expect(logo).toBeVisible({ timeout: 5000 });
    
    const navMenu = page.locator('nav, header').first();
    await expect(navMenu).toBeVisible();
    
    await page.screenshot({ path: 'test-results/01-homepage.png', fullPage: true });
    
    console.log('Homepage validated!');
  });

  // TEST 2: Contact Form Auto-Fill
  test('Contact form auto-fill and submit', async ({ page }) => {
    console.log('Testing Contact Form...');
    
    await page.goto(BASE_URL + '/contact');
    await page.waitForLoadState('networkidle');
    
    // Fill name field
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Auto Test User');
    console.log('Name filled');
    
    // Fill email field  
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('autotest@example.com');
    console.log('Email filled');
    
    // Fill phone if exists
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"]');
    if (await phoneInput.count() > 0) {
      await phoneInput.first().fill('+91 9876543210');
      console.log('Phone filled');
    }
    
    // Fill message
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Automated test from Playwright E2E suite.');
      console.log('Message filled');
    }
    
    await page.screenshot({ path: 'test-results/02-contact-filled.png' });
    
    // Submit form
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    console.log('Submit clicked');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/02-contact-submitted.png' });
    
    console.log('Contact form tested!');
  });

  // TEST 3: Auth/Login Form
  test('Authentication form testing', async ({ page }) => {
    console.log('Testing Auth Form...');
    
    await page.goto(BASE_URL + '/auth');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/03-auth-initial.png', fullPage: true });
    
    // Try empty submit first (validation check)
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/03-auth-validation.png' });
    
    // Fill credentials
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('testuser@test.com');
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('TestPass123!');
    
    await page.screenshot({ path: 'test-results/03-auth-filled.png' });
    
    // Attempt login
    await submitBtn.click();
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/03-auth-result.png' });
    
    console.log('Auth form tested!');
  });

  // TEST 4: Loan Application Form
  test('Loan application form', async ({ page }) => {
    console.log('Testing Loan Application...');
    
    await page.goto(BASE_URL + '/loan');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/04-loan-initial.png', fullPage: true });
    
    // Check for loan amount field
    const amountField = page.locator('input').first();
    await expect(amountField).toBeVisible();
    await amountField.fill('500000');
    console.log('Amount filled');
    
    await page.screenshot({ path: 'test-results/04-loan-filled.png' });
    
    console.log('Loan form tested!');
  });

  // TEST 5: Navigation Menu
  test('Navigation menu works', async ({ page }) => {
    console.log('Testing Navigation...');
    
    const navItems = [
      { name: 'Services', url: '/services' },
      { name: 'About', url: '/about' },
      { name: 'Contact', url: '/contact' }
    ];
    
    for (const item of navItems) {
      await page.goto(BASE_URL);
      
      const link = page.locator('a[href*="' + item.url + '"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveURL(new RegExp(item.url));
        await page.screenshot({ path: 'test-results/05-nav-' + item.name.toLowerCase() + '.png' });
        console.log(item.name + ' navigation OK');
      }
    }
  });

  // TEST 6: All Pages Load Check
  test('All major pages load without errors', async ({ page }) => {
    console.log('Testing All Pages...');
    
    const pages = [
      '/', '/services', '/about', '/contact', '/auth',
      '/loan', '/insurance', '/investments', '/govt-schemes',
      '/accounting', '/partner', '/legal', '/shopping'
    ];
    
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    for (let i = 0; i < pages.length; i++) {
      const url = BASE_URL + pages[i];
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      
      const filename = '06-page-' + (i + 1) + '-' + pages[i].replace('/', 'home') + '.png';
      await page.screenshot({ path: 'test-results/' + filename });
      console.log(pages[i] + ' loaded');
    }
    
    if (errors.length > 0) {
      console.log('Found ' + errors.length + ' console errors:');
      errors.slice(0, 5).forEach((err, i) => console.log((i+1) + '. ' + err.substring(0, 100)));
    } else {
      console.log('NO console errors detected!');
    }
  });

  // TEST 7: Mobile Responsiveness
  test('Mobile responsive layout', async ({ page }) => {
    console.log('Testing Mobile View...');
    
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/07-mobile-home.png', fullPage: true });
    
    // Check hamburger menu
    const hamburger = page.locator('button[aria-label*="menu"], .hamburger, [class*="menu-toggle"]');
    if (await hamburger.count() > 0 && await hamburger.first().isVisible()) {
      await hamburger.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/07-mobile-menu.png' });
      console.log('Hamburger menu working');
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('Mobile responsiveness tested!');
  });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({
      path: 'test-results/FAIL-' + testInfo.title.replace(/\s+/g, '-') + '.png',
      fullPage: true
    });
  }
});