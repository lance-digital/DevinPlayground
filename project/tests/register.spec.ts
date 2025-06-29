import { test, expect } from '@playwright/test'

test.describe('ユーザー登録ユニット', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[Console ${msg.type()}]:`, msg.text())
    })

    page.on('response', (response) => {
      if (response.status() >= 300) {
        console.log(`[HTTP Error] ${response.status()}: ${response.url()}`)
      }
    })

    await page.goto('/register')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('登録フォームが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="ユーザー登録-フォーム"]')
      return form !== null
    }, undefined, { timeout: 5000 })

    const form = page.getByTestId('ユーザー登録-フォーム')
    await expect(form).toHaveText(/.+/, { timeout: 3000 })

    const emailInput = page.getByTestId('ユーザー登録-メールアドレス入力')
    await expect(emailInput).toBeVisible({ timeout: 3000 })

    const passwordInput = page.getByTestId('ユーザー登録-パスワード入力')
    await expect(passwordInput).toBeVisible({ timeout: 3000 })

    const nicknameInput = page.getByTestId('ユーザー登録-ニックネーム入力')
    await expect(nicknameInput).toBeVisible({ timeout: 3000 })

    const submitButton = page.getByTestId('ユーザー登録-送信ボタン')
    await expect(submitButton).toHaveText(/.+/, { timeout: 3000 })
  })

  test('有効な情報で登録を試行するとネットワークエラーが表示される', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `test${timestamp}@example.com`
    const testPassword = 'password123'
    const testNickname = `テストユーザー${timestamp}`

    await page.waitForFunction(() => {
      const emailInput = document.querySelector('[data-testid="ユーザー登録-メールアドレス入力"]')
      return emailInput && !emailInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('ユーザー登録-メールアドレス入力').type(testEmail, { delay: 0 })
    await page.getByTestId('ユーザー登録-パスワード入力').type(testPassword, { delay: 0 })
    await page.getByTestId('ユーザー登録-ニックネーム入力').type(testNickname, { delay: 0 })

    await page.getByTestId('ユーザー登録-送信ボタン').click()

    await page.waitForFunction(() => {
      const errorMessage = document.querySelector('[data-testid="ユーザー登録-エラーメッセージ"]')
      return errorMessage !== null
    }, undefined, { timeout: 10000 })

    const errorMessage = page.getByTestId('ユーザー登録-エラーメッセージ')
    await expect(errorMessage).toHaveText(/.+/, { timeout: 3000 })
  })

  test('無効な情報でエラーメッセージが表示される', async ({ page }) => {
    await page.reload()
    await page.waitForFunction(() => document.readyState === 'complete')
    
    await page.waitForFunction(() => {
      const emailInput = document.querySelector('[data-testid="ユーザー登録-メールアドレス入力"]')
      return emailInput && !emailInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('ユーザー登録-メールアドレス入力').fill('test@example.com')
    await page.getByTestId('ユーザー登録-パスワード入力').fill('12345')
    await page.getByTestId('ユーザー登録-ニックネーム入力').fill('テストユーザー')

    await page.getByTestId('ユーザー登録-送信ボタン').click()

    await page.waitForFunction(() => {
      const errorMessage = document.querySelector('[data-testid="ユーザー登録-エラーメッセージ"]')
      return errorMessage !== null
    }, undefined, { timeout: 5000 })

    const errorMessage = page.getByTestId('ユーザー登録-エラーメッセージ')
    await expect(errorMessage).toHaveText(/.+/, { timeout: 3000 })
  })
})
