<!-- トップページコンポーネント - アプリケーションのメインランディングページ -->
<template>
  <!-- 全画面高さの背景コンテナ、中央配置とパディング設定 -->
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <!-- メインコンテンツカード、最大幅設定とガラス効果 -->
    <div class="glass-card max-w-2xl w-full text-center">
      <!-- アプリケーションタイトル、テスト用data-testid属性付き -->
      <h1 
        data-testid="トップページ-タイトル" 
        class="text-4xl font-bold text-heading mb-6"
      >
        Juna Supabase
      </h1>
      
      <!-- サブタイトル、ユーザーへの歓迎メッセージ -->
      <p class="text-text-muted text-lg mb-8">
        ブログプラットフォームへようこそ
      </p>
      
      <!-- ボタンコンテナ、レスポンシブレイアウト対応 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <!-- ログインボタン、プライマリスタイル適用 -->
        <button 
          data-testid="トップページ-ログインボタン"
          @click="navigateToLogin"
          class="btn btn-primary"
        >
          ログイン
        </button>
        
        <!-- 新規登録ボタン、アウトラインスタイル適用 -->
        <button 
          data-testid="トップページ-登録ボタン"
          @click="navigateToRegister"
          class="btn btn-outline-primary"
        >
          新規登録
        </button>
      </div>
      
      <!-- 機能紹介セクション、グリッドレイアウト使用 -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 記事投稿機能の説明カード -->
        <div class="glass-card">
          <h3 class="text-heading font-semibold mb-2">記事を投稿</h3>
          <p class="text-text-muted text-sm">
            あなたの考えやアイデアを共有しましょう
          </p>
        </div>
        
        <!-- コメント機能の説明カード -->
        <div class="glass-card">
          <h3 class="text-heading font-semibold mb-2">コメント機能</h3>
          <p class="text-text-muted text-sm">
            他のユーザーと活発な議論を楽しめます
          </p>
        </div>
        
        <!-- カテゴリ管理機能の説明カード -->
        <div class="glass-card">
          <h3 class="text-heading font-semibold mb-2">カテゴリ管理</h3>
          <p class="text-text-muted text-sm">
            記事を整理して見つけやすくします
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue RouterのuseRouter関数をインポート
import { useRouter } from 'vue-router'

// ルーターインスタンスを取得
const router = useRouter()

// ログインページへの遷移処理
const navigateToLogin = () => {
  router.push('/login')
}

// 新規登録ページへの遷移処理
const navigateToRegister = () => {
  router.push('/register')
}
</script>
