<template>
  <!-- 投稿一覧ページのメインコンテナ -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅6xlでセンタリングされたコンテナ -->
    <div class="max-w-6xl mx-auto">
      <!-- ヘッダー部分：タイトルと新規投稿ボタン -->
      <div class="flex justify-between items-center mb-6">
        <!-- 投稿一覧のタイトル -->
        <h1 
          data-testid="投稿一覧-タイトル"
          class="text-3xl font-bold text-heading"
        >
          投稿一覧
        </h1>
        <!-- 新規投稿作成ページへのリンクボタン -->
        <router-link 
          data-testid="投稿一覧-作成ボタン"
          to="/posts/create"
          class="btn btn-primary"
        >
          新規投稿
        </router-link>
      </div>
      
      <!-- フィルター部分：カテゴリと並び順の選択 -->
      <div class="mb-6 flex flex-wrap gap-4">
        <!-- 検索入力フィールド -->
        <input
          data-testid="投稿一覧-検索入力"
          v-model="searchQuery"
          @input="applyFilters"
          type="text"
          placeholder="投稿を検索..."
          class="px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
        />
        
        <!-- カテゴリフィルター選択ボックス -->
        <select
          data-testid="投稿一覧-カテゴリフィルター"
          v-model="selectedCategory"
          @change="applyFilters"
          class="px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <!-- すべてのカテゴリを表示するオプション -->
          <option value="">すべてのカテゴリ</option>
          <!-- 各カテゴリのオプション -->
          <option 
            v-for="category in categories" 
            :key="category.id" 
            :value="category.name"
          >
            {{ category.name }}
          </option>
        </select>
        
        <!-- 並び順フィルター選択ボックス -->
        <select
          data-testid="投稿一覧-並び順フィルター"
          v-model="sortBy"
          @change="applyFilters"
          class="px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <!-- 新しい順オプション -->
          <option value="newest">新しい順</option>
          <!-- 古い順オプション -->
          <option value="oldest">古い順</option>
        </select>
      </div>
      
      <!-- ローディング状態の表示 -->
      <div 
        v-if="loading"
        class="text-center text-text-muted"
      >
        読み込み中...
      </div>
      
      <!-- 投稿が存在しない場合の表示 -->
      <div 
        v-else-if="searchPosts.length === 0"
        class="text-center text-text-muted"
      >
        投稿がありません
      </div>
      
      <!-- 投稿一覧のグリッド表示 -->
      <div 
        v-else
        data-testid="投稿一覧-リスト"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <!-- 各投稿のカード -->
        <article 
          v-for="post in searchPosts" 
          :key="post.id"
          :data-testid="`投稿一覧-投稿-${post.id}`"
          class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateToPost(post.id)"
        >
          <!-- カバー画像がある場合の表示 -->
          <div 
            v-if="post.cover_image_path"
            class="w-full h-48 bg-surface-accent rounded-md mb-4 overflow-hidden"
          >
            <!-- カバー画像 -->
            <img 
              :src="post.cover_image_path"
              :alt="post.title"
              class="w-full h-full object-cover"
            />
          </div>
          
          <!-- 投稿タイトル -->
          <h2 class="text-xl font-semibold text-heading mb-2 line-clamp-2">
            {{ post.title }}
          </h2>
          
          <!-- 投稿の概要（存在する場合） -->
          <p 
            v-if="post.excerpt"
            class="text-text-muted text-sm mb-4 line-clamp-3"
          >
            {{ post.excerpt }}
          </p>
          
          <!-- 投稿者と作成日時の表示 -->
          <div class="flex items-center justify-between text-sm text-text-muted">
            <!-- 投稿者のニックネーム -->
            <span>{{ post.profiles?.nickname || 'Unknown' }}</span>
            <!-- 投稿作成日時 -->
            <span>{{ formatDate(post.created_at) }}</span>
          </div>
          
          <!-- カテゴリタグの表示（存在する場合） -->
          <div 
            v-if="post.categories && post.categories.length > 0"
            class="mt-2 flex flex-wrap gap-1"
          >
            <!-- 各カテゴリのタグ -->
            <span 
              v-for="category in post.categories" 
              :key="category.id"
              class="px-2 py-1 bg-primary/20 text-primary text-xs rounded"
            >
              {{ category.name }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted } from 'vue'
// Vue Routerのルーター機能をインポート
import { useRouter } from 'vue-router'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseデータベースの型定義をインポート
import type { Database } from '@/lib/supabase'
// 投稿検索機能のコンポーザブルをインポート
import { usePostSearch } from '@/composables/usePostSearch'


// カテゴリの型定義
type Category = Database['public']['Tables']['categories']['Row']

// Vue Routerのインスタンスを取得
const router = useRouter()

// 投稿検索機能を取得
const { posts: searchPosts, loading, searchPosts: searchFunction } = usePostSearch()

// カテゴリ一覧のリアクティブ配列
const categories = ref<Category[]>([])
// 選択されたカテゴリ名のリアクティブ変数
const selectedCategory = ref('')
// 検索クエリのリアクティブ変数
const searchQuery = ref('')
// 並び順のリアクティブ変数
const sortBy = ref('newest')

// フィルタを適用する関数
const applyFilters = async () => {
  await searchFunction(searchQuery.value, selectedCategory.value, sortBy.value)
}

// カテゴリ一覧を読み込む非同期関数
const loadCategories = async () => {
  try {
    // カテゴリテーブルから全データを取得
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    // 取得したデータをカテゴリ配列に設定
    categories.value = data || []
  } catch (error) {
    // エラーをコンソールに出力
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  }
}

// 投稿詳細ページに遷移する関数
const navigateToPost = (postId: number) => {
  router.push(`/posts/${postId}`)
}


// 日付文字列を日本語形式でフォーマットする関数
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

// コンポーネントマウント時に実行される処理
onMounted(() => {
  // 投稿一覧を読み込み
  applyFilters()
  // カテゴリ一覧を読み込み
  loadCategories()
})
</script>
