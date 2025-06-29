<template>
  <!-- ユーザー登録画面のメインコンテナ：全画面高さで背景色を設定し中央配置 -->
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <!-- 登録フォームのカードコンテナ：ガラス効果と最大幅を設定 -->
    <div class="glass-card max-w-md w-full">
      <!-- ページタイトル：新規登録の見出し -->
      <h1 class="text-2xl font-bold text-heading text-center mb-6">
        新規登録
      </h1>
      
      <!-- 登録フォーム：送信時にhandleSubmitを実行し、デフォルト動作を防止 -->
      <form 
        data-testid="ユーザー登録-フォーム"
        @submit.prevent="handleSubmit"
        class="space-y-4"
      >
        <!-- メールアドレス入力フィールドのコンテナ -->
        <div>
          <!-- メールアドレス入力のラベル -->
          <label for="email" class="block text-text-muted text-sm font-medium mb-2">
            メールアドレス
          </label>
          <!-- メールアドレス入力フィールド：v-modelでフォーム状態と双方向バインディング -->
          <input
            id="email"
            data-testid="ユーザー登録-メールアドレス入力"
            v-model="form.email"
            type="email"
            required
            class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        
        <!-- パスワード入力フィールドのコンテナ -->
        <div>
          <!-- パスワード入力のラベル -->
          <label for="password" class="block text-text-muted text-sm font-medium mb-2">
            パスワード
          </label>
          <!-- パスワード入力フィールド：v-modelでフォーム状態と双方向バインディング -->
          <input
            id="password"
            data-testid="ユーザー登録-パスワード入力"
            v-model="form.password"
            type="password"
            required
            class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="6文字以上のパスワード"
          />
        </div>
        
        <!-- ニックネーム入力フィールドのコンテナ -->
        <div>
          <!-- ニックネーム入力のラベル -->
          <label for="nickname" class="block text-text-muted text-sm font-medium mb-2">
            ニックネーム
          </label>
          <!-- ニックネーム入力フィールド：v-modelでフォーム状態と双方向バインディング、最大30文字制限 -->
          <input
            id="nickname"
            data-testid="ユーザー登録-ニックネーム入力"
            v-model="form.nickname"
            type="text"
            required
            maxlength="30"
            class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="ニックネーム"
          />
        </div>
        
        <!-- エラーメッセージ表示エリア：errorMessageが存在する場合のみ表示 -->
        <div 
          v-if="errorMessage"
          data-testid="ユーザー登録-エラーメッセージ"
          class="text-error text-sm"
        >
          {{ errorMessage }}
        </div>
        
        <!-- 成功メッセージ表示エリア：successMessageが存在する場合のみ表示 -->
        <div 
          v-if="successMessage"
          data-testid="ユーザー登録-成功メッセージ"
          class="text-success text-sm"
        >
          {{ successMessage }}
        </div>
        
        <!-- 送信ボタン：ローディング中は無効化し、ボタンテキストを動的に変更 -->
        <button
          data-testid="ユーザー登録-送信ボタン"
          type="submit"
          :disabled="loading"
          class="w-full btn btn-primary"
        >
          {{ loading ? '登録中...' : '新規登録' }}
        </button>
      </form>
      
      <!-- ログインページへのリンクエリア -->
      <div class="mt-6 text-center">
        <!-- 既存アカウント保持者向けのログインリンク案内 -->
        <p class="text-text-muted text-sm">
          すでにアカウントをお持ちですか？
          <router-link to="/login" class="text-primary hover:text-primary-light">
            ログイン
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { register, loading } = useAuth()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
  nickname: ''
})

const errorMessage = ref('')
const successMessage = ref('')

// フォーム送信処理を実行する非同期関数
const handleSubmit = async () => {
  // 前回のメッセージをクリア
  errorMessage.value = ''
  successMessage.value = ''
  
  // 必須項目の入力チェック：いずれかが空の場合はエラー
  if (!form.value.email || !form.value.password || !form.value.nickname) {
    errorMessage.value = 'すべての項目を入力してください'
    return
  }
  
  // パスワード長の検証：6文字未満の場合はエラー
  if (form.value.password.length < 6) {
    errorMessage.value = 'パスワードは6文字以上で入力してください'
    return
  }
  
  // ユーザー登録処理の実行
  try {
    // 認証コンポーザブルの登録関数を呼び出し
    await register(form.value.email, form.value.password, form.value.nickname)
    // 登録成功時のメッセージを設定
    successMessage.value = 'ユーザー登録が完了しました。メールアドレスを確認してください。'
    
    // 2秒後にログインページへ自動遷移
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    // 登録エラーをコンソールに出力（スタック情報も含む）
    console.error('Registration error:', error instanceof Error ? error.stack : error)
    // ユーザー向けエラーメッセージを設定
    errorMessage.value = error instanceof Error ? error.message : 'ユーザー登録に失敗しました'
  }
}
</script>
