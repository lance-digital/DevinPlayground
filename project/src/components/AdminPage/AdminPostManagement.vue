<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-heading">投稿管理</h2>
      <button 
        @click="fetchPosts"
        class="btn btn-outline-primary btn-sm flex items-center gap-1"
        :disabled="loading"
      >
        <PhArrowClockwise 
          class="h-4 w-4"
          :class="{ 'animate-spin': loading }"
        />
        更新
      </button>
    </div>
    
    <!-- 検索・フィルター -->
    <div class="glass-card mb-6 p-4">
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="タイトル、作者名で検索..."
            class="input w-full"
            @input="debouncedSearch"
          />
        </div>
        <div class="flex gap-2">
          <select v-model="filterStatus" class="select">
            <option value="">すべての投稿</option>
            <option value="published">公開済み</option>
            <option value="draft">下書き</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-8">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 投稿一覧 -->
    <div v-else class="glass-card">
      <div v-if="filteredPosts.length === 0" class="p-6 text-center">
        <p class="text-text-muted">投稿が見つかりません。</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-text-muted">投稿</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">作者</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">ステータス</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">統計</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">作成日</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr 
              v-for="post in filteredPosts" 
              :key="post.id"
              class="hover:bg-surface-variant/30"
            >
              <td class="p-4">
                <div class="flex items-start space-x-3">
                  <div v-if="post.cover_image_path" class="h-12 w-12 rounded bg-surface-variant flex-shrink-0">
                    <img 
                      :src="getImageUrl(post.cover_image_path)" 
                      :alt="post.title"
                      class="h-full w-full rounded object-cover"
                    />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-text line-clamp-2">{{ post.title }}</div>
                    <div class="text-sm text-text-muted line-clamp-1">{{ post.excerpt }}</div>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <div class="text-sm text-text">{{ post.author?.nickname || '不明' }}</div>
                <div class="text-xs text-text-muted">{{ post.author?.account_id }}</div>
              </td>
              <td class="p-4">
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="post.published ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'"
                >
                  {{ post.published ? '公開済み' : '下書き' }}
                </span>
              </td>
              <td class="p-4">
                <div class="text-sm text-text-muted">
                  <div>閲覧: {{ post.view_count || 0 }}</div>
                  <div>いいね: {{ post.like_count || 0 }}</div>
                  <div>コメント: {{ post.comment_count || 0 }}</div>
                </div>
              </td>
              <td class="p-4">
                <span class="text-sm text-text-muted">{{ formatDate(post.created_at) }}</span>
              </td>
              <td class="p-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewPost(post)"
                    class="btn btn-sm btn-outline-primary"
                  >
                    表示
                  </button>
                  <button
                    @click="togglePublishStatus(post)"
                    class="btn btn-sm"
                    :class="post.published ? 'btn-outline-warning' : 'btn-outline-success'"
                  >
                    {{ post.published ? '非公開' : '公開' }}
                  </button>
                  <button
                    @click="deletePost(post)"
                    class="btn btn-sm btn-outline-error"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { getPostImageUrl } from '../../lib/storage';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
// Simple debounce implementation to avoid external dependency
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
import { 
  PhSpinner, 
  PhArrowClockwise
} from '@phosphor-icons/vue';

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  published: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: {
    nickname: string | null;
    account_id: string;
  } | null;
}

const loading = ref(true);
const posts = ref<Post[]>([]);
const searchQuery = ref('');
const filterStatus = ref('');

const filteredPosts = computed(() => {
  let filtered = posts.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.author?.nickname?.toLowerCase().includes(query)
    );
  }
  
  if (filterStatus.value === 'published') {
    filtered = filtered.filter(post => post.published);
  } else if (filterStatus.value === 'draft') {
    filtered = filtered.filter(post => !post.published);
  }
  
  return filtered;
});

const debouncedSearch = debounce(() => {
  // 検索は computed で自動的に実行される
}, 300);

onMounted(() => {
  fetchPosts();
});

async function fetchPosts() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        cover_image_path,
        published,
        view_count,
        created_at,
        profiles:author_id (
          nickname,
          account_id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
        const [likeCount, commentCount] = await Promise.all([
          supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id),
          supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id)
        ]);
        
        return {
          ...post,
          author: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
          like_count: likeCount.count || 0,
          comment_count: commentCount.count || 0
        };
      })
    );
    
    posts.value = postsWithCounts;
    
  } catch (err) {
    console.error('投稿取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

async function togglePublishStatus(post: Post) {
  const newStatus = !post.published;
  const confirmMessage = newStatus 
    ? `「${post.title}」を公開しますか？`
    : `「${post.title}」を非公開にしますか？`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase
      .from('posts')
      .update({ published: newStatus })
      .eq('id', post.id);
    
    if (error) throw error;
    
    post.published = newStatus;
    
    alert(newStatus ? '投稿を公開しました。' : '投稿を非公開にしました。');
    
  } catch (err) {
    console.error('公開状態変更エラー:', err);
    alert('公開状態の変更に失敗しました。');
  }
}

async function deletePost(post: Post) {
  const confirmMessage = `「${post.title}」を完全に削除しますか？この操作は取り消せません。`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);
    
    if (error) throw error;
    
    posts.value = posts.value.filter(p => p.id !== post.id);
    
    alert('投稿を削除しました。');
    
  } catch (err) {
    console.error('投稿削除エラー:', err);
    alert('投稿の削除に失敗しました。');
  }
}

function viewPost(post: Post) {
  window.open(`/posts/${post.id}`, '_blank');
}

function getImageUrl(path: string) {
  return getPostImageUrl(path);
}

function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateString;
  }
}
</script>
