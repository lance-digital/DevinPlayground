<template>
  <!-- 管理者ダッシュボードのメインコンテナ：最小高さ画面全体、背景色、パディング設定 -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅6xlでセンタリングされたコンテナ -->
    <div class="max-w-6xl mx-auto">
      <!-- 管理者ダッシュボードのメインタイトル -->
      <h1 
        data-testid="管理者ダッシュボード-タイトル"
        class="text-3xl font-bold text-heading mb-6"
      >
        管理者ダッシュボード
      </h1>
      
      <!-- メインコンテンツエリア：レスポンシブグリッドレイアウト -->
      <div 
        data-testid="管理者ダッシュボード-メイン"
        class="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <!-- 統計情報表示カード -->
        <div 
          data-testid="管理者ダッシュボード-統計"
          class="glass-card"
        >
          <!-- 統計情報セクションのタイトル -->
          <h2 class="text-xl font-semibold text-heading mb-4">
            統計情報
          </h2>
          
          <!-- 統計項目のコンテナ：縦方向スペース設定 -->
          <div class="space-y-4">
            <!-- 総ユーザー数表示行：左右配置 -->
            <div class="flex justify-between items-center">
              <!-- ユーザー数ラベル -->
              <span class="text-text-muted">総ユーザー数</span>
              <!-- ユーザー数値表示 -->
              <span 
                data-testid="管理者ダッシュボード-ユーザー数"
                class="text-2xl font-bold text-primary"
              >
                {{ stats.userCount }}
              </span>
            </div>
            
            <!-- 総投稿数表示行：左右配置 -->
            <div class="flex justify-between items-center">
              <!-- 投稿数ラベル -->
              <span class="text-text-muted">総投稿数</span>
              <!-- 投稿数値表示 -->
              <span 
                data-testid="管理者ダッシュボード-投稿数"
                class="text-2xl font-bold text-primary"
              >
                {{ stats.postCount }}
              </span>
            </div>
            
            <!-- 総コメント数表示行：左右配置 -->
            <div class="flex justify-between items-center">
              <!-- コメント数ラベル -->
              <span class="text-text-muted">総コメント数</span>
              <!-- コメント数値表示 -->
              <span 
                data-testid="管理者ダッシュボード-コメント数"
                class="text-2xl font-bold text-primary"
              >
                {{ stats.commentCount }}
              </span>
            </div>
            
            <!-- カテゴリ数表示行：左右配置 -->
            <div class="flex justify-between items-center">
              <!-- カテゴリ数ラベル -->
              <span class="text-text-muted">カテゴリ数</span>
              <!-- カテゴリ数値表示 -->
              <span 
                data-testid="管理者ダッシュボード-カテゴリ数"
                class="text-2xl font-bold text-primary"
              >
                {{ stats.categoryCount }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 最近のユーザー表示カード -->
        <div class="glass-card">
          <!-- 最近のユーザーセクションタイトル -->
          <h2 class="text-xl font-semibold text-heading mb-4">
            最近のユーザー
          </h2>
          
          <!-- ユーザーが存在しない場合の表示 -->
          <div 
            v-if="recentUsers.length === 0"
            class="text-center text-text-muted py-4"
          >
            ユーザーがいません
          </div>
          
          <!-- ユーザー一覧表示エリア -->
          <div 
            v-else
            data-testid="管理者ダッシュボード-最近のユーザー"
            class="space-y-3"
          >
            <!-- ユーザー情報カード：ループ表示 -->
            <div 
              v-for="user in recentUsers" 
              :key="user.id"
              class="flex items-center justify-between p-3 bg-surface-variant rounded-md"
            >
              <!-- ユーザー基本情報表示エリア -->
              <div>
                <!-- ユーザーニックネーム表示 -->
                <p class="font-medium text-heading">
                  {{ user.nickname }}
                </p>
                <!-- ユーザー作成日時表示 -->
                <p class="text-text-muted text-sm">
                  {{ formatDate(user.created_at) }}
                </p>
              </div>
              
              <!-- ユーザー操作エリア：管理者バッジと削除ボタン -->
              <div class="flex items-center space-x-2">
                <!-- 管理者バッジ：管理者の場合のみ表示 -->
                <span 
                  v-if="user.is_admin"
                  class="px-2 py-1 bg-accent1/20 text-accent1 text-xs rounded-full"
                >
                  管理者
                </span>
                
                <!-- ユーザー削除ボタン：管理者は削除不可 -->
                <button
                  @click="deleteUser(user.id)"
                  :disabled="deleteLoading || user.is_admin"
                  class="btn btn-outline-error btn-sm"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 最近の投稿表示カード -->
        <div class="glass-card">
          <!-- 最近の投稿セクションタイトル -->
          <h2 class="text-xl font-semibold text-heading mb-4">
            最近の投稿
          </h2>
          
          <!-- 投稿が存在しない場合の表示 -->
          <div 
            v-if="recentPosts.length === 0"
            class="text-center text-text-muted py-4"
          >
            投稿がありません
          </div>
          
          <!-- 投稿一覧表示エリア -->
          <div 
            v-else
            data-testid="管理者ダッシュボード-最近の投稿"
            class="space-y-3"
          >
            <!-- 投稿情報カード：ループ表示 -->
            <div 
              v-for="post in recentPosts" 
              :key="post.id"
              class="p-3 bg-surface-variant rounded-md"
            >
              <!-- 投稿詳細ページへのリンク -->
              <router-link 
                :to="`/posts/${post.id}`"
                class="block hover:text-primary"
              >
                <!-- 投稿タイトル表示 -->
                <h3 class="font-medium text-heading mb-1">
                  {{ post.title }}
                </h3>
                <!-- 投稿者と作成日時表示 -->
                <p class="text-text-muted text-sm">
                  {{ post.profiles?.nickname }} - {{ formatDate(post.created_at) }}
                </p>
              </router-link>
              
              <!-- 投稿ステータスと削除ボタンエリア -->
              <div class="flex justify-between items-center mt-2">
                <!-- 投稿公開ステータス表示：公開/下書き -->
                <span 
                  :class="post.published ? 'text-success' : 'text-warning'"
                  class="text-xs"
                >
                  {{ post.published ? '公開' : '下書き' }}
                </span>
                
                <!-- 投稿削除ボタン -->
                <button
                  @click="deletePost(post.id)"
                  :disabled="deleteLoading"
                  class="btn btn-outline-error btn-sm"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- エラーメッセージ表示エリア：エラーがある場合のみ表示 -->
      <div 
        v-if="errorMessage"
        data-testid="管理者ダッシュボード-エラーメッセージ"
        class="mt-6 text-error text-center"
      >
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted } from 'vue'
// Vue Routerのルーティング機能をインポート
import { useRouter } from 'vue-router'
// 認証機能のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseデータベースの型定義をインポート
import type { Database } from '@/lib/supabase'

