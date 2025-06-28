<template>
  <div class="rounded-lg border border-border p-5 bg-surface-variant shadow-background/20">
    <!-- コメント投稿フォーム -->
    <div class="mb-6">
      <div v-if="!authStore.isAuthenticated" class="py-4 text-center">
        <p class="mb-3 text-text-muted">
          コメントするにはログインが必要です
        </p>
        <router-link to="/login" class="btn btn-primary">
          ログインする
        </router-link>
      </div>
      
      <form v-else @submit.prevent="submitComment" class="space-y-3">
        <div class="mb-3">
          <textarea 
            v-model="commentText" 
            class="w-full rounded-lg border border-border p-4 bg-surface text-text placeholder-text-muted transition-all focus:border-primary focus:outline-none focus:shadow-primary/20" 
            rows="3"
            :placeholder="parentCommentId ? '返信を入力...' : 'コメントを入力...'"
            :disabled="submitting"
            required
          ></textarea>
        </div>
        
        <div class="flex justify-end">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="submitting || !commentText.trim()"
          >
            <PhSpinner v-if="submitting" class="mr-2 h-5 w-5 animate-spin" />
            {{ submitting ? '送信中...' : parentCommentId ? '返信する' : '送信する' }}
          </button>
        </div>
      </form>
    </div>

    <!-- コメント一覧 -->
    <div v-if="loading" class="flex justify-center p-4">
      <PhSpinner class="h-6 w-6 animate-spin text-primary-light" />
    </div>

    <div v-else-if="comments.length === 0" class="py-8 text-center">
      <p class="text-text-muted">
        まだコメントはありません。最初のコメントを投稿してみましょう。
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- ルートコメントのみ表示（子コメントは再帰的に表示） -->
      <comment-item 
        v-for="comment in rootComments" 
        :key="comment.id"
        :comment="comment"
        :comments="comments"
        :submitting="submitting"
        :editing-comment-id="editingCommentId as string | undefined"
        :edited-content="editedContent"
        :liked-comments="likedComments"
        :comment-like-counts="commentLikeCounts"
        :replying-to-id="parentCommentId as string | undefined"
        :is-last-nested-level="!hasNestedChildren(comment.id)"
        @reply="setReplyTo"
        @edit="startEdit"
        @delete="confirmDelete"
        @toggle-like="toggleLike"
        @save-edit="saveEdit"
        @cancel-edit="cancelEdit"
        @update:edited-content="editedContent = $event"
        @submit-reply="submitReply"
        @cancel-reply="cancelReply"
      />
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm">
      <div class="w-full max-w-sm rounded-lg border border-border-light/60 p-6 bg-surface/80 shadow-background/40">
        <h3 class="mb-4 text-lg font-bold text-heading">コメントを削除しますか？</h3>
        <p class="mb-6 text-text-muted">
          この操作は取り消せません。
        </p>
        <div class="flex justify-end space-x-4">
          <button 
            @click="showDeleteModal = false" 
            class="btn btn-outline-secondary"
          >
            キャンセル
          </button>
          <button 
            @click="deleteComment" 
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
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'vue-router';
import { PhSpinner } from '@phosphor-icons/vue';
import CommentItem from './CommentItem.vue'; // 新しく作成する再帰的コンポーネント

