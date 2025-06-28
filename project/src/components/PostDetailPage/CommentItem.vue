<template>
  <div class="comment-item">
    <!-- コメント本体 -->
    <div class="mb-4">
      <!-- コメント内容 -->
      <div class="flex-1">
        <div class="rounded-lg border border-border-light/60 p-3 bg-surface/80 shadow-background/30 backdrop-blur-sm">
          <!-- ユーザー情報と日時 -->
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center">
              <!-- アバター -->
              <div class="mr-2 flex-shrink-0">
                <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-light text-text-white">
                  <img 
                    v-if="comment.profiles?.avatar_data" 
                    :src="getAvatarUrl(comment.profiles.avatar_data)" 
                    :alt="comment.profiles.nickname"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ getInitials(comment.profiles?.nickname || '?') }}</span>
                </div>
              </div>
              <span class="font-medium text-text">{{ comment.profiles?.nickname }}</span>
            </div>
            <span class="text-xs text-text-muted">{{ formatDate(comment.created_at) }}</span>
          </div>
          
          <!-- 編集フォーム -->
          <div v-if="editingCommentId === comment.id" class="mb-2">
            <textarea 
              :value="editedContent" 
              @input="$emit('update:editedContent', ($event.target as HTMLTextAreaElement).value)"
              class="w-full rounded border border-border px-3 py-2 bg-surface text-text shadow-primary/20 focus:outline-none"
              rows="2"
            ></textarea>
            <div class="mt-2 flex justify-end space-x-2">
              <button 
                @click="$emit('cancel-edit')" 
                class="btn btn-outline-secondary btn-sm"
              >
                キャンセル
              </button>
              <button 
                @click="$emit('save-edit', comment)" 
                class="btn btn-outline-accent3 btn-sm"
                :disabled="!editedContent.trim() || editedContent === comment.content"
              >
                保存
              </button>
            </div>
          </div>
          
          <!-- コメント表示 -->
          <p v-else class="whitespace-pre-wrap text-sm text-text">{{ comment.content }}</p>
        </div>
        
        <!-- アクションボタン -->
        <div class="mt-1 flex space-x-2 text-xs">
          <button 
            @click="$emit('reply', comment)" 
            class="btn btn-outline-primary btn-sm"
            :disabled="submitting"
          >
            <PhChatCircle class="mr-1 h-4 w-4" />
            返信
          </button>
          
          <div v-if="isCommentOwner(comment)" class="flex space-x-2">
            <button 
              @click="$emit('edit', comment)" 
              class="btn btn-outline-warning btn-sm"
            >
              <PhPencilSimple class="mr-1 h-4 w-4" />
              編集
            </button>
            <button 
              @click="$emit('delete', comment)" 
              class="btn btn-outline-error btn-sm"
            >
              <PhTrash class="mr-1 h-4 w-4" />
              削除
            </button>
          </div>
          
          <button 
            @click="$emit('toggle-like', comment)" 
            class="flex items-center"
            :class="{ 'text-primary-light': isCommentLiked(comment.id), 'text-text-muted': !isCommentLiked(comment.id) }"
          >
            <span class="flex items-center">
              <PhHeart class="mr-1 h-4 w-4" :weight="isCommentLiked(comment.id) ? 'fill' : 'regular'" />
              {{ getCommentLikeCount(comment) }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 返信フォーム -->
    <div v-if="replyingToId === comment.id" class="mb-4 ml-8">
      <div class="rounded-lg border border-border p-4 bg-surface-variant shadow-background/20">
        <form @submit.prevent="handleSubmitReply">
          <div class="mb-3">
            <textarea 
              v-model="replyContent" 
              class="w-full rounded-lg border border-border p-3 bg-surface text-text placeholder-text-muted transition-all focus:border-primary focus:outline-none focus:shadow-primary/20"
              rows="2"
              placeholder="返信を入力..."
              :disabled="submitting"
              required
            ></textarea>
          </div>
          
          <div class="flex justify-between">
            <button 
              type="button"
              @click="$emit('cancel-reply')" 
              class="btn btn-outline-secondary btn-sm"
            >
              キャンセル
            </button>
          
            <button 
              type="submit" 
              class="btn btn-primary btn-sm"
              :disabled="submitting || !replyContent.trim()"
            >
              <PhSpinner v-if="submitting" class="mr-1 h-4 w-4 animate-spin" />
              {{ submitting ? '送信中...' : '返信する' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 子コメント（再帰的に表示） -->
    <div v-if="childComments.length > 0" class="relative ml-8">
      <!-- ネストレベルが深い場合は初期状態で非表示 -->
      <div v-if="level >= MAX_VISIBLE_NEST_LEVEL && !showDeepNestedComments">
        <button 
          @click="showDeepNestedComments = true" 
          class="mt-2 text-sm text-primary-light hover:underline focus:outline-none"
        >
          {{ childComments.length }}件の返信を表示
        </button>
      </div>
      
      <!-- コメントツリーのL字ライン -->
      <div 
        v-if="level < MAX_VISIBLE_NEST_LEVEL || showDeepNestedComments" 
        class="absolute left-0 top-0 w-0.5 bg-primary-light opacity-60" 
        :style="{ 
          height: '100%',
          display: childComments.length === 0 ? 'none' : 'block'
        }"
      ></div>
      
      <!-- 表示する場合 -->
      <div v-if="level < MAX_VISIBLE_NEST_LEVEL || showDeepNestedComments">
        <div 
          v-for="(childComment, index) in childComments" 
          :key="childComment.id"
          class="relative pt-4"
        >
          <!-- 水平ライン -->
          <div 
            class="absolute left-0 top-[1.5rem] h-0.5 w-4 bg-primary-light opacity-60"
          ></div>
          
          <!-- 最後の子コメントの場合、余分な縦線を隠す -->
          <div 
            v-if="index === childComments.length - 1" 
            class="absolute left-0 bottom-0 top-[calc(1.5rem+2px)] w-0.5 bg-surface-variant" 
            style="height: calc(100% - 1.5rem);"
          ></div>
          
          <div class="pl-6">
            <comment-item
              :comment="childComment"
              :comments="comments"
              :submitting="submitting"
              :editing-comment-id="editingCommentId"
              :edited-content="editedContent"
              :level="level + 1"
              :liked-comments="likedComments"
              :comment-like-counts="commentLikeCounts"
              :replying-to-id="replyingToId"
              :is-last-nested-level="!hasNestedChildren(childComment.id)"
              @reply="$emit('reply', $event)"
              @edit="$emit('edit', $event)"
              @delete="$emit('delete', $event)"
              @toggle-like="$emit('toggle-like', $event)"
              @save-edit="$emit('save-edit', $event)"
              @cancel-edit="$emit('cancel-edit')"
              @update:edited-content="$emit('update:edited-content', $event)"
              @submit-reply="(id: string, text: string) => $emit('submit-reply', id, text)"
              @cancel-reply="$emit('cancel-reply')"
            />
          </div>
        </div>
      </div>
      
      <!-- 子コメントを非表示にするボタン（表示中の場合のみ） -->
      <div v-if="level >= MAX_VISIBLE_NEST_LEVEL && showDeepNestedComments">
        <div class="absolute left-0 bottom-0 top-[calc(2px+1.5rem)] w-0.5 bg-surface-variant" style="height: calc(100% - 1.5rem);"></div>
        <button 
          @click="showDeepNestedComments = false" 
          class="mt-2 text-sm text-text-muted hover:underline focus:outline-none"
        >
          返信を閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl } from '../../lib/storage';
import { 
  PhHeart, 
  PhChatCircle, 
  PhPencilSimple, 
  PhTrash,
  PhSpinner
} from '@phosphor-icons/vue';

// 最大表示ネストレベルを定義
const MAX_VISIBLE_NEST_LEVEL = 3;

// コメントの型定義を追加
interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  parent_comment_id: string | null;
  profiles?: {
    nickname: string;
    avatar_data: string | null;
  };
}

