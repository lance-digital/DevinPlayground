<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="glass-card max-w-md w-full">
      <h1 class="text-2xl font-bold text-heading text-center mb-6">
        ログイン
      </h1>
      
      <form 
        data-testid="ログイン-フォーム"
        @submit.prevent="handleSubmit"
        class="space-y-4"
      >
        <div>
          <label for="identifier" class="block text-text-muted text-sm font-medium mb-2">
            メールアドレスまたはアカウントID
          </label>
          <input
            id="identifier"
            data-testid="ログイン-識別子入力"
            v-model="form.identifier"
            type="text"
            required
            class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="your@email.com または @username"
          />
        </div>
        
        <div>
          <label for="password" class="block text-text-muted text-sm font-medium mb-2">
            パスワード
          </label>
          <input
            id="password"
            data-testid="ログイン-パスワード入力"
            v-model="form.password"
            type="password"
            required
            class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="パスワード"
          />
        </div>
        
        <div 
          v-if="errorMessage"
          data-testid="ログイン-エラーメッセージ"
          class="text-error text-sm"
        >
          {{ errorMessage }}
        </div>
        
        <button
          data-testid="ログイン-送信ボタン"
          type="submit"
          :disabled="loading"
          class="w-full btn btn-primary"
        >
          {{ loading ? 'ログイン中...' : 'ログイン' }}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-text-muted text-sm">
          アカウントをお持ちでない方は
          <router-link to="/register" class="text-primary hover:text-primary-light">
            新規登録
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

const { login, loading } = useAuth()
const router = useRouter()

const form = ref({
  identifier: '',
  password: ''
})

const errorMessage = ref('')

const handleSubmit = async () => {
  errorMessage.value = ''
  
  if (!form.value.identifier || !form.value.password) {
    errorMessage.value = 'すべての項目を入力してください'
    return
  }
  
  try {
    await login(form.value.identifier, form.value.password)
    router.push('/posts')
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.stack : error)
    errorMessage.value = error instanceof Error ? error.message : 'ログインに失敗しました'
    console.log('Error message set to:', errorMessage.value)
  }
}
</script>
