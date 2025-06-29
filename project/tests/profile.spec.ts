import { test, expect } from '@playwright/test'

test.describe('プロフィール管理ユニット', () => {
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
    
    await page.goto('/profile')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('プロフィール情報が正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const profile = document.querySelector('[data-testid="プロフィール管理-プロフィール表示"]')
      return profile !== null
    }, undefined, { timeout: 5000 })

    const profile = page.getByTestId('プロフィール管理-プロフィール表示')
    await expect(profile).toHaveText(/.+/, { timeout: 3000 })

    const nickname = page.getByTestId('プロフィール管理-ニックネーム表示')
    await expect(nickname).toHaveText(/.+/, { timeout: 3000 })

    const accountId = page.getByTestId('プロフィール管理-アカウントID表示')
    await expect(accountId).toHaveText(/.+/, { timeout: 3000 })
  })

  test('プロフィール編集フォームが表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const editButton = document.querySelector('[data-testid="プロフィール管理-編集ボタン"]')
      return editButton && !editButton.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('プロフィール管理-編集ボタン').click()

    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="プロフィール管理-編集フォーム"]')
      return form !== null
    }, undefined, { timeout: 5000 })

    const form = page.getByTestId('プロフィール管理-編集フォーム')
    await expect(form).toHaveText(/.+/, { timeout: 3000 })
  })
})
