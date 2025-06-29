<template>
  <!-- 投稿詳細ページのメインコンテナ -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅4xlでセンタリングされたコンテナ -->
    <div class="max-w-4xl mx-auto">
      <!-- ローディング状態の表示 -->
      <div v-if="loading" class="text-center text-text-muted">
        読み込み中...
      </div>
      
      <!-- 投稿が見つからない場合の表示 -->
      <div v-else-if="!post" class="text-center text-text-muted">
        投稿が見つかりません
      </div>
      
      <!-- 投稿詳細のメイン記事コンテナ -->
      <article 
        v-else
        data-testid="投稿詳細-記事"
        class="glass-card"
      >
        <!-- ヘッダー部分：タイトル、メタ情報、編集・削除ボタン -->
        <div class="flex justify-between items-start mb-6">
          <!-- 左側：タイトルとメタ情報 -->
          <div class="flex-1">
            <!-- 投稿タイトル -->
            <h1 
              data-testid="投稿詳細-タイトル"
              class="text-3xl font-bold text-heading mb-4"
            >
              {{ post.title }}
            </h1>
            
            <!-- メタ情報：作成者、作成日時、更新日時 -->
            <div class="flex items-center space-x-4 text-text-muted text-sm">
              <!-- 作成者のニックネーム -->
              <span>{{ post.profiles?.nickname || 'Unknown' }}</span>
              <!-- 作成日時 -->
              <span>{{ formatDate(post.created_at) }}</span>
              <!-- 更新日時（作成日時と異なる場合のみ表示） -->
              <span v-if="post.updated_at !== post.created_at">
                (更新: {{ formatDate(post.updated_at) }})
              </span>
            </div>
          </div>
          
          <!-- 右側：編集・削除ボタン（編集権限がある場合のみ表示） -->
          <div v-if="canEdit" class="flex space-x-2">
            <!-- 編集ページへのリンクボタン -->
            <router-link 
              :to="`/posts/${post.id}/edit`"
              class="btn btn-outline-primary"
            >
              編集
            </router-link>
            <!-- 削除ボタン -->
            <button 
              @click="deletePost"
              class="btn btn-outline-error"
              :disabled="deleteLoading"
            >
              {{ deleteLoading ? '削除中...' : '削除' }}
            </button>
          </div>
        </div>
        
        <!-- カバー画像（存在する場合のみ表示） -->
        <div 
          v-if="post.cover_image_path"
          class="w-full h-64 bg-surface-accent rounded-md mb-6 overflow-hidden"
        >
          <!-- カバー画像 -->
          <img 
            :src="post.cover_image_path"
            :alt="post.title"
            class="w-full h-full object-cover"
          />
        </div>
        
        <!-- 投稿内容 -->
        <div 
          data-testid="投稿詳細-内容"
          class="mb-6"
        >
          <TipTapDisplay 
            :content="post.content"
            data-testid="投稿詳細-内容表示"
          />
        </div>
        
        <!-- カテゴリタグ（存在する場合のみ表示） -->
        <div 
          v-if="post.categories && post.categories.length > 0"
          class="mb-6 flex flex-wrap gap-2"
        >
          <!-- 各カテゴリのタグ -->
          <span 
            v-for="category in post.categories" 
            :key="category.id"
            class="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full"
          >
            {{ category.name }}
          </span>
        </div>
        
        <!-- アクション部分：いいねボタンとコメント数 -->
        <div class="flex items-center space-x-4 border-t border-border-light pt-4">
          <!-- いいねボタン -->
          <button
            data-testid="投稿詳細-いいねボタン"
            @click="toggleLike"
            :disabled="likeLoading"
            class="flex items-center space-x-2 btn btn-ghost"
            :class="{ 'text-accent1': isLiked }"
          >
            <!-- いいね状態に応じたアイコン -->
            <span>{{ isLiked ? '❤️' : '🤍' }}</span>
            <!-- いいね数 -->
            <span 
              data-testid="投稿詳細-いいね数"
            >
              {{ likeCount }}
            </span>
          </button>
          
          <!-- コメント数表示 -->
          <span class="text-text-muted text-sm">
            {{ commentCount }} コメント
          </span>
        </div>
      </article>
      
      <!-- コメントセクション（投稿が存在する場合のみ表示） -->
      <CommentSection 
        v-if="post"
        :post-id="post.id"
        @comment-added="loadComments"
        @comment-deleted="loadComments"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted, computed } from 'vue'
// Vue Routerのルート情報とナビゲーション機能をインポート
import { useRoute, useRouter } from 'vue-router'
// 認証機能のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseデータベースの型定義をインポート
import type { Database } from '@/lib/supabase'
// TipTap表示コンポーネントをインポート
import TipTapDisplay from '@/components/TipTapDisplay.vue'
// コメントセクションコンポーネントをインポート
import CommentSection from '@/components/CommentSection.vue'

// 投稿の型定義（プロフィールとカテゴリ情報を含む拡張型）
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
  categories?: Database['public']['Tables']['categories']['Row'][]
}

// 現在のルート情報を取得
const route = useRoute()
// ルーターのナビゲーション機能を取得
const router = useRouter()
// 認証状態とユーザー情報を取得
const { user, isAdmin } = useAuth()

