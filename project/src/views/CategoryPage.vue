<template>
  <!-- カテゴリ管理ページのメインコンテナ -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅の設定とセンタリング -->
    <div class="max-w-4xl mx-auto">
      <!-- ページタイトルの表示 -->
      <h1 
        data-testid="カテゴリ管理-タイトル"
        class="text-3xl font-bold text-heading mb-6"
      >
        カテゴリ管理
      </h1>
      
      <!-- グリッドレイアウトでフォームと一覧を配置 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- カテゴリ作成フォームのカード -->
        <div class="glass-card">
          <!-- フォームのタイトル -->
          <h2 class="text-xl font-semibold text-heading mb-4">
            新しいカテゴリを作成
          </h2>
          
          <!-- カテゴリ作成フォーム -->
          <form 
            data-testid="カテゴリ管理-作成フォーム"
            @submit.prevent="createCategory"
            class="space-y-4"
          >
            <!-- カテゴリ名入力フィールド -->
            <div>
              <!-- カテゴリ名のラベル -->
              <label for="name" class="block text-text-muted text-sm font-medium mb-2">
                カテゴリ名
              </label>
              <!-- カテゴリ名の入力欄 -->
              <input
                id="name"
                data-testid="カテゴリ管理-名前入力"
                v-model="newCategory.name"
                type="text"
                required
                maxlength="50"
                class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="カテゴリ名を入力してください"
              />
            </div>
            
            <!-- エラーメッセージの表示エリア -->
            <div 
              v-if="createError"
              data-testid="カテゴリ管理-作成エラーメッセージ"
              class="text-error text-sm"
            >
              {{ createError }}
            </div>
            
            <!-- カテゴリ作成ボタン -->
            <button
              data-testid="カテゴリ管理-作成ボタン"
              type="submit"
              :disabled="createLoading || !newCategory.name.trim()"
              class="btn btn-primary"
            >
              {{ createLoading ? '作成中...' : 'カテゴリを作成' }}
            </button>
          </form>
        </div>
        
        <!-- カテゴリ一覧表示のカード -->
        <div class="glass-card">
          <!-- カテゴリ一覧のタイトル -->
          <h2 class="text-xl font-semibold text-heading mb-4">
            カテゴリ一覧
          </h2>
          
          <!-- ローディング状態の表示 -->
          <div 
            v-if="loading"
            class="text-center text-text-muted py-8"
          >
            読み込み中...
          </div>
          
          <!-- カテゴリが存在しない場合の表示 -->
          <div 
            v-else-if="categories.length === 0"
            class="text-center text-text-muted py-8"
          >
            カテゴリがありません
          </div>
          
          <!-- カテゴリリストの表示（データがある場合） -->
          <div 
            v-else
            data-testid="カテゴリ管理-リスト"
            class="space-y-3"
          >
            <!-- 各カテゴリのアイテム表示 -->
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="border border-border-light rounded-md p-4"
            >
              <!-- カテゴリ情報と削除ボタンのレイアウト -->
              <div class="flex justify-between items-start">
                <!-- カテゴリ情報の表示エリア -->
                <div class="flex-1">
                  <!-- カテゴリ名の表示 -->
                  <h3 class="font-semibold text-heading">
                    {{ category.name }}
                  </h3>
                  <!-- 作成者情報の表示 -->
                  <p class="text-text-muted text-xs mt-2">
                    作成者: {{ category.profiles?.nickname || 'Unknown' }}
                  </p>
                </div>
                
                <!-- 削除ボタンのエリア（権限がある場合のみ表示） -->
                <div v-if="canDeleteCategory(category)" class="ml-4">
                  <!-- 削除ボタン -->
                  <button
                    @click="deleteCategory(category.id)"
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsの必要な機能をインポート
import { ref, onMounted } from 'vue'
// 認証機能のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseの型定義をインポート
import type { Database } from '@/lib/supabase'

// カテゴリデータの型定義（プロフィール情報を含む）
type Category = Database['public']['Tables']['categories']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'] // 作成者のプロフィール情報
}

// 認証情報を取得
const { user, isAdmin } = useAuth()

// リアクティブな状態変数の定義
const categories = ref<Category[]>([]) // カテゴリ一覧データ
const loading = ref(false) // ローディング状態
const createLoading = ref(false) // カテゴリ作成中の状態
const deleteLoading = ref(false) // カテゴリ削除中の状態
const createError = ref('') // カテゴリ作成時のエラーメッセージ

// 新規カテゴリ作成用のフォームデータ
const newCategory = ref({
  name: '' // カテゴリ名
})

// カテゴリ削除権限の確認関数
const canDeleteCategory = (category: Category) => {
  // ユーザーが作成者または管理者の場合に削除可能
  return user.value && (
    user.value.id === category.creator_id || 
    isAdmin.value
  )
}

// カテゴリ一覧を読み込む関数
const loadCategories = async () => {
  // ローディング状態を開始
  loading.value = true
  try {
    // Supabaseからカテゴリデータを取得（作成者情報も含む）
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        profiles:creator_id (nickname)
      `)
      .order('name') // カテゴリ名でソート
    
    // エラーがある場合は例外を投げる
    if (error) throw error
    // 取得したデータを状態に設定
    categories.value = data || []
  } catch (error) {
    // エラーログを出力（スタック情報も含む）
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// 新しいカテゴリを作成する関数
const createCategory = async () => {
  // ユーザーが未認証またはカテゴリ名が空の場合は処理を中断
  if (!user.value || !newCategory.value.name.trim()) return
  
  // エラーメッセージをクリア
  createError.value = ''
  // 作成中状態を開始
  createLoading.value = true
  
  try {
    // Supabaseにカテゴリデータを挿入
    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategory.value.name.trim(), // カテゴリ名（前後の空白を除去）
        creator_id: user.value.id // 作成者ID
      })
    
    // エラーがある場合は例外を投げる
    if (error) throw error
    
    // フォームをリセット
    newCategory.value = {
      name: ''
    }
    
    // カテゴリ一覧を再読み込み
    await loadCategories()
  } catch (error) {
    // エラーログを出力（スタック情報も含む）
    console.error('Category create error:', error instanceof Error ? error.stack : error)
    // ユーザー向けエラーメッセージを設定
    createError.value = 'カテゴリの作成に失敗しました'
  } finally {
    // 作成中状態を終了
    createLoading.value = false
  }
}

// カテゴリを削除する関数
const deleteCategory = async (categoryId: number) => {
  // 削除確認ダイアログを表示
  if (!confirm('このカテゴリを削除しますか？')) return
  
  // 削除中状態を開始
  deleteLoading.value = true
  try {
    // Supabaseからカテゴリを削除
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId) // 指定されたIDのカテゴリを削除
    
    // エラーがある場合は例外を投げる
    if (error) throw error
    // カテゴリ一覧を再読み込み
    await loadCategories()
  } catch (error) {
    // エラーログを出力（スタック情報も含む）
    console.error('Category delete error:', error instanceof Error ? error.stack : error)
  } finally {
    // 削除中状態を終了
    deleteLoading.value = false
  }
}

// コンポーネントマウント時にカテゴリ一覧を読み込み
onMounted(() => {
  loadCategories()
})
</script>
