import { test, expect } from '@playwright/test'

test.describe('投稿作成ユニット', () => {
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
    
    await page.getByTestId('ログイン-識別子入力').type('yamada', { delay: 0 })
    await page.getByTestId('ログイン-パスワード入力').type('password', { delay: 0 })
    await page.getByTestId('ログイン-送信ボタン').click()
    
    await page.waitForFunction(() => {
      return window.location.pathname === '/posts'
    }, undefined, { timeout: 10000 })
    
    await page.goto('/posts/create')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('投稿作成フォームが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="投稿作成-フォーム"]')
      return form !== null
    }, undefined, { timeout: 5000 })

    const form = page.getByTestId('投稿作成-フォーム')
    await expect(form).toHaveText(/.+/, { timeout: 3000 })

    const titleInput = page.getByTestId('投稿作成-タイトル入力')
    await expect(titleInput).toBeVisible({ timeout: 3000 })

    const contentInput = page.getByTestId('投稿作成-内容入力')
    await expect(contentInput).toBeVisible({ timeout: 3000 })
  })

  test('新しい投稿を作成できる', async ({ page }) => {
    await page.waitForFunction(() => {
      const titleInput = document.querySelector('[data-testid="投稿作成-タイトル入力"]')
      return titleInput && !titleInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('投稿作成-タイトル入力').type('テスト投稿タイトル', { delay: 0 })
    await page.getByTestId('投稿作成-内容入力').type('これはテスト投稿の内容です。', { delay: 0 })

    await page.getByTestId('投稿作成-送信ボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname.includes('/posts/') && !window.location.pathname.includes('/create')
    }, undefined, { timeout: 10000 })

    expect(page.url()).toMatch(/\/posts\/[a-f0-9-]+$/)
  })
})