// 投稿データのリアクティブ変数
const post = ref<Post | null>(null)
// ローディング状態のリアクティブ変数
const loading = ref(false)
// 削除処理中状態のリアクティブ変数
const deleteLoading = ref(false)
// いいね処理中状態のリアクティブ変数
const likeLoading = ref(false)
// いいね済み状態のリアクティブ変数
const isLiked = ref(false)
// いいね数のリアクティブ変数
const likeCount = ref(0)
// コメント数のリアクティブ変数
const commentCount = ref(0)

// 編集権限の計算プロパティ（投稿者本人または管理者の場合に編集可能）
const canEdit = computed(() => {
  return user.value && (
    user.value.id === post.value?.author_id || 
    isAdmin.value
  )
})

// 投稿データを読み込む非同期関数
const loadPost = async () => {
  // ローディング状態を開始
  loading.value = true
  try {
    // Supabaseから投稿データを取得（プロフィールとカテゴリ情報を含む）
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (nickname),
        post_categories (
          categories (id, name)
        )
      `)
      .eq('id', route.params.id)
      .single()
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 取得したデータを整形して投稿変数に設定
    post.value = {
      ...data,
      categories: data.post_categories?.map(pc => pc.categories).filter(Boolean) || []
    }
    
    // いいね状態とコメント数を並行して読み込み
    await Promise.all([
      loadLikeStatus(),
      loadComments()
    ])
  } catch (error) {
    // エラーをコンソールに出力（スタックトレース付き）
    console.error('Post load error:', error instanceof Error ? error.stack : error)
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// いいね状態を読み込む非同期関数
const loadLikeStatus = async () => {
  // ユーザーまたは投稿が存在しない場合は処理を終了
  if (!user.value || !post.value) return
  
  try {
    // 現在のユーザーがこの投稿にいいねしているかチェック
    const { data: likeData } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', post.value.id)
      .eq('user_id', user.value.id)
      .single()
    
    // いいね状態を設定（データが存在すればtrue）
    isLiked.value = !!likeData
    
    // この投稿の総いいね数を取得
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.value.id)
    
    // いいね数を設定（nullの場合は0）
    likeCount.value = count || 0
  } catch (error) {
    // エラーをコンソールに出力（スタックトレース付き）
    console.error('Like status load error:', error instanceof Error ? error.stack : error)
  }
}

// コメント数を読み込む非同期関数
const loadComments = async () => {
  // 投稿が存在しない場合は処理を終了
  if (!post.value) return
  
  try {
    // この投稿のコメント数を取得
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.value.id)
    
    // コメント数を設定（nullの場合は0）
    commentCount.value = count || 0
  } catch (error) {
    // エラーをコンソールに出力（スタックトレース付き）
    console.error('Comments count load error:', error instanceof Error ? error.stack : error)
  }
}

// いいねの切り替えを行う非同期関数
const toggleLike = async () => {
  // ユーザーまたは投稿が存在しない場合は処理を終了
  if (!user.value || !post.value) return
  
  // いいね処理中状態を開始
  likeLoading.value = true
  try {
    // 現在いいね済みの場合はいいねを削除
    if (isLiked.value) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.value.id)
        .eq('user_id', user.value.id)
      
      // エラーが発生した場合は例外をスロー
      if (error) throw error
      // いいね状態を解除し、いいね数を減算
      isLiked.value = false
      likeCount.value--
    } else {
      // いいね未済みの場合はいいねを追加
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: post.value.id,
          user_id: user.value.id
        })
      
      // エラーが発生した場合は例外をスロー
      if (error) throw error
      // いいね状態を設定し、いいね数を加算
      isLiked.value = true
      likeCount.value++
    }
  } catch (error) {
    // エラーをコンソールに出力（スタックトレース付き）
    console.error('Like toggle error:', error instanceof Error ? error.stack : error)
  } finally {
    // いいね処理中状態を終了
    likeLoading.value = false
  }
}

// 投稿を削除する非同期関数
const deletePost = async () => {
  // 投稿が存在しないか、削除確認がキャンセルされた場合は処理を終了
  if (!post.value || !confirm('この投稿を削除しますか？')) return
  
  // 削除処理中状態を開始
  deleteLoading.value = true
  try {
    // Supabaseから投稿を削除
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.value.id)
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    // 削除成功後、投稿一覧ページに遷移
    router.push('/posts')
  } catch (error) {
    // エラーをコンソールに出力（スタックトレース付き）
    console.error('Post delete error:', error instanceof Error ? error.stack : error)
  } finally {
    // 削除処理中状態を終了
    deleteLoading.value = false
  }
}

// 画像のパブリックURLを取得する関数
const getImageUrl = (path: string) => {
  // Supabaseストレージから画像のパブリックURLを取得
  const { data } = supabase.storage.from('post_images').getPublicUrl(path)
  // パブリックURLを返却
  return data.publicUrl
}

// 日付文字列を日本語形式でフォーマットする関数
const formatDate = (dateString: string) => {
  // 日付文字列をDateオブジェクトに変換し、日本語ロケールでフォーマット
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 投稿内容をHTMLとしてレンダリングする関数
const renderContent = (content: any) => {
  // 内容が文字列の場合は改行をHTMLの<br>タグに変換
  if (typeof content === 'string') {
    return content.replace(/\n/g, '<br>')
  }
  // 文字列以外の場合はJSON文字列として返却
  return JSON.stringify(content)
}

// コンポーネントマウント時に投稿データを読み込み
onMounted(() => {
  loadPost()
})
</script>