// プロフィールテーブルの行型定義
type Profile = Database['public']['Tables']['profiles']['Row']
// 投稿テーブルの行型定義（プロフィール情報を含む拡張型）
type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

// Vue Routerのインスタンスを取得
const router = useRouter()
// 認証関連の状態と機能を取得
const { user, profile, isAdmin } = useAuth()

// 統計情報のリアクティブ状態：各種カウント数を管理
const stats = ref({
  userCount: 0,
  postCount: 0,
  commentCount: 0,
  categoryCount: 0
})

// 全ユーザー一覧のリアクティブ状態
const allUsers = ref<Profile[]>([])
// フィルタされたユーザー一覧のリアクティブ状態
const filteredUsers = ref<Profile[]>([])
// 最近のユーザー一覧のリアクティブ状態（最新5件）
const recentUsers = ref<Profile[]>([])
// 全投稿一覧のリアクティブ状態
const allPosts = ref<Post[]>([])
// フィルタされた投稿一覧のリアクティブ状態
const filteredPosts = ref<Post[]>([])
// 最近の投稿一覧のリアクティブ状態（最新5件）
const recentPosts = ref<Post[]>([])
// ユーザー検索クエリのリアクティブ状態
const userSearchQuery = ref('')
// 投稿検索クエリのリアクティブ状態
const postSearchQuery = ref('')
// 削除中のユーザーIDリストのリアクティブ状態
const deletingUsers = ref<string[]>([])
// 削除中の投稿IDリストのリアクティブ状態
const deletingPosts = ref<string[]>([])
// 削除処理中フラグのリアクティブ状態
const deleteLoading = ref(false)
// エラーメッセージのリアクティブ状態
const errorMessage = ref('')

// 統計情報を読み込む非同期関数
const loadStats = async () => {
  try {
    // 各テーブルのレコード数を並列取得：分割代入でカウント値を抽出
    const [
      { count: userCount },
      { count: postCount },
      { count: commentCount },
      { count: categoryCount }
    ] = await Promise.all([
      // プロフィールテーブルの総レコード数を取得
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // 投稿テーブルの総レコード数を取得
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      // コメントテーブルの総レコード数を取得
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      // カテゴリテーブルの総レコード数を取得
      supabase.from('categories').select('*', { count: 'exact', head: true })
    ])
    
    // 統計情報の状態を更新：nullの場合は0にフォールバック
    stats.value = {
      userCount: userCount || 0,
      postCount: postCount || 0,
      commentCount: commentCount || 0,
      categoryCount: categoryCount || 0
    }
  } catch (error) {
    // 統計情報読み込みエラーをコンソールに出力：スタックトレース付き
    console.error('Stats load error:', error instanceof Error ? error.stack : error)
  }
}

// 全ユーザーを読み込む非同期関数
const loadAllUsers = async () => {
  try {
    // プロフィールテーブルから全ユーザーを取得
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    // 取得したデータを状態に設定：nullの場合は空配列
    allUsers.value = data || []
    filteredUsers.value = data || []
    // 最新5件のユーザーを設定
    recentUsers.value = (data || []).slice(0, 5)
  } catch (error) {
    // 全ユーザー読み込みエラーをコンソールに出力：スタックトレース付き
    console.error('All users load error:', error instanceof Error ? error.stack : error)
  }
}