const props = defineProps({
  postId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['comments-updated']);

const router = useRouter();
const authStore = useAuthStore();

// コメント関連の状態
const comments = ref<any[]>([]);
const loading = ref(true);
const commentText = ref('');
const replyText = ref('');
const submitting = ref(false);
const parentCommentId = ref<string | null>(null);
const editingCommentId = ref<string | null>(null);
const editedContent = ref('');
const showDeleteModal = ref(false);
const deleteSubmitting = ref(false);
const commentToDelete = ref<any>(null);

// いいね関連の状態
const likedComments = ref<Record<string, boolean>>({});
const commentLikeCounts = ref<Record<string, number>>({});

// ルートコメント（親コメントがないもの）のみを取得
const rootComments = computed(() => {
  return comments.value.filter(comment => !comment.parent_comment_id);
});

// コメント一覧を取得
async function fetchComments() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:author_id (*)
      `)
      .eq('post_id', props.postId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    comments.value = data || [];
    
    // コメントごとのいいね数を取得
    await Promise.all(comments.value.map(async (comment) => {
      await fetchCommentLikes(comment.id);
      await checkIfLiked(comment.id);
    }));
    
    // 追加: 初期ロード時にもコメント数を親コンポーネントに通知
    emit('comments-updated', comments.value.length);
    
  } catch (err) {
    console.error('コメント取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// コメントを投稿（共通関数）
async function submitCommentOrReply(isReply = false, parentId: string | null = null) {
  const content = isReply ? replyText.value : commentText.value;
  const parentCommentIdValue = isReply ? (parentId || parentCommentId.value) : null;
  
  if (!content.trim() || !authStore.user || submitting.value) return;
  
  submitting.value = true;
  
  try {
    const newComment = {
      content: content.trim(),
      post_id: props.postId,
      author_id: authStore.user.id,
      parent_comment_id: parentCommentIdValue
    };
    
    // コメントの作成
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select('*, profiles:author_id(*)')
      .single();
    
    if (error) {
      console.error(`${isReply ? '返信' : 'コメント'}投稿エラー詳細:`, error);
      throw error;
    }
    
    // コメント一覧に追加
    comments.value.push(newCommentData);
    commentLikeCounts.value[newCommentData.id] = 0;
    likedComments.value[newCommentData.id] = false;
    
    // 親コンポーネントに通知
    emit('comments-updated', comments.value.length);
    
    // フォームをリセット
    if (isReply) {
      replyText.value = '';
      parentCommentId.value = null;
    } else {
      commentText.value = '';
    }
  } catch (err: any) {
    console.error(`${isReply ? '返信' : 'コメント'}投稿エラー:`, err);
    alert(`${isReply ? '返信' : 'コメント'}の投稿に失敗しました: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

// コメント投稿
function submitComment() {
  submitCommentOrReply(false);
}

// 返信を送信
function submitReply(parentId: string, content: string) {
  if (!parentId) return;
  
  if (content) {
    replyText.value = content;
  }
  
  // デバッグ用に値を確認
  console.log('送信する返信:', {
    parentId,
    content: content || replyText.value
  });
  
  submitCommentOrReply(true, parentId);
}

// 編集を開始
function startEdit(comment: any) {
  editingCommentId.value = comment.id;
  editedContent.value = comment.content;
}

// 編集をキャンセル
function cancelEdit() {
  editingCommentId.value = null;
  editedContent.value = '';
}

// 編集を保存
async function saveEdit(comment: any) {
  if (!editedContent.value.trim() || !authStore.user) return;
  
  try {
    const { error } = await supabase
      .from('comments')
      .update({
        content: editedContent.value.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comment.id)
      .eq('author_id', authStore.user.id);
    
    if (error) throw error;
    
    // コメントを更新
    const index = comments.value.findIndex(c => c.id === comment.id);
    if (index !== -1) {
      comments.value[index].content = editedContent.value.trim();
      comments.value[index].updated_at = new Date().toISOString();
    }
    
    // 編集モードを終了
    editingCommentId.value = null;
    editedContent.value = '';
    
    // 親コンポーネントに通知
    emit('comments-updated', comments.value.length);
  } catch (err) {
    console.error('コメント更新エラー:', err);
    alert('コメントの更新に失敗しました');
  }
}

// 返信する対象を設定
function setReplyTo(comment: any) {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  parentCommentId.value = comment.id;
  replyText.value = '';
}

// 返信をキャンセル
function cancelReply() {
  parentCommentId.value = null;
  replyText.value = '';
}

// 削除確認
function confirmDelete(comment: any) {
  commentToDelete.value = comment;
  showDeleteModal.value = true;
}

// コメント削除
async function deleteComment() {
  if (!commentToDelete.value || !authStore.user || deleteSubmitting.value) return;
  
  deleteSubmitting.value = true;
  
  try {
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentToDelete.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // 削除確認モーダルを閉じる
    showDeleteModal.value = false;
    
    // UI上でコメントを削除
    comments.value = comments.value.filter(c => c.id !== commentToDelete.value.id);
    
    // 子コメントもUIから削除（DBではON DELETE CASCADEで自動的に削除される）
    comments.value = comments.value.filter(c => c.parent_comment_id !== commentToDelete.value.id);
    
    // 親コンポーネントに通知
    emit('comments-updated', comments.value.length);
  } catch (err) {
    console.error('コメント削除エラー:', err);
    alert('コメントの削除に失敗しました');
  } finally {
    deleteSubmitting.value = false;
    commentToDelete.value = null;
  }
}

// コメントのいいね数を取得
async function fetchCommentLikes(commentId: string) {
  try {
    const { count, error: likesError } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact' })
      .eq('comment_id', commentId);
    
    if (likesError) throw likesError;
    commentLikeCounts.value[commentId] = count || 0;
  } catch (err) {
    console.error('いいね数取得エラー:', err);
  }
}

// いいね状態の確認
async function checkIfLiked(commentId: string) {
  if (!authStore.isAuthenticated || !authStore.user) {
    likedComments.value[commentId] = false;
    return;
  }
  
  try {
    const { data, error: likeError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', authStore.user.id)
      .maybeSingle();
    
    if (likeError) throw likeError;
    likedComments.value[commentId] = !!data;
  } catch (err) {
    console.error('いいね状態確認エラー:', err);
  }
}

// いいねの切り替え
async function toggleLike(comment: any) {
  if (!authStore.isAuthenticated || !authStore.user) {
    router.push('/auth');
    return;
  }
  
  try {
    if (likedComments.value[comment.id]) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment.id)
        .eq('user_id', authStore.user.id);
      
      if (deleteError) throw deleteError;
      
      likedComments.value[comment.id] = false;
      commentLikeCounts.value[comment.id]--;
    } else {
      // いいねを追加
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: comment.id,
          user_id: authStore.user.id
        });
      
      if (insertError) throw insertError;
      
      likedComments.value[comment.id] = true;
      commentLikeCounts.value[comment.id]++;
    }
  } catch (err) {
    console.error('いいね切り替えエラー:', err);
  }
}

// コメントに子コメントがあるかどうかを確認する関数
function hasNestedChildren(commentId: string): boolean {
  return comments.value.some(c => c.parent_comment_id === commentId);
}

// 投稿IDが変更されたらコメントを再取得
watch(() => props.postId, () => {
  fetchComments();
});

// 初期化
onMounted(() => {
  fetchComments();
});
</script> 