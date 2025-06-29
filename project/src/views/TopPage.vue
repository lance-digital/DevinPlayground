<!-- トップページコンポーネント - ソーシャルブログのメインページ -->
<template>
  <div class="min-h-screen bg-background">
    <!-- メインコンテンツ -->
    <div class="container mx-auto px-4 py-8">
      <!-- ヘッダーセクション -->
      <div class="glass-card mb-8 p-8 text-center">
        <h1 
          data-testid="トップページ-タイトル" 
          class="text-4xl md:text-5xl font-bold text-heading mb-4"
        >
          🌟 Juna Supabase
        </h1>
        
        <p class="text-text-muted text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          あなたの声を世界に届ける、新しいソーシャルブログプラットフォーム
        </p>
        
        <!-- ログイン状態に応じたアクションボタン -->
        <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button 
            data-testid="トップページ-ログインボタン"
            @click="navigateToLogin"
            class="btn btn-primary text-lg px-8 py-3"
          >
            ログイン
          </button>
          
          <button 
            data-testid="トップページ-登録ボタン"
            @click="navigateToRegister"
            class="btn btn-outline-primary text-lg px-8 py-3"
          >
            新規登録
          </button>
        </div>
        
        <div v-else class="mb-8">
          <p class="text-heading text-xl mb-6">
            おかえりなさい、{{ profile?.nickname || 'ユーザー' }}さん！
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              @click="navigateToCreatePost"
              class="btn btn-primary text-lg px-8 py-3"
              data-testid="新規投稿ボタン"
            >
              ✍️ 新規投稿
            </button>
            <button 
              @click="navigateToPostList"
              class="btn btn-outline-primary text-lg px-8 py-3"
              data-testid="投稿一覧ボタン"
            >
              📚 投稿一覧
            </button>
          </div>
        </div>
      </div>

      <!-- 最新投稿セクション -->
      <div class="glass-card p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-heading flex items-center gap-2">
            🔥 最新の投稿
          </h2>
          <button 
            @click="navigateToPostList"
            class="text-primary hover:text-primary-light font-medium"
          >
            すべて見る →
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-12">
          <div class="text-text-muted text-lg">📖 読み込み中...</div>
        </div>
        
        <div v-else-if="recentPosts.length === 0" class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <div class="text-text-muted text-lg mb-6">まだ投稿がありません</div>
          <button 
            @click="isAuthenticated ? navigateToCreatePost() : navigateToLogin()"
            class="btn btn-primary"
          >
            {{ isAuthenticated ? '最初の投稿を作成' : 'ログインして投稿' }}
          </button>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="post in recentPosts" 
            :key="post.id"
            class="border border-border rounded-xl p-6 hover:bg-surface-variant hover:shadow-lg transition-all duration-300 cursor-pointer group"
            @click="navigateToPost(post.id)"
          >
            <h3 class="font-semibold text-heading mb-3 line-clamp-2 group-hover:text-primary transition-colors">
              {{ post.title }}
            </h3>
            <p class="text-text-muted text-sm mb-4 line-clamp-3">{{ post.excerpt }}</p>
            <div class="flex items-center justify-between text-xs text-text-muted">
              <span class="flex items-center gap-1">
                👤 {{ post.profiles?.nickname || 'Unknown' }}
              </span>
              <span class="flex items-center gap-1">
                📅 {{ formatDate(post.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 機能紹介セクション -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="glass-card p-8 text-center hover:shadow-lg transition-shadow duration-300">
          <div class="text-5xl mb-6">✍️</div>
          <h3 class="text-heading font-semibold mb-4 text-xl">記事を投稿</h3>
          <p class="text-text-muted leading-relaxed">
            リッチテキストエディターで美しい記事を作成し、あなたの考えやアイデアを世界に共有しましょう
          </p>
        </div>
        
        <div class="glass-card p-8 text-center hover:shadow-lg transition-shadow duration-300">
          <div class="text-5xl mb-6">💬</div>
          <h3 class="text-heading font-semibold mb-4 text-xl">コミュニティ</h3>
          <p class="text-text-muted leading-relaxed">
            他のユーザーと活発な議論を楽しみ、新しい視点や知識を得ることができます
          </p>
        </div>
        
        <div class="glass-card p-8 text-center hover:shadow-lg transition-shadow duration-300">
          <div class="text-5xl mb-6">🏷️</div>
          <h3 class="text-heading font-semibold mb-4 text-xl">カテゴリ管理</h3>
          <p class="text-text-muted leading-relaxed">
            記事をカテゴリ別に整理し、読者が興味のあるコンテンツを簡単に見つけられます
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const router = useRouter()
const { isAuthenticated, profile, initAuth } = useAuth()

const loading = ref(false)
const recentPosts = ref<any[]>([])

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

const navigateToPost = (postId: string) => {
  router.push(`/posts/${postId}`)
}

// 日付フォーマット
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'MM月dd日', { locale: ja })
}

// 最新投稿を取得
const loadRecentPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        created_at,
        profiles!inner(nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) throw error
    recentPosts.value = data || []
  } catch (error) {
    console.error('最新投稿の取得に失敗しました:', error)
  }
}

// データ読み込み
const loadData = async () => {
  loading.value = true
  try {
    await loadRecentPosts()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initAuth()
  await loadData()
})
</script>
