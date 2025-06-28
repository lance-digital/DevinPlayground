<template>
  <div class="dashboard-posts-list">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-heading">投稿管理</h2>
      <div class="text-sm text-text-muted">
        全 {{ totalPosts }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 投稿がない場合 -->
    <div v-else-if="posts.length === 0" class="glass-card p-6 text-center">
      <p class="text-text-muted">
        まだ投稿はありません。
      </p>
    </div>
    
    <!-- 投稿リスト -->
    <div v-else class="space-y-4">
      <div v-for="post in posts" :key="post.id" class="glass-card p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex-1">
            <h3 class="mb-1 text-lg font-bold text-heading">
              <router-link :to="`/posts/${post.id}`" class="hover:text-primary">
                {{ post.title }}
              </router-link>
            </h3>
            <div class="flex items-center">
              <div class="inline-flex rounded-full px-2 py-1 bg-primary text-xs text-text-white">
                {{ post.published ? '公開中' : '下書き' }}
              </div>
              <div class="ml-2">
                <span class="text-sm text-text">{{ formatDate(post.updated_at || post.created_at) }}</span>
              </div>
            </div>
            <p class="mb-2 text-sm text-text-muted">
              {{ formatDate(post.created_at) }} · {{ post.views || 0 }} 閲覧
            </p>
            <div class="mb-2 flex flex-wrap gap-1">
              <router-link 
                v-for="category in post.categories" 
                :key="category.id"
                :to="`/categories/${category.id}`"
                class="rounded-full px-2 py-1 bg-primary/20 text-xs text-primary"
              >
                {{ category.name }}
              </router-link>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="mt-3 flex space-x-2 md:mt-0">
            <router-link :to="`/editor/${post.id}`" class="btn btn-outline-warning btn-sm">
              <PhPencilSimple class="mr-1 h-4 w-4" />
              編集
            </router-link>
            <button 
              @click="confirmDeletePost(post)" 
              class="btn btn-outline-error btn-sm"
            >
              <PhTrash class="mr-1 h-4 w-4" />
              削除
            </button>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <div class="flex space-x-2">
          <button 
            @click="changePage(currentPage - 1)" 
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage === 1"
          >
            前へ
          </button>
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            @click="changePage(page)" 
            class="btn btn-sm" 
            :class="page === currentPage ? 'btn-primary' : 'btn-outline-primary'"
          >
            {{ page }}
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            class="btn btn-outline-primary btn-sm"
            :disabled="currentPage === totalPages"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
      <div class="glass-card mx-auto max-w-md p-6">
        <h3 class="mb-4 text-xl font-bold text-heading">投稿を削除しますか？</h3>
        <p class="mb-6 text-text-muted">この操作は取り消せません。本当にこの投稿を削除しますか？</p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="btn btn-ghost">キャンセル</button>
          <button 
            @click="deletePost" 
            class="btn btn-error"
            :disabled="deleteSubmitting"
          >
            <PhSpinner v-if="deleteSubmitting" class="mr-2 h-5 w-5 animate-spin" />
            {{ deleteSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { PhSpinner, PhPencilSimple, PhTrash } from '@phosphor-icons/vue';

const authStore = useAuthStore();

// 状態
const posts = ref<any[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalPosts = ref(0);
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const selectedPost = ref<any>(null);
const error = ref('');

// 計算プロパティ
const totalPages = computed(() => Math.ceil(totalPosts.value / pageSize));

// 初期データ取得
onMounted(() => {
  fetchPosts();
});

// 投稿の取得
async function fetchPosts() {
  if (!authStore.user) {
    error.value = 'ユーザー情報が取得できません';
    loading.value = false;
    return;
  }

  loading.value = true;
  
  try {
    // 投稿数を取得
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('author_id', authStore.user.id)
      .eq('published', true);
    
    totalPosts.value = count || 0;
    
    // 投稿を取得（ページネーション対応）
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', authStore.user.id)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (postsError) throw postsError;
    
    // 各投稿のカテゴリを取得
    const postsWithCategories = await Promise.all((postsData || []).map(async (post) => {
      const { data: categoriesData } = await supabase
        .from('post_categories')
        .select(`
          category_id,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('post_id', post.id);
      
      return {
        ...post,
        categories: categoriesData?.map((item: any) => item.categories) || []
      };
    }));
    
    posts.value = postsWithCategories;
  } catch (err) {
    console.error('投稿取得エラー:', err);
    error.value = '投稿の取得に失敗しました';
  } finally {
    loading.value = false;
  }
}

// ページネーション
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  // ページトップへスクロール
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  fetchPosts();
}

// ページ番号の配列を取得
function getPageNumbers() {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    if (currentPage.value <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
    } else if (currentPage.value >= totalPages.value - 2) {
      for (let i = totalPages.value - 4; i <= totalPages.value; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage.value - 2; i <= currentPage.value + 2; i++) {
        pages.push(i);
      }
    }
  }
  
  return pages;
}

// 投稿削除確認
function confirmDeletePost(post: any) {
  selectedPost.value = post;
  showDeleteModal.value = true;
}

// 投稿削除
async function deletePost() {
  if (!selectedPost.value || !authStore.user) return;
  
  deleteSubmitting.value = true;
  
  try {
    // 投稿を削除（関連する画像は外部キー制約のCASCADEで自動的に削除される）
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', selectedPost.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // リストから削除
    posts.value = posts.value.filter(p => p.id !== selectedPost.value.id);
    totalPosts.value--;
    showDeleteModal.value = false;
    
    // ページが空になった場合は前のページに戻る
    if (posts.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchPosts();
    }
  } catch (err) {
    console.error('投稿削除エラー:', err);
    alert('投稿の削除に失敗しました');
  } finally {
    deleteSubmitting.value = false;
  }
}

// 日付フォーマット
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateString;
  }
}
</script> 