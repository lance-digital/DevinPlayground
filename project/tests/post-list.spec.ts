import { test, expect } from '@playwright/test'

test.describe('投稿一覧ユニット', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[Console ${msg.type()}]:`, msg.text())
    })

    page.on('response', (response) => {
      if (response.status() >= 300) {
        console.log(`[HTTP Error] ${response.status()}: ${response.url()}`)
      }
    })

    await page.goto('/posts')
    await page.waitForFunction(() => document.readyState === 'complete')
  })

  test('投稿一覧が正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const postList = document.querySelector('[data-testid="投稿一覧-リスト"]')
      return postList !== null
    }, undefined, { timeout: 5000 })

    const postList = page.getByTestId('投稿一覧-リスト')
    await expect(postList).toHaveText(/.+/, { timeout: 3000 })

    const title = page.getByTestId('投稿一覧-タイトル')
    await expect(title).toHaveText(/.+/, { timeout: 3000 })
  })

  test('投稿作成ボタンが表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const createButton = document.querySelector('[data-testid="投稿一覧-作成ボタン"]')
      return createButton !== null
    }, undefined, { timeout: 5000 })

    const createButton = page.getByTestId('投稿一覧-作成ボタン')
    await expect(createButton).toHaveText(/.+/, { timeout: 3000 })
  })

  test('投稿作成ボタンをクリックすると投稿作成ページに遷移する', async ({ page }) => {
    await page.waitForFunction(() => {
      const createButton = document.querySelector('[data-testid="投稿一覧-作成ボタン"]')
      return createButton && !createButton.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('投稿一覧-作成ボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname === '/posts/create'
    }, undefined, { timeout: 5000 })

    expect(page.url()).toContain('/posts/create')
  })
})
