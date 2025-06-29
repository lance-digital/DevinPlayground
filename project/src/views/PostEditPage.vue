<template>
  <!-- 投稿編集画面のメインコンテナ：最小高さを画面全体に設定し背景色とパディングを適用 -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅4xlで中央揃えのコンテナ -->
    <div class="max-w-4xl mx-auto">
      <!-- ローディング状態の表示：投稿データ読み込み中に表示 -->
      <div v-if="loading" class="text-center text-text-muted">
        読み込み中...
      </div>
      
      <!-- 投稿が見つからない場合の表示：指定されたIDの投稿が存在しない場合 -->
      <div v-else-if="!post" class="text-center text-text-muted">
        投稿が見つかりません
      </div>
      
      <!-- 投稿編集フォームのメインコンテナ：投稿データが正常に読み込まれた場合に表示 -->
      <div v-else class="glass-card">
        <!-- 投稿編集画面のタイトル：大きなフォントサイズと太字で表示 -->
        <h1 class="text-2xl font-bold text-heading mb-6">
          投稿編集
        </h1>
        
        <!-- 投稿編集フォーム：送信時にhandleSubmitを実行し、デフォルトの送信動作を防止 -->
        <form 
          data-testid="投稿編集-フォーム"
          @submit.prevent="handleSubmit"
          class="space-y-6"
        >
          <!-- タイトル入力フィールド：投稿のタイトルを編集するための入力欄 -->
          <div>
            <!-- タイトル入力のラベル：アクセシビリティのためのラベル要素 -->
            <label for="title" class="block text-text-muted text-sm font-medium mb-2">
              タイトル
            </label>
            <!-- タイトル入力欄：v-modelでフォームデータとバインド、必須項目で最大200文字 -->
            <input
              id="title"
              data-testid="投稿編集-タイトル入力"
              v-model="form.title"
              type="text"
              required
              maxlength="200"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <!-- 概要入力フィールド：投稿の概要を編集するための任意入力欄 -->
          <div>
            <!-- 概要入力のラベル：任意項目であることを明示 -->
            <label for="excerpt" class="block text-text-muted text-sm font-medium mb-2">
              概要（任意）
            </label>
            <!-- 概要入力欄：テキストエリアで2行表示、最大300文字の任意項目 -->
            <textarea
              id="excerpt"
              data-testid="投稿編集-概要入力"
              v-model="form.excerpt"
              rows="2"
              maxlength="300"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <!-- カバー画像入力フィールド：投稿のカバー画像を編集 -->
          <div>
            <label for="cover-image" class="block text-text-muted text-sm font-medium mb-2">
              カバー画像（任意）
            </label>
            <input
              id="cover-image"
              type="file"
              accept="image/*"
              @change="handleCoverImageUpload"
              data-testid="投稿編集-カバー画像入力"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div v-if="coverImageUploading" class="mt-2 text-sm text-primary">
              カバー画像をアップロード中...
            </div>
            <div v-if="coverImageUrl" class="mt-2">
              <img :src="coverImageUrl" alt="カバー画像プレビュー" class="max-w-xs h-auto rounded-lg" />
            </div>
          </div>

          <!-- 内容入力フィールド：投稿の本文を編集するためのメイン入力欄 -->
          <div>
            <!-- 内容入力のラベル：投稿の本文であることを示すラベル -->
            <label class="block text-text-muted text-sm font-medium mb-2">
              内容
            </label>
            <TipTapEditor 
              v-model="form.content"
              test-id="投稿編集-内容入力"
            />
          </div>
          
          <!-- カテゴリ選択フィールド：投稿に関連付けるカテゴリを選択 -->
          <div>
            <!-- カテゴリ選択のラベル：複数選択可能であることを示唆 -->
            <label for="categories" class="block text-text-muted text-sm font-medium mb-2">
              カテゴリ
            </label>
            <!-- カテゴリ選択欄：複数選択可能なセレクトボックス -->
            <select
              id="categories"
              data-testid="投稿編集-カテゴリ選択"
              v-model="selectedCategories"
              multiple
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <!-- カテゴリオプション：利用可能なカテゴリをループで表示 -->
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <!-- 公開設定フィールド：投稿を公開するかどうかのチェックボックス -->
          <div>
            <!-- 公開設定のラベル：チェックボックスとテキストを横並びで配置 -->
            <label class="flex items-center space-x-2">
              <!-- 公開チェックボックス：投稿の公開状態を制御 -->
              <input
                data-testid="投稿編集-公開チェック"
                v-model="form.published"
                type="checkbox"
                class="rounded border-border text-primary focus:ring-primary"
              />
              <!-- 公開設定のテキストラベル：チェックボックスの説明 -->
              <span class="text-text-muted text-sm">公開する</span>
            </label>
          </div>
          
          <!-- エラーメッセージ表示エリア：投稿更新時のエラーを表示 -->
          <div 
            v-if="errorMessage"
            data-testid="投稿編集-エラーメッセージ"
            class="text-error text-sm"
          >
            {{ errorMessage }}
          </div>
          
          <!-- 成功メッセージ表示エリア：投稿更新成功時のメッセージを表示 -->
          <div 
            v-if="successMessage"
            data-testid="投稿編集-成功メッセージ"
            class="text-success text-sm"
          >
            {{ successMessage }}
          </div>
          
          <!-- アクションボタンエリア：保存とキャンセルボタンを横並びで配置 -->
          <div class="flex space-x-4">
            <!-- 保存ボタン：フォーム送信を実行、保存中は無効化 -->
            <button
              data-testid="投稿編集-保存ボタン"
              type="submit"
              :disabled="saveLoading || coverImageUploading"
              class="btn btn-primary"
            >
              {{ saveLoading ? '保存中...' : '変更を保存' }}
            </button>
            
            <!-- キャンセルボタン：投稿詳細画面に戻るリンク -->
            <router-link 
              :to="`/posts/${post.id}`"
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
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted } from 'vue'
// Vue Routerのルート情報とナビゲーション機能をインポート
import { useRoute, useRouter } from 'vue-router'
// 認証状態管理のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// 画像アップロード機能のカスタムコンポーザブルをインポート
import { useImageUpload } from '@/composables/useImageUpload'
// TipTapエディターコンポーネントをインポート
import TipTapEditor from '@/components/TipTapEditor.vue'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseデータベースの型定義をインポート
import type { Database } from '@/lib/supabase'