// 全投稿を読み込む非同期関数
const loadAllPosts = async () => {
  try {
    // 投稿テーブルから全投稿を作成者情報と共に取得
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (nickname)
      `)
      .order('created_at', { ascending: false })
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    // 取得したデータを状態に設定：nullの場合は空配列
    allPosts.value = data || []
    filteredPosts.value = data || []
    // 最新5件の投稿を設定
    recentPosts.value = (data || []).slice(0, 5)
  } catch (error) {
    // 全投稿読み込みエラーをコンソールに出力：スタックトレース付き
    console.error('All posts load error:', error instanceof Error ? error.stack : error)
  }
}

// ユーザー検索を実行する関数
const searchUsers = () => {
  if (!userSearchQuery.value.trim()) {
    filteredUsers.value = allUsers.value
    return
  }
  
  const query = userSearchQuery.value.toLowerCase()
  filteredUsers.value = allUsers.value.filter(user => 
    user.nickname?.toLowerCase().includes(query) ||
    user.account_id?.toLowerCase().includes(query)
  )
}

// 投稿検索を実行する関数
const searchPosts = () => {
  if (!postSearchQuery.value.trim()) {
    filteredPosts.value = allPosts.value
    return
  }
  
  const query = postSearchQuery.value.toLowerCase()
  filteredPosts.value = allPosts.value.filter(post => 
    post.title?.toLowerCase().includes(query) ||
    post.profiles?.nickname?.toLowerCase().includes(query)
  )
}

// ユーザーを削除する非同期関数
const deleteUser = async (userId: string) => {
  // 削除確認ダイアログを表示：キャンセルされた場合は処理を中断
  if (!confirm('このユーザーを削除しますか？')) return
  
  // 削除中リストに追加
  deletingUsers.value.push(userId)
  // エラーメッセージをクリア
  errorMessage.value = ''
  
  try {
    // Supabaseエッジ関数を呼び出してユーザーを削除
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ userId })
    })

    // レスポンスをJSONとして解析
    const result = await response.json()
    
    // 削除が失敗した場合はエラーをスロー
    if (!result.success) {
      throw new Error(result.error || 'ユーザーの削除に失敗しました')
    }
    
    // 統計情報と全ユーザー一覧を並列で再読み込み
    await Promise.all([
      loadStats(),
      loadAllUsers()
    ])
  } catch (error) {
    // ユーザー削除エラーをコンソールに出力：スタックトレース付き
    console.error('User delete error:', error instanceof Error ? error.stack : error)
    // エラーメッセージを設定：Errorオブジェクトの場合はメッセージを使用
    errorMessage.value = error instanceof Error ? error.message : 'ユーザーの削除に失敗しました'
  } finally {
    // 削除中リストから削除
    deletingUsers.value = deletingUsers.value.filter(id => id !== userId)
  }
}

// 投稿を削除する非同期関数
const deletePost = async (postId: number) => {
  // 削除確認ダイアログを表示：キャンセルされた場合は処理を中断
  if (!confirm('この投稿を削除しますか？')) return
  
  // 削除中リストに追加
  deletingPosts.value.push(postId.toString())
  // エラーメッセージをクリア
  errorMessage.value = ''
  
  try {
    // Supabaseから指定IDの投稿を削除
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 統計情報と全投稿一覧を並列で再読み込み
    await Promise.all([
      loadStats(),
      loadAllPosts()
    ])
  } catch (error) {
    // 投稿削除エラーをコンソールに出力：スタックトレース付き
    console.error('Post delete error:', error instanceof Error ? error.stack : error)
    // エラーメッセージを設定
    errorMessage.value = '投稿の削除に失敗しました'
  } finally {
    // 削除中リストから削除
    deletingPosts.value = deletingPosts.value.filter(id => id !== postId.toString())
  }
}

// 日付文字列を日本語形式にフォーマットする関数
const formatDate = (dateString: string) => {
  // ISO日付文字列をDateオブジェクトに変換し、日本語ロケールで詳細フォーマットで表示
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// コンポーネントマウント時の初期化処理
onMounted(async () => {
  // ユーザーが認証されていない場合は投稿一覧ページにリダイレクト
  if (!user.value) {
    router.push('/posts')
    return
  }
  
  // プロフィール読み込み待機：プロフィールが未読み込みの場合
  let attempts = 0
  while (!profile.value && attempts < 10) {
    // 100ms間隔で待機
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  // 管理者権限がない場合は投稿一覧ページにリダイレクト
  if (!isAdmin.value) {
    router.push('/posts')
    return
  }
  
  // 統計情報、全ユーザー、全投稿を並列で読み込み
  Promise.all([
    loadStats(),
    loadAllUsers(),
    loadAllPosts()
  ])
})
</script>