const props = defineProps({
  comment: {
    type: Object as () => Comment,
    required: true
  },
  comments: {
    type: Array as () => Comment[],
    required: true
  },
  submitting: {
    type: Boolean,
    default: false
  },
  editingCommentId: {
    type: String,
    default: null as string | null
  },
  editedContent: {
    type: String,
    default: ''
  },
  level: {
    type: Number,
    default: 0
  },
  likedComments: {
    type: Object,
    required: true
  },
  commentLikeCounts: {
    type: Object,
    required: true
  },
  replyingToId: {
    type: String,
    default: null as string | null
  },
  isLastNestedLevel: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits<{
  (e: 'reply', comment: Comment): void;
  (e: 'edit', comment: Comment): void;
  (e: 'delete', comment: Comment): void;
  (e: 'toggle-like', comment: Comment): void;
  (e: 'save-edit', comment: Comment): void;
  (e: 'cancel-edit'): void;
  (e: 'update:editedContent', content: string): void;
  (e: 'submit-reply', id: string, text: string): void;
  (e: 'cancel-reply'): void;
}>();

const authStore = useAuthStore();
const replyContent = ref('');

// 再帰的に子コメントを取得
const childComments = computed(() => {
  return props.comments.filter((c: Comment) => c.parent_comment_id === props.comment.id);
});

// ユーティリティ関数
function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

function isCommentOwner(comment: Comment): boolean {
  return Boolean(authStore.user && comment.author_id === authStore.user.id);
}

function isCommentLiked(commentId: string): boolean {
  return props.likedComments[commentId] || false;
}

function getCommentLikeCount(comment: Comment): number {
  return props.commentLikeCounts[comment.id] || 0;
}

// 返信処理のためのメソッドを追加
function handleSubmitReply() {
  if (!replyContent.value.trim()) return;
  
  console.log('返信を送信します:', {
    commentId: props.comment.id,
    content: replyContent.value
  });
  
  emit('submit-reply', props.comment.id, replyContent.value);
  
  // 送信後にテキストエリアをクリア
  replyContent.value = '';
}

// 深いネストのコメント表示状態
const showDeepNestedComments = ref(false);

// コメントに子コメントがあるかどうかを確認する関数
function hasNestedChildren(commentId: string): boolean {
  return props.comments.some((c: Comment) => c.parent_comment_id === commentId);
}
</script> 