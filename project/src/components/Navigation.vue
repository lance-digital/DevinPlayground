<template>
  <!-- ナビゲーションバーのメインコンテナ -->
  <nav 
    data-testid="ナビゲーション-メニュー"
    class="bg-surface border-b border-border-light"
  >
    <!-- ナビゲーションの最大幅とパディングを設定するコンテナ -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ナビゲーション要素を左右に配置するフレックスコンテナ -->
      <div class="flex justify-between h-16">
        <!-- 左側：ロゴ・ブランド名エリア -->
        <div class="flex items-center">
          <!-- ホームページへのリンク（ブランドロゴ） -->
          <router-link 
            data-testid="ナビゲーション-ホームリンク"
            to="/" 
            class="text-heading font-bold text-xl hover:text-primary transition-colors"
          >
            Juna Supabase
          </router-link>
        </div>
        
        <!-- デスクトップ版：右側ナビゲーションメニューエリア -->
        <div class="hidden md:flex items-center space-x-4">
          <!-- 未認証ユーザー向けメニュー -->
          <template v-if="!isAuthenticated">
            <!-- ログインページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-ログインリンク"
              to="/login" 
              class="btn btn-ghost"
            >
              ログイン
            </router-link>
            <!-- 新規登録ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-登録リンク"
              to="/register" 
              class="btn btn-primary"
            >
              新規登録
            </router-link>
          </template>
          
          <!-- 認証済みユーザー向けメニュー -->
          <template v-else>
            <!-- 投稿一覧ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-投稿一覧リンク"
              to="/posts" 
              class="btn btn-ghost"
            >
              投稿一覧
            </router-link>
            <!-- 投稿作成ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-投稿作成リンク"
              to="/posts/create" 
              class="btn btn-ghost"
            >
              投稿作成
            </router-link>
            <!-- カテゴリ管理ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-カテゴリリンク"
              to="/categories" 
              class="btn btn-ghost"
            >
              カテゴリ
            </router-link>
            <!-- 管理者専用：管理者ダッシュボードへのリンク -->
            <router-link 
              v-if="isAdmin"
              data-testid="ナビゲーション-管理者リンク"
              to="/admin" 
              class="btn btn-ghost"
            >
              管理者
            </router-link>
            <!-- プロフィール管理ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-プロフィールリンク"
              to="/profile" 
              class="btn btn-ghost"
            >
              プロフィール
            </router-link>
            <!-- ログアウト実行ボタン -->
            <button 
              data-testid="ナビゲーション-ログアウトボタン"
              @click="handleLogout"
              class="btn btn-outline-error"
              :disabled="loading"
            >
              ログアウト
            </button>
          </template>
        </div>

        <!-- モバイル版：ハンバーガーメニューボタン -->
        <div class="md:hidden flex items-center">
          <!-- ハンバーガーメニュー開閉ボタン -->
          <button
            data-testid="ナビゲーション-ハンバーガーボタン"
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-text hover:text-primary hover:bg-surface-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            :aria-expanded="isMobileMenuOpen"
          >
            <!-- ハンバーガーアイコン（メニューが閉じている時） -->
            <svg 
              v-if="!isMobileMenuOpen"
              class="block h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <!-- 閉じるアイコン（メニューが開いている時） -->
            <svg 
              v-else
              class="block h-6 w-6" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- モバイル版：ハンバーガーメニューの内容 -->
      <div 
        v-if="isMobileMenuOpen"
        data-testid="ナビゲーション-モバイルメニュー"
        class="md:hidden"
      >
        <!-- モバイルメニューのコンテナ -->
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-surface border-t border-border-light">
          <!-- 未認証ユーザー向けモバイルメニュー -->
          <template v-if="!isAuthenticated">
            <!-- ログインページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-ログインリンク"
              to="/login" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              ログイン
            </router-link>
            <!-- 新規登録ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-登録リンク"
              to="/register" 
              class="block px-3 py-2 rounded-md text-base font-medium text-primary hover:text-primary-dark hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              新規登録
            </router-link>
          </template>
          
          <!-- 認証済みユーザー向けモバイルメニュー -->
          <template v-else>
            <!-- 投稿一覧ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-投稿一覧リンク"
              to="/posts" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              投稿一覧
            </router-link>
            <!-- 投稿作成ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-投稿作成リンク"
              to="/posts/create" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              投稿作成
            </router-link>
            <!-- カテゴリ管理ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-カテゴリリンク"
              to="/categories" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              カテゴリ
            </router-link>
            <!-- 管理者専用：管理者ダッシュボードへのリンク -->
            <router-link 
              v-if="isAdmin"
              data-testid="ナビゲーション-モバイル-管理者リンク"
              to="/admin" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              管理者
            </router-link>
            <!-- プロフィール管理ページへのリンク -->
            <router-link 
              data-testid="ナビゲーション-モバイル-プロフィールリンク"
              to="/profile" 
              class="block px-3 py-2 rounded-md text-base font-medium text-text hover:text-primary hover:bg-surface-light transition-colors"
              @click="closeMobileMenu"
            >
              プロフィール
            </router-link>
            <!-- ログアウト実行ボタン -->
            <button 
              data-testid="ナビゲーション-モバイル-ログアウトボタン"
              @click="handleMobileLogout"
              class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-error hover:text-error-dark hover:bg-surface-light transition-colors"
              :disabled="loading"
            >
              ログアウト
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ状態管理機能をインポート
import { ref } from 'vue'
// 認証状態管理用のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Vue Routerのルーター機能をインポート
import { useRouter } from 'vue-router'

// 認証関連の状態と関数を取得
const { isAuthenticated, isAdmin, loading, logout } = useAuth()
// ルーター機能を取得
const router = useRouter()

// モバイルメニューの開閉状態を管理するリアクティブ変数
const isMobileMenuOpen = ref(false)

// モバイルメニューの開閉を切り替える関数
const toggleMobileMenu = () => {
  // 現在の状態を反転させる
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// モバイルメニューを閉じる関数
const closeMobileMenu = () => {
  // メニューを閉じた状態に設定
  isMobileMenuOpen.value = false
}

// デスクトップ版ログアウト処理を実行する関数
const handleLogout = async () => {
  try {
    // ログアウト処理を実行
    await logout()
    // ログアウト成功後、ホームページにリダイレクト
    router.push('/')
  } catch (error) {
    // ログアウト失敗時のエラーログ出力（スタック情報も含む）
    console.error('Logout failed:', error instanceof Error ? error.stack : error)
  }
}

// モバイル版ログアウト処理を実行する関数
const handleMobileLogout = async () => {
  try {
    // モバイルメニューを閉じる
    closeMobileMenu()
    // ログアウト処理を実行
    await logout()
    // ログアウト成功後、ホームページにリダイレクト
    router.push('/')
  } catch (error) {
    // ログアウト失敗時のエラーログ出力（スタック情報も含む）
    console.error('Mobile logout failed:', error instanceof Error ? error.stack : error)
  }
}
</script>
