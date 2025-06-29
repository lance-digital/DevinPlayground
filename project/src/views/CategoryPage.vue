<template>
  <div class="min-h-screen bg-background p-4">
    <div class="max-w-4xl mx-auto">
      <h1 
        data-testid="カテゴリ管理-タイトル"
        class="text-3xl font-bold text-heading mb-6"
      >
        カテゴリ管理
      </h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="glass-card">
          <h2 class="text-xl font-semibold text-heading mb-4">
            新しいカテゴリを作成
          </h2>
          
          <form 
            data-testid="カテゴリ管理-作成フォーム"
            @submit.prevent="createCategory"
            class="space-y-4"
          >
            <div>
              <label for="name" class="block text-text-muted text-sm font-medium mb-2">
                カテゴリ名
              </label>
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
            
            <div>
              <label for="description" class="block text-text-muted text-sm font-medium mb-2">
                説明（任意）
              </label>
              <textarea
                id="description"
                data-testid="カテゴリ管理-説明入力"
                v-model="newCategory.description"
                rows="3"
                maxlength="200"
                class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="カテゴリの説明を入力してください（任意）"
              />
            </div>
            
            <div 
              v-if="createError"
              data-testid="カテゴリ管理-作成エラーメッセージ"
              class="text-error text-sm"
            >
              {{ createError }}
            </div>
            
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
        
        <div class="glass-card">
          <h2 class="text-xl font-semibold text-heading mb-4">
            カテゴリ一覧
          </h2>
          
          <div 
            v-if="loading"
            class="text-center text-text-muted py-8"
          >
            読み込み中...
          </div>
          
          <div 
            v-else-if="categories.length === 0"
            class="text-center text-text-muted py-8"
          >
            カテゴリがありません
          </div>
          
          <div 
            v-else
            data-testid="カテゴリ管理-リスト"
            class="space-y-3"
          >
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="border border-border-light rounded-md p-4"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <h3 class="font-semibold text-heading">
                    {{ category.name }}
                  </h3>
                  <p 
                    v-if="category.description"
                    class="text-text-muted text-sm mt-1"
                  >
                    {{ category.description }}
                  </p>
                  <p class="text-text-muted text-xs mt-2">
                    作成者: {{ category.profiles?.nickname || 'Unknown' }}
                  </p>
                </div>
                
                <div v-if="canDeleteCategory(category)" class="ml-4">
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
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Category = Database['public']['Tables']['categories']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

const { user, isAdmin } = useAuth()

const categories = ref<Category[]>([])
const loading = ref(false)
const createLoading = ref(false)
const deleteLoading = ref(false)
const createError = ref('')

const newCategory = ref({
  name: '',
  description: ''
})

const canDeleteCategory = (category: Category) => {
  return user.value && (
    user.value.id === category.creator_id || 
    isAdmin.value
  )
}

const loadCategories = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        profiles:creator_id (nickname)
      `)
      .order('name')
    
    if (error) throw error
    categories.value = data || []
  } catch (error) {
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  } finally {
    loading.value = false
  }
}

const createCategory = async () => {
  if (!user.value || !newCategory.value.name.trim()) return
  
  createError.value = ''
  createLoading.value = true
  
  try {
    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategory.value.name.trim(),
        description: newCategory.value.description.trim() || null,
        creator_id: user.value.id
      })
    
    if (error) throw error
    
    newCategory.value = {
      name: '',
      description: ''
    }
    
    await loadCategories()
  } catch (error) {
    console.error('Category create error:', error instanceof Error ? error.stack : error)
    createError.value = 'カテゴリの作成に失敗しました'
  } finally {
    createLoading.value = false
  }
}

const deleteCategory = async (categoryId: number) => {
  if (!confirm('このカテゴリを削除しますか？')) return
  
  deleteLoading.value = true
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) throw error
    await loadCategories()
  } catch (error) {
    console.error('Category delete error:', error instanceof Error ? error.stack : error)
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  loadCategories()
})
</script>
