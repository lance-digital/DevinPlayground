<template>
  <!-- プロフィール管理画面のメインコンテナ -->
  <div class="min-h-screen bg-background p-4">
    <!-- 最大幅を制限したコンテンツエリア -->
    <div class="max-w-4xl mx-auto">
      <!-- ガラス効果のカードコンテナ -->
      <div class="glass-card">
        <!-- ページタイトル -->
        <h1 class="text-2xl font-bold text-heading mb-6">
          プロフィール
        </h1>
        
        <!-- プロフィール表示モード（編集中でない場合） -->
        <div 
          v-if="!isEditing"
          data-testid="プロフィール管理-プロフィール表示"
          class="space-y-4"
        >
          <!-- ユーザー基本情報の表示エリア -->
          <div class="flex items-center space-x-4">
            <!-- アバター表示（ニックネームの頭文字） -->
            <div class="w-20 h-20 bg-surface-accent rounded-full flex items-center justify-center">
              <span class="text-2xl text-text">
                {{ profile?.nickname?.charAt(0) || 'U' }}
              </span>
            </div>
            <!-- ユーザー情報テキスト -->
            <div>
              <!-- ニックネーム表示 -->
              <h2 
                data-testid="プロフィール管理-ニックネーム表示"
                class="text-xl font-semibold text-heading"
              >
                {{ profile?.nickname || 'ユーザー' }}
              </h2>
              <!-- アカウントID表示 -->
              <p 
                data-testid="プロフィール管理-アカウントID表示"
                class="text-text-muted"
              >
                @{{ profile?.account_id || 'unknown' }}
              </p>
              <!-- 管理者権限表示（管理者の場合のみ） -->
              <p 
                v-if="profile?.is_admin"
                class="text-accent1 text-sm font-medium"
              >
                管理者
              </p>
            </div>
          </div>
          
          <!-- 自己紹介セクション（設定されている場合のみ） -->
          <div v-if="profile?.bio">
            <!-- 自己紹介見出し -->
            <h3 class="text-heading font-medium mb-2">自己紹介</h3>
            <!-- 自己紹介本文 -->
            <p class="text-text">{{ profile.bio }}</p>
          </div>
          
          <!-- 編集開始ボタン -->
          <button
            data-testid="プロフィール管理-編集ボタン"
            @click="startEditing"
            class="btn btn-primary"
          >
            プロフィールを編集
          </button>
        </div>
        
        <!-- プロフィール編集フォーム（編集中の場合） -->
        <form 
          v-else
          data-testid="プロフィール管理-編集フォーム"
          @submit.prevent="handleUpdate"
          class="space-y-4"
        >
          <!-- ニックネーム入力フィールド -->
          <div>
            <!-- ニックネームラベル -->
            <label for="nickname" class="block text-text-muted text-sm font-medium mb-2">
              ニックネーム
            </label>
            <!-- ニックネーム入力欄 -->
            <input
              id="nickname"
              data-testid="プロフィール管理-ニックネーム入力"
              v-model="editForm.nickname"
              type="text"
              required
              maxlength="30"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <!-- 自己紹介入力フィールド -->
          <div>
            <!-- 自己紹介ラベル -->
            <label for="bio" class="block text-text-muted text-sm font-medium mb-2">
              自己紹介
            </label>
            <!-- 自己紹介入力欄（テキストエリア） -->
            <textarea
              id="bio"
              data-testid="プロフィール管理-自己紹介入力"
              v-model="editForm.bio"
              rows="4"
              maxlength="500"
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="自己紹介を入力してください"
            />
          </div>
          
          <!-- エラーメッセージ表示（エラーがある場合のみ） -->
          <div 
            v-if="errorMessage"
            data-testid="プロフィール管理-エラーメッセージ"
            class="text-error text-sm"
          >
            {{ errorMessage }}
          </div>
          
          <!-- 成功メッセージ表示（成功メッセージがある場合のみ） -->
          <div 
            v-if="successMessage"
            data-testid="プロフィール管理-成功メッセージ"
            class="text-success text-sm"
          >
            {{ successMessage }}
          </div>
          
          <!-- フォーム操作ボタン群 -->
          <div class="flex space-x-4">
            <!-- 保存ボタン -->
            <button
              data-testid="プロフィール管理-保存ボタン"
              type="submit"
              :disabled="loading"
              class="btn btn-primary"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
            <!-- キャンセルボタン -->
            <button
              data-testid="プロフィール管理-キャンセルボタン"
              type="button"
              @click="cancelEditing"
              class="btn btn-outline-secondary"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted } from 'vue'
// 認証関連のコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'

// 認証コンポーザブルからプロフィール情報とロード関数を取得
const { profile, loadProfile } = useAuth()

// 編集モードの状態を管理するリアクティブ変数
const isEditing = ref(false)
// ローディング状態を管理するリアクティブ変数
const loading = ref(false)
// エラーメッセージを管理するリアクティブ変数
const errorMessage = ref('')
// 成功メッセージを管理するリアクティブ変数
const successMessage = ref('')

// 編集フォームのデータを管理するリアクティブオブジェクト
const editForm = ref({
  nickname: '', // ニックネーム
  bio: ''       // 自己紹介
})

// 編集モードを開始する関数
const startEditing = () => {
  // 現在のプロフィール情報をフォームに設定
  editForm.value.nickname = profile.value?.nickname || ''
  editForm.value.bio = profile.value?.bio || ''
  // 編集モードを有効化
  isEditing.value = true
  // メッセージをクリア
  errorMessage.value = ''
  successMessage.value = ''
}

// 編集をキャンセルする関数
const cancelEditing = () => {
  // 編集モードを無効化
  isEditing.value = false
  // メッセージをクリア
  errorMessage.value = ''
  successMessage.value = ''
}

// プロフィール更新を処理する非同期関数
const handleUpdate = async () => {
  // プロフィール情報が存在しない場合は処理を終了
  if (!profile.value) return
  
  // ローディング状態を開始
  loading.value = true
  // メッセージをクリア
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    // Supabaseでプロフィール情報を更新
    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: editForm.value.nickname,    // ニックネームを更新
        bio: editForm.value.bio,              // 自己紹介を更新
        updated_at: new Date().toISOString()  // 更新日時を設定
      })
      .eq('id', profile.value.id)  // プロフィールIDで条件指定
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // プロフィール情報を再読み込み
    await loadProfile()
    // 成功メッセージを設定
    successMessage.value = 'プロフィールを更新しました'
    // 編集モードを終了
    isEditing.value = false
  } catch (error) {
    // エラーログを出力（スタックトレース付き）
    console.error('Profile update error:', error instanceof Error ? error.stack : error)
    // ユーザー向けエラーメッセージを設定
    errorMessage.value = 'プロフィールの更新に失敗しました'
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// コンポーネントマウント時の処理
onMounted(() => {
  // プロフィール情報が存在しない場合は読み込み
  if (!profile.value) {
    loadProfile()
  }
})
</script>
