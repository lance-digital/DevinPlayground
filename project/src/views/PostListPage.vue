<template>
  <div class="min-h-screen bg-background p-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 
          data-testid="投稿一覧-タイトル"
          class="text-3xl font-bold text-heading"
        >
          投稿一覧
        </h1>
        <router-link 
          data-testid="投稿一覧-作成ボタン"
          to="/posts/create"
          class="btn btn-primary"
        >
          新規投稿
        </router-link>
      </div>
      
      <div class="mb-6 flex flex-wrap gap-4">
        <select
          data-testid="投稿一覧-カテゴリフィルター"
          v-model="selectedCategory"
          @change="loadPosts"
          class="px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">すべてのカテゴリ</option>
          <option 
            v-for="category in categories" 
            :key="category.id" 
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        
        <select
          data-testid="投稿一覧-並び順フィルター"
          v-model="sortOrder"
          @change="loadPosts"
          class="px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="created_at_desc">新しい順</option>
          <option value="created_at_asc">古い順</option>
          <option value="title_asc">タイトル順</option>
        </select>
      </div>
      
      <div 
        v-if="loading"
        class="text-center text-text-muted"
      >
        読み込み中...
      </div>
      
      <div 
        v-else-if="posts.length === 0"
        class="text-center text-text-muted"
      >
        投稿がありません
      </div>
      
      <div 
        v-else
        data-testid="投稿一覧-リスト"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <article 
          v-for="post in posts" 
          :key="post.id"
          class="glass-card hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateToPost(post.id)"
        >
          <div 
            v-if="post.cover_image_path"
            class="w-full h-48 bg-surface-accent rounded-md mb-4 overflow-hidden"
          >
            <img 
              :src="getImageUrl(post.cover_image_path)"
              :alt="post.title"
              class="w-full h-full object-cover"
            />
          </div>
          
          <h2 class="text-xl font-semibold text-heading mb-2 line-clamp-2">
            {{ post.title }}
          </h2>
          
          <p 
            v-if="post.excerpt"
            class="text-text-muted text-sm mb-4 line-clamp-3"
          >
            {{ post.excerpt }}
          </p>
          
          <div class="flex items-center justify-between text-sm text-text-muted">
            <span>{{ post.profiles?.nickname || 'Unknown' }}</span>
            <span>{{ formatDate(post.created_at) }}</span>
          </div>
          
          <div 
            v-if="post.categories && post.categories.length > 0"
            class="mt-2 flex flex-wrap gap-1"
          >
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
  categories?: Database['public']['Tables']['categories']['Row'][]
}

type Category = Database['public']['Tables']['categories']['Row']

const router = useRouter()

const posts = ref<Post[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const selectedCategory = ref('')
const sortOrder = ref('created_at_desc')

const loadPosts = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id (nickname),
        post_categories (
          categories (id, name)
        )
      `)
      .eq('published', true)
    
    if (selectedCategory.value) {
      query = query.contains('post_categories.category_id', [selectedCategory.value])
    }
    
    const [orderField, orderDirection] = sortOrder.value.split('_')
    const actualOrderField = orderField === 'created' ? 'created_at' : orderField
    query = query.order(actualOrderField, { ascending: orderDirection === 'asc' })
    
    const { data, error } = await query
    
    if (error) throw error
    
    posts.value = (data || []).map(post => ({
      ...post,
      categories: post.post_categories?.map(pc => pc.categories).filter(Boolean) || []
    }))
  } catch (error) {
    console.error('Posts load error:', error instanceof Error ? error.stack : error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    categories.value = data || []
  } catch (error) {
    console.error('Categories load error:', error instanceof Error ? error.stack : error)
  }
}

const navigateToPost = (postId: number) => {
  router.push(`/posts/${postId}`)
}

const getImageUrl = (path: string) => {
  const { data } = supabase.storage.from('post_images').getPublicUrl(path)
  return data.publicUrl
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ja-JP')
}

onMounted(() => {
  loadPosts()
  loadCategories()
})
</script>
