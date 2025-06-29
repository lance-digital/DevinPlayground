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
        
        <!-- 右側：ナビゲーションメニューエリア -->
        <div class="flex items-center space-x-4">
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
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
// 認証状態管理用のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Vue Routerのルーター機能をインポート
import { useRouter } from 'vue-router'

// 認証関連の状態と関数を取得
const { isAuthenticated, isAdmin, loading, logout } = useAuth()
// ルーター機能を取得
const router = useRouter()

// ログアウト処理を実行する関数
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
</script>
