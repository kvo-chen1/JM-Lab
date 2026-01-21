import { test, expect } from '@playwright/test';

test.describe('Community Interaction Flow', () => {
  test('should allow user to view and like a post', async ({ page }) => {
    // 1. Go to Community Page (assuming public access or mock auth)
    await page.goto('/community');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    // 2. Find the first post's like button
    const firstPost = page.locator('[data-testid="post-card"]').first();
    const likeButton = firstPost.locator('[data-testid="like-button"]');
    const likeCount = firstPost.locator('[data-testid="like-count"]');

    // Get initial count
    const initialCountText = await likeCount.innerText();
    const initialCount = parseInt(initialCountText || '0', 10);

    // 3. Click Like
    await likeButton.click();

    // 4. Verify optimistic update (count should increase immediately)
    await expect(likeCount).toHaveText(String(initialCount + 1));
    
    // Check if the button state changed (e.g., color change or class)
    // This depends on implementation details, but we can check if it has 'text-red-500' or similar if implemented
    // await expect(likeButton).toHaveClass(/text-red-500/);

    // 5. Verify persistence (optional, if we reload)
    // await page.reload();
    // await expect(likeCount).toHaveText(String(initialCount + 1));
  });

  test('should show error toast when network fails', async ({ page }) => {
    // Mock network failure for likes
    await page.route('**/rest/v1/likes*', route => route.abort('failed'));

    await page.goto('/community');
    await page.waitForSelector('[data-testid="post-card"]');

    const likeButton = page.locator('[data-testid="post-card"]').first().locator('[data-testid="like-button"]');
    
    // Click like
    await likeButton.click();

    // Expect error toast
    // Assuming Toaster uses sonner which renders standardized toasts
    const toast = page.locator('[data-sonner-toast]'); 
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('操作失败');
  });
});
