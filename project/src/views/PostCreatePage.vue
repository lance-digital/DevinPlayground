<template>
  <!-- 投稿作成ページのメインコンテナ：最小高さ画面全体、背景色、パディング設定 -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅制限とセンタリング設定 -->
    <div class="max-w-4xl mx-auto">
      <!-- ガラスカードコンポーネント -->
      <div class="glass-card">
        <!-- ページタイトル：大きなフォント、太字、見出し色、下マージン -->
        <h1 class="text-2xl font-bold text-heading mb-6">
          新規投稿作成
        </h1>
        
        <!-- 投稿作成フォーム：テストID付与、送信時handleSubmit実行、要素間スペース設定 -->
        <form 
          data-testid="投稿作成-フォーム"
          @submit.prevent="handleSubmit"
          class="space-y-6"
        >
          <!-- タイトル入力セクション -->
          <div>
            <!-- タイトルラベル：ブロック表示、テキスト色、小フォント、中太、下マージン -->
            <label for="title" class="block text-text-muted text-sm font-medium mb-2">
              タイトル
            </label>
            <!-- タイトル入力フィールド：ID設定、テストID、双方向バインディング、テキストタイプ、必須、最大文字数、スタイリング、プレースホルダー -->
            <input
              id="title"
              data-testid="投稿作成-タイトル入力"
              v-model="form.title"
              @input="draftData.title = form.title"
              type="text"
              required
              maxlength="200"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="投稿のタイトルを入力してください"
            />
          </div>
          
          <!-- 概要入力セクション -->
          <div>
            <!-- 概要ラベル：ブロック表示、テキスト色、小フォント、中太、下マージン -->
            <label for="excerpt" class="block text-text-muted text-sm font-medium mb-2">
              概要（任意）
            </label>
            <!-- 概要入力テキストエリア：ID設定、テストID、双方向バインディング、行数、最大文字数、スタイリング、プレースホルダー -->
            <textarea
              id="excerpt"
              data-testid="投稿作成-概要入力"
              v-model="form.excerpt"
              @input="draftData.excerpt = form.excerpt"
              rows="2"
              maxlength="300"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="投稿の概要を入力してください（任意）"
            />
          </div>
          
          <!-- カバー画像入力セクション -->
          <div>
            <label for="cover-image" class="block text-text-muted text-sm font-medium mb-2">
              カバー画像（任意）
            </label>
            <div class="relative">
              <input
                id="cover-image"
                type="file"
                accept="image/*"
                @change="handleCoverImageUpload"
                data-testid="投稿作成-カバー画像入力"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-border rounded-md bg-surface-variant"
              />
            </div>
            <div v-if="coverImageUploading" class="mt-2 text-sm text-primary">
              カバー画像をアップロード中...
            </div>
            <div v-if="coverImageUrl" class="mt-2">
              <img :src="coverImageUrl" alt="カバー画像プレビュー" class="max-w-xs h-auto rounded-lg" />
            </div>
          </div>

          <!-- 内容入力セクション -->
          <div>
            <!-- 内容ラベル：ブロック表示、テキスト色、小フォント、中太、下マージン -->
            <label class="block text-text-muted text-sm font-medium mb-2">
              内容
            </label>
            <TipTapEditor 
              v-model="form.content"
              @update:modelValue="draftData.content = form.content"
              test-id="投稿作成-内容入力"
            />
          </div>
          
          <!-- カテゴリ選択セクション -->
          <div>
            <!-- カテゴリラベル：ブロック表示、テキスト色、小フォント、中太、下マージン -->
            <label for="categories" class="block text-text-muted text-sm font-medium mb-2">
              カテゴリ
            </label>
            <!-- カテゴリ選択セレクトボックス：ID設定、テストID、双方向バインディング、複数選択、スタイリング -->
            <select
              id="categories"
              data-testid="投稿作成-カテゴリ選択"
              v-model="selectedCategories"
              multiple
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <!-- カテゴリオプション：ループ処理、キー設定、値設定 -->
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
            <!-- 操作説明テキスト：テキスト色、極小フォント、上マージン -->
            <p class="text-text-muted text-xs mt-1">
              Ctrlキーを押しながらクリックで複数選択
            </p>
          </div>
          
          <!-- 公開設定セクション -->
          <div>
            <!-- 公開チェックボックスラベル：フレックス表示、アイテム中央揃え、横スペース -->
            <label class="flex items-center space-x-2">
              <!-- 公開チェックボックス：テストID、双方向バインディング、チェックボックスタイプ、スタイリング -->
              <input
                data-testid="投稿作成-公開チェック"
                v-model="form.published"
                type="checkbox"
                class="rounded border-border text-primary focus:ring-primary"
              />
              <!-- チェックボックスラベルテキスト：テキスト色、小フォント -->
              <span class="text-text-muted text-sm">すぐに公開する</span>
            </label>
          </div>
          
          <!-- エラーメッセージ表示セクション：エラーメッセージが存在する場合のみ表示 -->
          <div 
            v-if="errorMessage"
            data-testid="投稿作成-エラーメッセージ"
            class="text-error text-sm"
          >
            {{ errorMessage }}
          </div>
          
          <!-- ボタンセクション：フレックス表示、横スペース -->
          <div class="flex space-x-4">
            <!-- 送信ボタン：テストID、送信タイプ、ローディング時無効化、ボタンスタイル -->
            <button
              data-testid="投稿作成-送信ボタン"
              type="submit"
              :disabled="loading || coverImageUploading"
              class="btn btn-primary"
            >
              {{ loading ? '作成中...' : '投稿を作成' }}
            </button>
            
            <!-- キャンセルボタン：投稿一覧ページへのリンク、アウトラインボタンスタイル -->
            <router-link 
              to="/posts"
              class="btn btn-outline-secondary"
            >
              キャンセル
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useImageUpload } from '@/composables/useImageUpload'
import { useDraft } from '@/composables/useDraft'
import TipTapEditor from '@/components/TipTapEditor.vue'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

