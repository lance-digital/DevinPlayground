import { test, expect } from '@playwright/test'

test.describe('トップページユニット', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[Console ${msg.type()}]:`, msg.text())
    })

    page.on('response', (response) => {
      if (response.status() >= 300) {
        console.log(`[HTTP Error] ${response.status()}: ${response.url()}`)
      }
    })

    await page.goto('/')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('未認証ユーザーがトップページを表示できる', async ({ page }) => {
    await page.waitForFunction(() => {
      const title = document.querySelector('[data-testid="トップページ-タイトル"]')
      return title && title.textContent && title.textContent.trim().length > 0
    }, undefined, { timeout: 5000 })

    const title = page.getByTestId('トップページ-タイトル')
    await expect(title).toHaveText(/.+/, { timeout: 3000 })

    const loginButton = page.getByTestId('トップページ-ログインボタン')
    await expect(loginButton).toHaveText(/.+/, { timeout: 3000 })

    const registerButton = page.getByTestId('トップページ-登録ボタン')
    await expect(registerButton).toHaveText(/.+/, { timeout: 3000 })
  })

  test('ログインボタンをクリックするとログインページに遷移する', async ({ page }) => {
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="トップページ-ログインボタン"]')
      return button && !button.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('トップページ-ログインボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname === '/login'
    }, undefined, { timeout: 5000 })

    expect(page.url()).toContain('/login')
  })

  test('登録ボタンをクリックすると登録ページに遷移する', async ({ page }) => {
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="トップページ-登録ボタン"]')
      return button && !button.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('トップページ-登録ボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname === '/register'
    }, undefined, { timeout: 5000 })

    expect(page.url()).toContain('/register')
  })
})
