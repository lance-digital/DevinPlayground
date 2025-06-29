import { test, expect } from '@playwright/test'

test.describe('ナビゲーションユニット', () => {
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

  test('ナビゲーションが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const nav = document.querySelector('[data-testid="ナビゲーション-メニュー"]')
      return nav !== null
    }, undefined, { timeout: 5000 })

    const navigation = page.getByTestId('ナビゲーション-メニュー')
    await expect(navigation).toHaveText(/.+/, { timeout: 3000 })

    const homeLink = page.getByTestId('ナビゲーション-ホームリンク')
    await expect(homeLink).toHaveText(/.+/, { timeout: 3000 })
  })

  test('ホームリンクをクリックするとトップページに遷移する', async ({ page }) => {
    await page.waitForFunction(() => {
      const link = document.querySelector('[data-testid="ナビゲーション-ホームリンク"]')
      return link && !link.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('ナビゲーション-ホームリンク').click()

    await page.waitForFunction(() => {
      return window.location.pathname === '/'
    }, undefined, { timeout: 5000 })

    expect(page.url()).toContain('/')
  })
})