// カテゴリテーブルの行型を定義：データベーススキーマに基づく型安全性
type Category = Database['public']['Tables']['categories']['Row']

const router = useRouter()
const { user } = useAuth()
const { draftData, isDraftAvailable, startAutoSave, stopAutoSave, clearDraft, restoreDraft } = useDraft('post_create', {
  title: '',
  content: '',
  excerpt: '',
  published: false
})

const form = ref({
  title: draftData.value.title || '',
  content: draftData.value.content || null,
  excerpt: draftData.value.excerpt || '',
  published: draftData.value.published || true
})

// カテゴリ一覧のリアクティブ参照を定義：データベースから取得したカテゴリリスト
const categories = ref<Category[]>([])
// 選択されたカテゴリIDのリアクティブ参照を定義：複数選択可能な数値配列
const selectedCategories = ref<number[]>([])
// ローディング状態のリアクティブ参照を定義：非同期処理中の状態管理
const loading = ref(false)
// エラーメッセージのリアクティブ参照を定義：ユーザーへのエラー表示
const errorMessage = ref('')
// 画像アップロード機能を取得
const { uploadCoverImage, uploading: coverImageUploading, error: imageError } = useImageUpload()
// カバー画像URLのリアクティブ参照を定義
const coverImageUrl = ref('')

// カテゴリ一覧を読み込む非同期関数：データベースからカテゴリデータを取得
const loadCategories = async () => {
  try {
    // Supabaseからカテゴリデータを取得：全フィールド選択、名前順でソート
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    // エラーが発生した場合は例外をスロー：エラーハンドリング
    if (error) throw error
    // 取得したデータをカテゴリ配列に設定：データがnullの場合は空配列
    categories.value = data || []
  } catch (error) {
    // 例外発生時はコンソールにエラー出力：デバッグ用ログ、スタックトレース付き
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  }
}