// 投稿データの型定義：Supabaseのpostsテーブルの行型
type Post = Database['public']['Tables']['posts']['Row']
// カテゴリデータの型定義：Supabasecategoriesテーブルの行型
type Category = Database['public']['Tables']['categories']['Row']

// 現在のルート情報を取得
const route = useRoute()
// ルーターナビゲーション機能を取得
const router = useRouter()
// 認証状態（ユーザー情報と管理者権限）を取得
const { user, isAdmin } = useAuth()

// 編集対象の投稿データを格納するリアクティブ変数
const post = ref<Post | null>(null)
// 利用可能なカテゴリ一覧を格納するリアクティブ変数
const categories = ref<Category[]>([])
// 投稿データ読み込み中の状態を管理するリアクティブ変数
const loading = ref(false)
// 投稿保存中の状態を管理するリアクティブ変数
const saveLoading = ref(false)
// エラーメッセージを格納するリアクティブ変数
const errorMessage = ref('')
// 成功メッセージを格納するリアクティブ変数
const successMessage = ref('')

// 投稿編集フォームのデータを管理するリアクティブオブジェクト
const form = ref({
  title: '',      // 投稿タイトル
  content: null,  // 投稿内容（TipTap JSON形式）
  excerpt: '',    // 投稿概要
  published: false // 公開状態
})

// 画像アップロード機能を取得
const { uploadCoverImage, uploading: coverImageUploading, error: imageError } = useImageUpload()
// カバー画像URLのリアクティブ参照を定義
const coverImageUrl = ref('')

// 選択されたカテゴリIDの配列を管理するリアクティブ変数
const selectedCategories = ref<number[]>([])

