import { test, expect } from '@playwright/test'

test.describe('コメント管理ユニット', () => {
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
    
    await page.waitForFunction(() => {
      const titleInput = document.querySelector('[data-testid="投稿作成-タイトル入力"]')
      return titleInput && !titleInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('投稿作成-タイトル入力').type('コメントテスト用投稿', { delay: 0 })
    await page.getByTestId('投稿作成-内容入力').type('この投稿はコメント機能のテスト用です。', { delay: 0 })
    await page.getByTestId('投稿作成-送信ボタン').click()

    await page.waitForFunction(() => {
      return window.location.pathname.includes('/posts/') && !window.location.pathname.includes('/create')
    }, undefined, { timeout: 10000 })
  })

  test('コメント投稿フォームが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const form = document.querySelector('[data-testid="コメント管理-新規フォーム"]')
      return form !== null
    }, undefined, { timeout: 5000 })

    const form = page.getByTestId('コメント管理-新規フォーム')
    await expect(form).toHaveText(/.+/, { timeout: 3000 })

    const commentInput = page.getByTestId('コメント管理-新規入力')
    await expect(commentInput).toBeVisible({ timeout: 3000 })

    const submitButton = page.getByTestId('コメント管理-新規送信ボタン')
    await expect(submitButton).toBeVisible({ timeout: 3000 })
  })

  test('新しいコメントを投稿できる', async ({ page }) => {
    await page.waitForFunction(() => {
      const commentInput = document.querySelector('[data-testid="コメント管理-新規入力"]')
      return commentInput && !commentInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('コメント管理-新規入力').type('これはテストコメントです。', { delay: 0 })
    await page.getByTestId('コメント管理-新規送信ボタン').click()

    await page.waitForFunction(() => {
      const commentsList = document.querySelector('[data-testid="コメント管理-リスト"]')
      return commentsList && commentsList.textContent && commentsList.textContent.includes('これはテストコメントです。')
    }, undefined, { timeout: 10000 })

    const commentsList = page.getByTestId('コメント管理-リスト')
    await expect(commentsList).toHaveText(/これはテストコメントです。/, { timeout: 3000 })
  })

  test('コメントリストが正しく表示される', async ({ page }) => {
    await page.waitForFunction(() => {
      const commentInput = document.querySelector('[data-testid="コメント管理-新規入力"]')
      return commentInput && !commentInput.hasAttribute('disabled')
    }, undefined, { timeout: 5000 })

    await page.getByTestId('コメント管理-新規入力').type('表示テスト用コメント', { delay: 0 })
    await page.getByTestId('コメント管理-新規送信ボタン').click()

    await page.waitForFunction(() => {
      const commentsList = document.querySelector('[data-testid="コメント管理-リスト"]')
      return commentsList && commentsList.children.length > 0
    }, undefined, { timeout: 10000 })

    const commentsList = page.getByTestId('コメント管理-リスト')
    await expect(commentsList).toBeVisible({ timeout: 3000 })
    await expect(commentsList).toHaveText(/表示テスト用コメント/, { timeout: 3000 })
  })
})
