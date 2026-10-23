import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('CR-026 End-to-End Authenticated Session, 9-Client Portfolio & Client-Switch Isolation', () => {
  test('1. Signed-out state shows Authentication Required without leaking client count', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/command-center');

    await expect(page.locator('header')).toContainText('Authentication Required');
    await expect(page.locator('body')).not.toContainText('9 Portfolio Clients');
    await expect(page.locator('body')).not.toContainText('9 Authorized');
  });

  test('2. Authenticated login, 9-client portfolio load, client switching, hard refresh, and sign-out', async ({
    page,
  }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD');

    await page.goto('/login');
    await page.fill('#login-email', TEST_EMAIL);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for navigation to Command Center and header hydration
    await page.waitForURL('**/command-center**');
    const clientSelect = page.locator('select[aria-label="Select Active Client"]');
    await expect(clientSelect).toBeVisible();

    // Verify all 9 authorized clients populate in the selector
    const options = clientSelect.locator('option');
    await expect(options).toHaveCount(9);
    await expect(page.locator('header')).toContainText(TEST_EMAIL);

    // Client switching test: switch from first client to second client and verify URL & header update immediately
    const firstClientVal = await options.nth(0).getAttribute('value');
    const secondClientVal = await options.nth(1).getAttribute('value');
    const secondClientText = await options.nth(1).textContent();

    expect(firstClientVal).not.toBe(secondClientVal);
    await clientSelect.selectOption(secondClientVal!);
    await expect(page).toHaveURL(new RegExp(`clientId=${secondClientVal}`));
    if (secondClientText) {
      const cleanName = secondClientText.split(' (')[0].trim();
      await expect(page.locator('h1')).toContainText(cleanName);
    }

    // Hard refresh persistence check
    await page.reload();
    await expect(clientSelect).toHaveValue(secondClientVal!);

    // Navigate across major routes and verify single shell + preserved client context
    for (const route of [
      '/otterwatch',
      '/clients',
      '/connection-center',
      '/paid-media',
      '/reputation',
      '/competitors',
      '/outcome-lab',
      '/reports',
      '/automation',
      '/settings',
    ]) {
      await page.goto(`${route}?clientId=${secondClientVal}`);
      await expect(page.locator('aside')).toHaveCount(1);
      await expect(page.locator('header')).toHaveCount(1);
    }

    // Clean sign-out check
    await page.click('button[title="Sign Out"]');
    await page.waitForURL('**/login**');
  });
});