// 投稿データを読み込む非同期関数
const loadPost = async () => {
  // ローディング状態を開始
  loading.value = true
  try {
    // Supabaseから投稿データとカテゴリ関連データを取得
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories (
          category_id
        )
      `)
      .eq('id', route.params.id)
      .single()
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 投稿の編集権限をチェック：作成者本人または管理者のみ編集可能
    if (!user.value || (user.value.id !== data.author_id && !isAdmin.value)) {
      router.push('/posts')
      return
    }
    
    // 取得した投稿データを変数に格納
    post.value = data
    // フォームデータに投稿情報を設定
    form.value = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || '',
      published: data.published
    }
    
    // カバー画像URLを設定
    coverImageUrl.value = data.cover_image_url || ''
    
    // 投稿に関連付けられたカテゴリIDを抽出して設定
    selectedCategories.value = data.post_categories?.map(pc => pc.category_id) || []
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Post load error:', error instanceof Error ? error.stack : error)
    // ユーザー向けエラーメッセージを設定
    errorMessage.value = '投稿の読み込みに失敗しました'
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// カテゴリ一覧を読み込む非同期関数
const loadCategories = async () => {
  try {
    // Supabaseからカテゴリデータを名前順で取得
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    // 取得したカテゴリデータを変数に格納
    categories.value = data || []
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  }
}

// カバー画像アップロードを処理する非同期関数
const handleCoverImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file && user.value) {
    const imageUrl = await uploadCoverImage(file, user.value.id, post.value?.id)
    if (imageUrl) {
      coverImageUrl.value = imageUrl
    } else if (imageError.value) {
      errorMessage.value = imageError.value
    }
  }
}

// フォーム送信を処理する非同期関数
const handleSubmit = async () => {
  // 投稿データが存在しない場合は処理を中断
  if (!post.value) return

  // 内容が入力されているかチェック
  if (!form.value.content || !form.value.title.trim()) {
    errorMessage.value = 'タイトルと内容を入力してください'
    return
  }
  
  // メッセージをクリア
  errorMessage.value = ''
  successMessage.value = ''
  // 保存中状態を開始
  saveLoading.value = true
  
  try {
    // 投稿データを更新
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: form.value.title,
        content: form.value.content,
        excerpt: form.value.excerpt || null,
        cover_image_url: coverImageUrl.value || null,
        published: form.value.published,
        updated_at: new Date().toISOString()
      })
      .eq('id', post.value.id)
    
    // 投稿更新でエラーが発生した場合は例外をスロー
    if (updateError) throw updateError
    
    // 既存のカテゴリ関連データを削除
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', post.value.id)
    
    // カテゴリ削除でエラーが発生した場合は例外をスロー
    if (deleteError) throw deleteError
    
    // 新しいカテゴリ関連データを挿入（選択されたカテゴリがある場合）
    if (selectedCategories.value.length > 0) {
      // カテゴリ挿入用のデータ配列を作成
      const categoryInserts = selectedCategories.value.map(categoryId => ({
        post_id: post.value!.id,
        category_id: categoryId
      }))
      
      // カテゴリ関連データを挿入
      const { error: insertError } = await supabase
        .from('post_categories')
        .insert(categoryInserts)
      
      // カテゴリ挿入でエラーが発生した場合は例外をスロー
      if (insertError) throw insertError
    }
    
    // 成功メッセージを設定
    successMessage.value = '投稿を更新しました'
    // 1秒後に投稿詳細画面に遷移
    setTimeout(() => {
      router.push(`/posts/${post.value!.id}`)
    }, 1000)
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Post update error:', error instanceof Error ? error.stack : error)
    // ユーザー向けエラーメッセージを設定
    errorMessage.value = '投稿の更新に失敗しました'
  } finally {
    // 保存中状態を終了
    saveLoading.value = false
  }
}

// コンポーネントマウント時の処理
onMounted(async () => {
  // ユーザーが認証されていない場合はログイン画面に遷移
  if (!user.value) {
    router.push('/login')
    return
  }
  
  // 認証状態の確立を待つためのリトライ処理
  let retryCount = 0
  const maxRetries = 10
  
  // ユーザー状態が確立されるまで最大10回、100msずつ待機
  while (!user.value && retryCount < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100))
    retryCount++
  }
  
  // リトライ後もユーザーが認証されていない場合はログイン画面に遷移
  if (!user.value) {
    router.push('/login')
    return
  }
  
  // 投稿データとカテゴリデータを並行して読み込み
  Promise.all([
    loadPost(),
    loadCategories()
  ])
})
</script>
