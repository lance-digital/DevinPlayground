<template>
  <div>
    <div class="mb-3 flex flex-col items-start justify-between sm:mb-4 sm:flex-row sm:items-center">
      <h2 class="mb-1 text-lg font-bold text-heading sm:mb-0 sm:text-xl">コメント管理</h2>
      <div class="text-xs text-text-muted sm:text-sm">
        全 {{ totalComments }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-4 sm:p-6">
      <PhSpinner class="h-6 w-6 animate-spin text-primary sm:h-8 sm:w-8" />
    </div>
    
    <!-- コメントがない場合 -->
    <div v-else-if="comments.length === 0" class="glass-card p-4 text-center sm:p-8">
      <p class="text-text-muted">
        まだコメントはありません
      </p>
    </div>
    
    <!-- コメントリスト -->
    <div v-else class="space-y-3 sm:space-y-4">
      <div v-for="comment in comments" :key="comment.id" class="glass-card p-3 shadow-background/50 sm:p-4">
        <div class="flex flex-col">
          <!-- コメント内容 -->
          <div>
            <div class="flex items-center">
              <div class="mr-2 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-primary-light text-text-white sm:h-6 sm:w-6">
                <img 
                  v-if="comment.post?.author?.avatar_data" 
                  :src="getAvatarUrl(comment.post.author.avatar_data)" 
                  :alt="comment.post?.author?.nickname || ''"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ getInitials(comment.post?.author?.nickname || '') }}</span>
              </div>
              <span class="text-xs text-text sm:text-sm">{{ comment.post?.author?.nickname || '不明なユーザー' }}</span>
            </div>
            
            <p class="mb-2 whitespace-pre-wrap text-sm text-text">{{ comment.content }}</p>
            
            <div class="mb-1 flex flex-col items-start justify-between sm:mb-0 sm:flex-row sm:items-center">
              <router-link 
                :to="`/posts/${comment.post_id}`" 
                class="mb-1 text-xs text-primary hover:underline sm:mb-0 sm:text-sm"
              >
                {{ getPostTitle(comment) }}
              </router-link>
              <span class="text-xs text-text-muted">
                {{ formatDate(comment.created_at) }}
              </span>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="mt-2 flex justify-end space-x-2 sm:mt-3">
            <button 
              @click="confirmEditComment(comment)" 
              class="btn btn-outline-warning btn-sm"
            >
              <PhPencilSimple class="mr-1 h-4 w-4" />
              編集
            </button>
            <button 
              @click="confirmDeleteComment(comment)" 
              class="btn btn-outline-error btn-sm"
            >
              <PhTrash class="mr-1 h-4 w-4" />
              削除
            </button>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="mt-4 flex justify-center sm:mt-6">
        <div class="flex flex-wrap justify-center space-x-1 sm:space-x-2">
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
            @click="changePage(typeof page === 'number' ? page : currentPage)" 
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
    
    <!-- 編集モーダル -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div class="glass-card mx-auto w-full max-w-md p-4 shadow-background/70 sm:p-6">
        <h3 class="mb-3 text-lg font-bold text-heading sm:mb-4 sm:text-xl">コメントを編集</h3>
        <textarea 
          v-model="editedContent" 
          class="mb-3 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:mb-4"
          rows="3"
        ></textarea>
        <div class="flex justify-end space-x-2 sm:space-x-3">
          <button 
            @click="showEditModal = false" 
            class="btn btn-ghost btn-sm"
          >
            キャンセル
          </button>
          <button 
            @click="updateComment" 
            class="btn btn-primary btn-sm"
            :disabled="actionSubmitting || !editedContent.trim()"
          >
            <PhSpinner v-if="actionSubmitting" class="mr-1 h-4 w-4 animate-spin" />
            {{ actionSubmitting ? '更新中...' : '更新する' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div class="glass-card mx-auto w-full max-w-md p-4 shadow-background/70 sm:p-6">
        <h3 class="mb-3 text-lg font-bold text-heading sm:mb-4 sm:text-xl">コメントを削除しますか？</h3>
        <p class="mb-4 text-sm text-text-muted sm:mb-6">この操作は取り消せません。本当にこのコメントを削除しますか？</p>
        <div class="flex justify-end space-x-2 sm:space-x-3">
          <button 
            @click="showDeleteModal = false" 
            class="btn btn-ghost btn-sm"
          >
            キャンセル
          </button>
          <button 
            @click="deleteComment" 
            class="btn btn-outline-error btn-sm"
            :disabled="actionSubmitting"
          >
            <PhSpinner v-if="actionSubmitting" class="mr-1 h-4 w-4 animate-spin" />
            {{ actionSubmitting ? '削除中...' : '削除する' }}
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
import { getProfileImageUrl } from '../../lib/storage';
import { PhSpinner, PhPencilSimple, PhTrash } from '@phosphor-icons/vue';

// インターフェース定義を修正
interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  post?: {
    id: string;
    title: string;
    author?: {
      id: string;
      nickname: string | null;
      avatar_data?: string | null;
    };
  };
}

const authStore = useAuthStore();

// 状態
const comments = ref<Comment[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalComments = ref(0);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const actionSubmitting = ref(false);
const selectedComment = ref<Comment | null>(null);
const editedContent = ref('');

// 計算プロパティ
const totalPages = computed(() => Math.ceil(totalComments.value / pageSize));

// 初期データ取得
onMounted(() => {
  fetchComments();
});

// コメントの取得
async function fetchComments() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // 合計数を取得
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id);
    
    if (countError) throw countError;
    totalComments.value = count || 0;
    
    // ページネーションの計算
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // コメントデータを取得
    const { data, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id, 
        content,
        created_at,
        updated_at,
        post_id,
        parent_comment_id,
        post:post_id (
          id,
          title,
          author:author_id (
            id,
            nickname,
            avatar_data
          )
        )
      `)
      .eq('author_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (commentsError) throw commentsError;

    // データを正しい形式に変換
    const formattedData = (data || []).map((item: any) => {
      return {
        id: item.id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        post_id: item.post_id,
        parent_comment_id: item.parent_comment_id,
        post: {
          id: item.post?.id,
          title: item.post?.title,
          author: {
            id: item.post?.author?.id,
            nickname: item.post?.author?.nickname,
            avatar_data: item.post?.author?.avatar_data
          }
        }
      } as Comment;
    });

    comments.value = formattedData;
  } catch (err) {
    console.error('コメント取得エラー:', err);
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
  fetchComments();
}

// ページ番号の配列を取得
function getPageNumbers(): (number | string)[] {
  const pages: (number | string)[] = [];
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

// 投稿タイトルを取得
function getPostTitle(comment: Comment): string {
  return comment.post?.title || '不明な投稿';
}

// コメント編集確認
function confirmEditComment(comment: Comment) {
  selectedComment.value = comment;
  editedContent.value = comment.content;
  showEditModal.value = true;
  showDeleteModal.value = false;
}

// コメント削除確認
function confirmDeleteComment(comment: Comment) {
  selectedComment.value = comment;
  showDeleteModal.value = true;
  showEditModal.value = false;
}

// コメント更新
async function updateComment() {
  if (!selectedComment.value || !editedContent.value.trim() || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // コメントを更新
    const { error: updateError } = await supabase
      .from('comments')
      .update({
        content: editedContent.value,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedComment.value.id)
      .eq('author_id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // リストを更新
    const index = comments.value.findIndex(c => c.id === selectedComment.value?.id);
    if (index !== -1) {
      comments.value[index].content = editedContent.value;
      comments.value[index].updated_at = new Date().toISOString();
    }
    
    showEditModal.value = false;
  } catch (err) {
    console.error('コメント更新エラー:', err);
    alert('コメントの更新に失敗しました');
  } finally {
    actionSubmitting.value = false;
  }
}

// コメント削除
async function deleteComment() {
  if (!selectedComment.value || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // コメントを削除
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', selectedComment.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // リストから削除
    comments.value = comments.value.filter(c => c.id !== selectedComment.value?.id);
    totalComments.value--;
    showDeleteModal.value = false;
    
    // ページが空になった場合は前のページに戻る
    if (comments.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchComments();
    }
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました');
  } finally {
    actionSubmitting.value = false;
  }
}

// 日付フォーマット
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch {
    return dateString;
  }
}

// アバターURLを取得
function getAvatarUrl(avatar_data?: string) {
  return avatar_data ? getProfileImageUrl(avatar_data) : '';
}

// イニシャルを取得
function getInitials(nickname: string) {
  if (!nickname) return 'U';
  return nickname.charAt(0).toUpperCase();
}
</script> 