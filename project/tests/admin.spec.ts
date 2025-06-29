import { test, expect } from '@playwright/test'

test.describe('管理者ダッシュボードユニット', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[Console ${msg.type()}]:`, msg.text())
    })

    page.on('response', (response) => {
      if (response.status() >= 300) {
        console.log(`[HTTP Error] ${response.status()}: ${response.url()}`)
      }
    })

    await page.goto('/login')
    await page.waitForFunction(() => document.readyState === 'complete')
    
    await page.getByTestId('ログイン-識別子入力').type('admin', { delay: 0 })
    await page.getByTestId('ログイン-パスワード入力').type('SecureAdminPass2024!', { delay: 0 })
    await page.getByTestId('ログイン-送信ボタン').click()
    
    await page.waitForFunction(() => {
      return window.location.pathname === '/posts'
    }, undefined, { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForFunction(() => document.readyState === 'complete')
    
    await page.waitForFunction(() => {
      return window.location.pathname === '/admin' || window.location.pathname === '/posts'
    }, undefined, { timeout: 10000 })
    
    if (await page.evaluate(() => window.location.pathname === '/posts')) {
      await page.goto('/admin')
      await page.waitForFunction(() => document.readyState === 'complete')
      
      await page.waitForFunction(() => {
        return window.location.pathname === '/admin'
      }, undefined, { timeout: 10000 })
    }
  })

  test('管理者ダッシュボードが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const dashboard = document.querySelector('[data-testid="管理者ダッシュボード-メイン"]')
      return dashboard !== null
    }, undefined, { timeout: 5000 })

    const dashboard = page.getByTestId('管理者ダッシュボード-メイン')
    await expect(dashboard).toHaveText(/.+/, { timeout: 3000 })

    const title = page.getByTestId('管理者ダッシュボード-タイトル')
    await expect(title).toHaveText(/.+/, { timeout: 3000 })
  })

  test('統計情報が表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const stats = document.querySelector('[data-testid="管理者ダッシュボード-統計"]')
      return stats !== null
    }, undefined, { timeout: 5000 })

    const stats = page.getByTestId('管理者ダッシュボード-統計')
    await expect(stats).toHaveText(/.+/, { timeout: 3000 })

    const userCount = page.getByTestId('管理者ダッシュボード-ユーザー数')
    await expect(userCount).toHaveText(/.+/, { timeout: 3000 })

    const postCount = page.getByTestId('管理者ダッシュボード-投稿数')
    await expect(postCount).toHaveText(/.+/, { timeout: 3000 })
  })
})