// カバー画像アップロードを処理する非同期関数
const handleCoverImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file && user.value) {
    const imageUrl = await uploadCoverImage(file, user.value.id)
    if (imageUrl) {
      coverImageUrl.value = imageUrl
    } else if (imageError.value) {
      errorMessage.value = imageError.value
    }
  }
}

// フォーム送信を処理する非同期関数：投稿データの作成とデータベース保存
const handleSubmit = async () => {
  // ユーザーが認証されていない場合はエラーメッセージを設定して終了
  if (!user.value) {
    errorMessage.value = 'ログインが必要です'
    return
  }

  // 内容が入力されているかチェック
  if (!form.value.content || !form.value.title.trim()) {
    errorMessage.value = 'タイトルと内容を入力してください'
    return
  }
  
  // エラーメッセージをクリア：前回のエラー状態をリセット
  errorMessage.value = ''
  // ローディング状態を開始：ユーザーに処理中であることを表示
  loading.value = true
  
  try {
    // Supabaseのpostsテーブルに投稿データを挿入：新規投稿作成
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title: form.value.title, // フォームからタイトルを取得
        content: form.value.content, // フォームから内容を取得（TipTap JSON形式）
        excerpt: form.value.excerpt || null, // フォームから概要を取得（空の場合はnull）
        author_id: user.value.id, // 認証ユーザーのIDを著者IDに設定
        cover_image_path: coverImageUrl.value || null, // カバー画像パス
        published: form.value.published // フォームから公開状態を取得
      })
      .select() // 挿入されたデータを取得
      .single() // 単一レコードとして取得
    
    // 投稿作成エラーの場合は例外をスロー：エラーハンドリング
    if (postError) throw postError
    
    // 選択されたカテゴリが存在する場合はカテゴリリンクを作成
    if (selectedCategories.value.length > 0) {
      // 各選択カテゴリに対して投稿IDとカテゴリIDのリンクオブジェクトを作成
      const categoryInserts = selectedCategories.value.map(categoryId => ({
        post_id: post.id, // 作成された投稿のID
        category_id: categoryId // 選択されたカテゴリのID
      }))
      
      // post_categoriesテーブルにカテゴリリンクを挿入：多対多関係の実現
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryInserts)
      
      // カテゴリリンクエラーの場合は例外をスロー：エラーハンドリング
      if (categoryError) throw categoryError
    }
    
    // 作成された投稿の詳細ページに遷移：成功時のリダイレクト
    clearDraft()
    router.push(`/posts/${post.id}`)
  } catch (error) {
    // 例外発生時はコンソールにエラー出力：デバッグ用ログ、スタックトレース付き
    console.error('Post create error:', error instanceof Error ? error.stack : error)
    // ユーザーにエラーメッセージを表示：日本語エラーメッセージ
    errorMessage.value = '投稿の作成に失敗しました'
  } finally {
    // 処理完了時にローディング状態を終了：成功・失敗問わず実行
    loading.value = false
  }
}

onMounted(async () => {
  await new Promise(resolve => {
    if (user.value) {
      resolve(true)
      return
    }
    const unwatch = watch(user, (newUser) => {
      if (newUser) {
        unwatch()
        resolve(true)
      }
    }, { immediate: true })
    
    setTimeout(() => {
      if (!user.value) {
        unwatch()
        router.push('/login')
        resolve(false)
      }
    }, 3000)
  })
  
  if (user.value) {
    await loadCategories()
  }
  
  if (isDraftAvailable.value) {
    restoreDraft()
    form.value = {
      title: draftData.value.title || '',
      content: draftData.value.content || null,
      excerpt: draftData.value.excerpt || '',
      published: draftData.value.published || true
    }
  }
  startAutoSave()
})

onBeforeUnmount(() => {
  stopAutoSave()
})
</script>
