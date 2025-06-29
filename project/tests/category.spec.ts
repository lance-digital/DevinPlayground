import { test, expect } from '@playwright/test'

test.describe('カテゴリ管理ユニット', () => {
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

    await page.goto('/categories')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('カテゴリ管理ページが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const title = document.querySelector('[data-testid="カテゴリ管理-タイトル"]')
      return title !== null
    }, undefined, { timeout: 5000 })

    const title = page.getByTestId('カテゴリ管理-タイトル')
    await expect(title).toHaveText(/カテゴリ管理/, { timeout: 3000 })

    const createForm = page.getByTestId('カテゴリ管理-作成フォーム')
    await expect(createForm).toBeVisible({ timeout: 3000 })

    const nameInput = page.getByTestId('カテゴリ管理-名前入力')
    await expect(nameInput).toBeVisible({ timeout: 3000 })

  })

  test('新しいカテゴリを作成できる', async ({ page }) => {
    await page.waitForFunction(() => {
      const nameInput = document.querySelector('[data-testid="カテゴリ管理-名前入力"]')
      return nameInput && !nameInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    const testCategoryName = `テストカテゴリ_${Date.now()}`
    
    await page.getByTestId('カテゴリ管理-名前入力').type(testCategoryName, { delay: 0 })
    await page.getByTestId('カテゴリ管理-作成ボタン').click()

    await page.waitForFunction((categoryName) => {
      const categoryList = document.querySelector('[data-testid="カテゴリ管理-リスト"]')
      return categoryList && categoryList.textContent && categoryList.textContent.includes(categoryName)
    }, testCategoryName, { timeout: 10000 })

    const categoryList = page.getByTestId('カテゴリ管理-リスト')
    await expect(categoryList).toHaveText(new RegExp(testCategoryName), { timeout: 3000 })
  })

  test('カテゴリ一覧が正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const categoryList = document.querySelector('[data-testid="カテゴリ管理-リスト"]')
      const loadingElements = document.querySelectorAll('div')
      let hasLoadingText = false
      for (let i = 0; i < loadingElements.length; i++) {
        if (loadingElements[i].textContent && loadingElements[i].textContent!.includes('読み込み中')) {
          hasLoadingText = true
          break
        }
      }
      return categoryList !== null && !hasLoadingText
    }, undefined, { timeout: 10000 })

    const categoryList = page.getByTestId('カテゴリ管理-リスト')
    await expect(categoryList).toBeVisible({ timeout: 3000 })
  })

  test('カテゴリ作成時のバリデーションが機能する', async ({ page }) => {
    await page.waitForFunction(() => {
      const createButton = document.querySelector('[data-testid="カテゴリ管理-作成ボタン"]')
      return createButton !== null
    }, undefined, { timeout: 5000 })

    const createButton = page.getByTestId('カテゴリ管理-作成ボタン')
    await expect(createButton).toBeDisabled({ timeout: 3000 })

    await page.getByTestId('カテゴリ管理-名前入力').type('テスト', { delay: 0 })
    await expect(createButton).toBeEnabled({ timeout: 3000 })
  })
})
