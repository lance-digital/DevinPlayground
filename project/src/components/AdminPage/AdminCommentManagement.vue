<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-heading">コメント管理</h2>
      <button 
        @click="fetchComments"
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
            placeholder="コメント内容、投稿タイトル、作者名で検索..."
            class="input w-full"
            @input="debouncedSearch"
          />
        </div>
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-8">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- コメント一覧 -->
    <div v-else class="glass-card">
      <div v-if="filteredComments.length === 0" class="p-6 text-center">
        <p class="text-text-muted">コメントが見つかりません。</p>
      </div>
      <div v-else class="divide-y divide-border">
        <div 
          v-for="comment in filteredComments" 
          :key="comment.id"
          class="p-4 hover:bg-surface-variant/30"
        >
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <!-- コメント内容 -->
              <div class="mb-2">
                <p class="text-sm text-text line-clamp-3">{{ comment.content }}</p>
              </div>
              
              <!-- メタ情報 -->
              <div class="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                <div class="flex items-center gap-1">
                  <PhUser class="h-3 w-3" />
                  <span>{{ comment.author?.nickname || '不明' }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <PhArticle class="h-3 w-3" />
                  <span>{{ comment.post?.title || '投稿が削除されました' }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <PhClock class="h-3 w-3" />
                  <span>{{ formatDate(comment.created_at) }}</span>
                </div>
                <div v-if="comment.like_count > 0" class="flex items-center gap-1">
                  <PhHeart class="h-3 w-3" />
                  <span>{{ comment.like_count }}</span>
                </div>
              </div>
            </div>
            
            <!-- 操作ボタン -->
            <div class="ml-4 flex items-center space-x-2">
              <button
                @click="viewPost(comment)"
                class="btn btn-sm btn-outline-primary"
                :disabled="!comment.post"
              >
                投稿を表示
              </button>
              <button
                @click="deleteComment(comment)"
                class="btn btn-sm btn-outline-error"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
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
  PhUser,
  PhArticle,
  PhClock,
  PhHeart,
  PhArrowClockwise
} from '@phosphor-icons/vue';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  author: {
    nickname: string | null;
    account_id: string;
  } | null;
  post: {
    id: string;
    title: string;
  } | null;
}

const loading = ref(true);
const comments = ref<Comment[]>([]);
const searchQuery = ref('');

const filteredComments = computed(() => {
  if (!searchQuery.value) return comments.value;
  
  const query = searchQuery.value.toLowerCase();
  return comments.value.filter(comment => 
    comment.content.toLowerCase().includes(query) ||
    comment.author?.nickname?.toLowerCase().includes(query) ||
    comment.post?.title?.toLowerCase().includes(query)
  );
});

const debouncedSearch = debounce(() => {
  // 検索は computed で自動的に実行される
}, 300);

onMounted(() => {
  fetchComments();
});

async function fetchComments() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        profiles:author_id (
          nickname,
          account_id
        ),
        posts:post_id (
          id,
          title
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const commentsWithCounts = await Promise.all(
      (data || []).map(async (comment) => {
        const { count: likeCount } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);
        
        return {
          ...comment,
          author: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
          post: Array.isArray(comment.posts) ? comment.posts[0] : comment.posts,
          like_count: likeCount || 0
        };
      })
    );
    
    comments.value = commentsWithCounts;
    
  } catch (err) {
    console.error('コメント取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

async function deleteComment(comment: Comment) {
  const confirmMessage = `このコメントを削除しますか？この操作は取り消せません。`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', comment.id);
    
    if (error) throw error;
    
    comments.value = comments.value.filter(c => c.id !== comment.id);
    
    alert('コメントを削除しました。');
    
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました。');
  }
}

function viewPost(comment: Comment) {
  if (comment.post) {
    window.open(`/posts/${comment.post.id}`, '_blank');
  }
}

function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch {
    return dateString;
  }
}
</script>
