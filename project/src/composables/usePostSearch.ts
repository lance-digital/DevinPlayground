import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
  categories?: Database['public']['Tables']['categories']['Row'][]
}

export const usePostSearch = () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const errorMessage = ref('')

  const searchPosts = async (searchQuery: string = '', categoryName: string = '', sortBy: string = 'newest') => {
    loading.value = true
    errorMessage.value = ''
    
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

      if (searchQuery.trim()) {
        const { data: searchResults, error: searchError } = await supabase
          .rpc('search_posts', { search_term: searchQuery.trim() })
        
        if (searchError) {
          console.error('Search function error:', searchError)
          query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        } else if (searchResults && searchResults.length > 0) {
          const postIds = searchResults.map((result: any) => result.id)
          query = query.in('id', postIds)
        } else {
          posts.value = []
          loading.value = false
          return
        }
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error

      let processedPosts = (data || []).map(post => ({
        ...post,
        categories: post.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || []
      }))

      if (categoryName) {
        processedPosts = processedPosts.filter(post => 
          post.categories?.some((cat: any) => cat.name === categoryName)
        )
      }

      posts.value = processedPosts
    } catch (error) {
      console.error('Posts search error:', error instanceof Error ? error.stack : error)
      errorMessage.value = 'データの取得に失敗しました'
    } finally {
      loading.value = false
    }
  }

  return {
    posts,
    loading,
    errorMessage,
    searchPosts
  }
}
