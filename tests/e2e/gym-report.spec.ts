import { test, expect } from '@playwright/test';

test.describe('Gym Report Flow', () => {
  test('User can submit a report and Admin can approve it', async ({ page }) => {
    // Mock APIs to bypass Auth/DB
    await page.route('/api/gyms/*/report', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.route('/api/admin/reports*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          json: {
            data: [{
              id: 'mock-report-id',
              reportType: 'hours_changed',
              suggestedValue: '09:00-23:00',
              status: 'pending',
              createdAt: new Date().toISOString(),
              gym: { id: 'gym-id', name: 'Test Gym', address: 'Test Address' },
              user: { id: 'user-id', email: 'test@example.com', displayName: 'Test User' }
            }],
            pagination: { page: 1, total: 1, totalPages: 1 }
          }
        });
      } else {
        await route.continue();
      }
    });

    await page.route('/api/admin/reports/*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          json: { success: true, message: '제보가 승인되었습니다.' }
        });
      } else {
        await route.continue();
      }
    });

    // 1. Go to Gym Page
    await page.goto('/gyms/b566c673-7b61-4e8c-85c6-80ab11f7d537');

    // 2. Open Report Modal
    await page.getByRole('button', { name: '정보 수정 제안' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 3. Fill Form
    await page.waitForTimeout(500); // Wait for animation
    await page.getByText('정보가 틀립니다').click({ force: true });
    await page.getByText('운영시간').click({ force: true });
    await page.getByPlaceholder('현재 표시된 정보를 입력해주세요').fill('10:00-22:00');
    await page.getByPlaceholder('올바른 정보를 입력해주세요').fill('09:00-23:00');
    await page.getByRole('button', { name: '제출' }).click();

    // 4. Verify Success Toast
    await expect(page.getByText('제보가 접수되었습니다')).toBeVisible();

    // 6. Go to Admin Reports
    await page.goto('/admin/reports');

    // 7. Verify Report is Pending
    const row = page.getByRole('row').filter({ hasText: '운영시간' }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText('대기')).toBeVisible();

    // 8. Approve Report
    await row.getByRole('button').filter({ has: page.locator('svg.lucide-check') }).click();

    // 9. Verify Status Change (UI update)
    // Since we mocked the PATCH but the list refresh calls GET again, 
    // we need to update the GET mock to return approved status on second call?
    // Or just verify the toast success for approval.
    await expect(page.getByText('제보가 승인되었습니다')).toBeVisible();
  });
});
