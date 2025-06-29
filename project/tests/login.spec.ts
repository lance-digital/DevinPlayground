import { test, expect } from '@playwright/test'

test.describe('ログインユニット', () => {
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
  })

  test('ログインフォームが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="ログイン-フォーム"]')
      return form !== null
    }, undefined, { timeout: 5000 })

    const form = page.getByTestId('ログイン-フォーム')
    await expect(form).toHaveText(/.+/, { timeout: 3000 })

    const identifierInput = page.getByTestId('ログイン-識別子入力')
    await expect(identifierInput).toBeVisible({ timeout: 3000 })

    const passwordInput = page.getByTestId('ログイン-パスワード入力')
    await expect(passwordInput).toBeVisible({ timeout: 3000 })

    const submitButton = page.getByTestId('ログイン-送信ボタン')
    await expect(submitButton).toHaveText(/.+/, { timeout: 3000 })
  })

  test('有効な認証情報でログインすると投稿一覧ページに遷移する', async ({ page }) => {
    await page.waitForFunction(() => {
      const identifierInput = document.querySelector('[data-testid="ログイン-識別子入力"]')
      return identifierInput && !identifierInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('ログイン-識別子入力').type('yamada', { delay: 0 })
    await page.getByTestId('ログイン-パスワード入力').type('password', { delay: 0 })

    await page.getByTestId('ログイン-送信ボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname === '/posts'
    }, undefined, { timeout: 10000 })

    await page.waitForFunction(() => {
      const title = document.querySelector('[data-testid="投稿一覧-タイトル"]')
      return title !== null
    }, undefined, { timeout: 5000 })

    const title = page.getByTestId('投稿一覧-タイトル')
    await expect(title).toHaveText(/.+/, { timeout: 3000 })
  })

  test('無効な情報でエラーメッセージが表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const identifierInput = document.querySelector('[data-testid="ログイン-識別子入力"]')
      return identifierInput && !identifierInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('ログイン-識別子入力').type('invalid@example.com', { delay: 0 })
    await page.getByTestId('ログイン-パスワード入力').type('wrongpassword', { delay: 0 })

    await page.getByTestId('ログイン-送信ボタン').click()

    await page.waitForFunction(() => {
      const errorMessage = document.querySelector('[data-testid="ログイン-エラーメッセージ"]')
      return errorMessage !== null
    }, undefined, { timeout: 5000 })

    const errorMessage = page.getByTestId('ログイン-エラーメッセージ')
    await expect(errorMessage).toHaveText(/.+/, { timeout: 3000 })
  })
})
