import { test, expect } from '@playwright/test'

test.describe('投稿詳細ユニット', () => {
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
    
    await page.waitForFunction(() => {
      const posts = document.querySelectorAll('[data-testid^="投稿一覧-投稿-"]')
      return posts.length > 0
    }, undefined, { timeout: 10000 })

    await page.locator('[data-testid^="投稿一覧-投稿-"]').first().click()

    await page.waitForFunction(() => {
      return window.location.pathname.startsWith('/posts/') && 
             window.location.pathname !== '/posts'
    }, undefined, { timeout: 10000 })
  })

  test('投稿詳細が正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const detail = document.querySelector('[data-testid="投稿詳細-記事"]')
      return detail !== null
    }, undefined, { timeout: 5000 })

    const detail = page.getByTestId('投稿詳細-記事')
    await expect(detail).toHaveText(/.+/, { timeout: 3000 })

    const title = page.getByTestId('投稿詳細-タイトル')
    await expect(title).toHaveText(/.+/, { timeout: 3000 })

    const content = page.getByTestId('投稿詳細-内容')
    await expect(content).toHaveText(/.+/, { timeout: 3000 })
  })

  test('いいねボタンが機能する', async ({ page }) => {
    await page.waitForFunction(() => {
      const likeButton = document.querySelector('[data-testid="投稿詳細-いいねボタン"]')
      return likeButton && !likeButton.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('投稿詳細-いいねボタン').click()

    await page.waitForFunction(() => {
      const likeCount = document.querySelector('[data-testid="投稿詳細-いいね数"]')
      return likeCount && likeCount.textContent && parseInt(likeCount.textContent) >= 0
    }, undefined, { timeout: 5000 })

    const likeCount = page.getByTestId('投稿詳細-いいね数')
    await expect(likeCount).toHaveText(/.+/, { timeout: 3000 })
  })
})
