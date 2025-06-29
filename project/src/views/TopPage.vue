<!-- トップページコンポーネント - ソーシャルブログのメインページ -->
<template>
  <div class="min-h-screen bg-background">
    <!-- ヒーローセクション -->
    <div class="relative overflow-hidden">
      <!-- 背景グラデーション -->
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-surface-variant/20"></div>
      
      <!-- メインコンテンツ -->
      <div class="relative container mx-auto px-4 py-16 md:py-24">
        <div class="max-w-4xl mx-auto text-center">
          <h1 
            data-testid="トップページ-タイトル" 
            class="text-5xl md:text-7xl font-bold text-heading mb-6 tracking-tight"
          >
            Juna Supabase
          </h1>
          
          <p class="text-text-muted text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
            思考を言葉に、言葉を世界に。<br>
            新しい時代のソーシャルブログプラットフォーム
          </p>
          
          <!-- ログイン状態に応じたアクションボタン -->
          <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              data-testid="トップページ-ログインボタン"
              @click="navigateToLogin"
              class="btn btn-primary text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ログイン
            </button>
            
            <button 
              data-testid="トップページ-登録ボタン"
              @click="navigateToRegister"
              class="btn btn-outline-primary text-xl px-12 py-4 rounded-full border-2 hover:shadow-lg transition-all duration-300"
            >
              新規登録
            </button>
          </div>
          
          <div v-else class="space-y-8">
            <div class="glass-card p-8 max-w-2xl mx-auto">
              <p class="text-heading text-2xl mb-8 font-medium">
                おかえりなさい、{{ profile?.nickname || 'ユーザー' }}さん
              </p>
              <div class="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  @click="navigateToCreatePost"
                  class="btn btn-primary text-xl px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="新規投稿ボタン"
                >
                  新規投稿
                </button>
                <button 
                  @click="navigateToPostList"
                  class="btn btn-outline-primary text-xl px-10 py-4 rounded-full border-2 hover:shadow-lg transition-all duration-300"
                  data-testid="投稿一覧ボタン"
                >
                  投稿一覧
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 機能紹介セクション -->
    <div class="py-20 bg-surface-variant/30">
      <div class="container mx-auto px-4">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl font-bold text-heading mb-6">プラットフォームの特徴</h2>
            <p class="text-text-muted text-xl max-w-2xl mx-auto">
              シンプルで直感的な操作で、あなたの創造性を最大限に引き出します
            </p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="group">
              <div class="glass-card p-10 text-center h-full hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/20 transition-colors duration-300">
                  <div class="w-10 h-10 bg-primary rounded-lg"></div>
                </div>
                <h3 class="text-heading font-bold mb-6 text-2xl">記事作成</h3>
                <p class="text-text-muted leading-relaxed text-lg">
                  直感的なリッチテキストエディターで、美しくフォーマットされた記事を簡単に作成できます
                </p>
              </div>
            </div>
            
            <div class="group">
              <div class="glass-card p-10 text-center h-full hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/20 transition-colors duration-300">
                  <div class="w-10 h-10 bg-primary rounded-lg"></div>
                </div>
                <h3 class="text-heading font-bold mb-6 text-2xl">コミュニティ</h3>
                <p class="text-text-muted leading-relaxed text-lg">
                  読者とのエンゲージメントを深め、建設的な対話を通じて新しいアイデアを発見しましょう
                </p>
              </div>
            </div>
            
            <div class="group">
              <div class="glass-card p-10 text-center h-full hover:shadow-2xl transition-all duration-500 group-hover:scale-105">
                <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/20 transition-colors duration-300">
                  <div class="w-10 h-10 bg-primary rounded-lg"></div>
                </div>
                <h3 class="text-heading font-bold mb-6 text-2xl">整理機能</h3>
                <p class="text-text-muted leading-relaxed text-lg">
                  カテゴリとタグで記事を体系的に整理し、読者が求めるコンテンツへ導きます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA セクション -->
    <div class="py-20">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto text-center">
          <div class="glass-card p-12">
            <h2 class="text-4xl font-bold text-heading mb-6">
              今すぐ始めましょう
            </h2>
            <p class="text-text-muted text-xl mb-10 max-w-2xl mx-auto">
              あなたの声を世界に届ける準備はできていますか？
            </p>
            
            <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                @click="navigateToRegister"
                class="btn btn-primary text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                無料で始める
              </button>
              <button 
                @click="navigateToPostList"
                class="btn btn-outline-primary text-xl px-12 py-4 rounded-full border-2 hover:shadow-lg transition-all duration-300"
              >
                記事を読む
              </button>
            </div>
            
            <div v-else>
              <button 
                @click="navigateToCreatePost"
                class="btn btn-primary text-xl px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                記事を書く
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isAuthenticated, profile, initAuth } = useAuth()

// ナビゲーション関数
const navigateToLogin = () => {
  router.push('/login')
}

const navigateToRegister = () => {
  router.push('/register')
}

const navigateToCreatePost = () => {
  router.push('/posts/create')
}

const navigateToPostList = () => {
  router.push('/posts')
}

onMounted(async () => {
  await initAuth()
})
</script>
