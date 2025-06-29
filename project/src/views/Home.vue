<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="glass-card max-w-2xl w-full text-center">
      <h1 
        data-testid="トップページ-タイトル" 
        class="text-4xl font-bold text-heading mb-6"
      >
        Juna Supabase
      </h1>
      
      <p class="text-text-muted text-lg mb-8">
        ブログプラットフォームへようこそ
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          data-testid="トップページ-ログインボタン"
          @click="navigateToLogin"
          class="btn btn-primary"
        >
          ログイン
        </button>
        
        <button 
          data-testid="トップページ-登録ボタン"
          @click="navigateToRegister"
          class="btn btn-outline-primary"
        >
          新規登録
        </button>
      </div>
      
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-card">
          <h3 class="text-heading font-semibold mb-2">記事を投稿</h3>
          <p class="text-text-muted text-sm">
            あなたの考えやアイデアを共有しましょう
          </p>
        </div>
        
        <div class="glass-card">
          <h3 class="text-heading font-semibold mb-2">コメント機能</h3>
          <p class="text-text-muted text-sm">
            他のユーザーと活発な議論を楽しめます
          </p>
        </div>
        
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
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToLogin = () => {
  router.push('/login')
}

const navigateToRegister = () => {
  router.push('/register')
}
</script>
