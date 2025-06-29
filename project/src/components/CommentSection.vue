<template>
  <!-- コメント管理セクション全体のコンテナ：ガラス効果カードスタイル -->
  <div class="glass-card mt-6">
    <!-- コメントセクションのタイトル -->
    <h3 class="text-xl font-semibold text-heading mb-4">
      コメント
    </h3>
    
    <!-- 認証済みユーザー向けの新規コメント投稿フォーム -->
    <div v-if="user" class="mb-6">
      <form 
        data-testid="コメント管理-新規フォーム"
        @submit.prevent="submitComment"
        class="space-y-4"
      >
        <!-- 新規コメント入力用のテキストエリア -->
        <textarea
          data-testid="コメント管理-新規入力"
          v-model="newComment"
          rows="3"
          placeholder="コメントを入力してください..."
          class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <!-- コメント送信ボタン：ローディング中や空文字の場合は無効化 -->
        <button
          data-testid="コメント管理-新規送信ボタン"
          type="submit"
          :disabled="loading || !newComment.trim()"
          class="btn btn-primary"
        >
          {{ loading ? 'コメント中...' : 'コメントする' }}
        </button>
      </form>
    </div>
    
    <!-- コメントが存在しない場合の表示メッセージ -->
    <div 
      v-if="comments.length === 0"
      class="text-center text-text-muted py-8"
    >
      まだコメントがありません
    </div>
    
    <!-- コメント一覧の表示エリア -->
    <div 
      v-else
      data-testid="コメント管理-リスト"
      class="space-y-4"
    >
      <!-- 各コメントのループ表示 -->
      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="border border-border-light rounded-md p-4"
      >
        <!-- コメントヘッダー：ユーザー情報と削除ボタン -->
        <div class="flex justify-between items-start mb-2">
          <!-- ユーザー名と投稿日時の表示 -->
          <div class="flex items-center space-x-2">
            <span class="font-medium text-heading">
              {{ comment.profiles?.nickname || 'Unknown' }}
            </span>
            <span class="text-text-muted text-sm">
              {{ formatDate(comment.created_at) }}
            </span>
          </div>
          
          <!-- 削除権限がある場合の削除ボタン表示 -->
          <div v-if="canDeleteComment(comment)" class="flex space-x-2">
            <button
              @click="deleteComment(comment.id)"
              class="text-error hover:text-error-light text-sm"
            >
              削除
            </button>
          </div>
        </div>
        
        <!-- コメント本文の表示 -->
        <p class="text-text mb-3">
          {{ comment.content }}
        </p>
        
        <!-- コメントアクション：いいねボタンと返信ボタン -->
        <div class="flex items-center space-x-4">
          <!-- いいねボタン：ハートアイコンといいね数を表示 -->
          <button
            @click="toggleCommentLike(comment.id)"
            :disabled="likeLoading"
            class="flex items-center space-x-1 text-sm"
            :class="{ 'text-accent1': comment.isLiked }"
          >
            <span>{{ comment.isLiked ? '❤️' : '🤍' }}</span>
            <span>{{ comment.likeCount }}</span>
          </button>
          
          <!-- 認証済みユーザー向けの返信ボタン -->
          <button
            v-if="user"
            @click="toggleReplyForm(comment.id)"
            class="text-primary hover:text-primary-light text-sm"
          >
            返信
          </button>
        </div>
        
        <!-- 返信フォーム：該当コメントに返信中の場合のみ表示 -->
        <div 
          v-if="replyingTo === comment.id"
          class="mt-4 pl-4 border-l-2 border-border"
        >
          <!-- 返信投稿フォーム -->
          <form @submit.prevent="submitReply(comment.id)" class="space-y-2">
            <!-- 返信内容入力用のテキストエリア -->
            <textarea
              v-model="replyContent"
              rows="2"
              placeholder="返信を入力してください..."
              class="w-full px-3 py-2 bg-surface-variant border border-border rounded-md text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <!-- 返信送信とキャンセルボタン -->
            <div class="flex space-x-2">
              <!-- 返信送信ボタン：ローディング中や空文字の場合は無効化 -->
              <button
                type="submit"
                :disabled="loading || !replyContent.trim()"
                class="btn btn-primary btn-sm"
              >
                返信
              </button>
              <!-- 返信キャンセルボタン -->
              <button
                type="button"
                @click="cancelReply"
                class="btn btn-outline-secondary btn-sm"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
        
        <!-- 返信一覧：該当コメントに返信が存在する場合のみ表示 -->
        <div 
          v-if="comment.replies && comment.replies.length > 0"
          class="mt-4 pl-4 border-l-2 border-border space-y-3"
        >
          <!-- 各返信のループ表示 -->
          <div 
            v-for="reply in comment.replies" 
            :key="reply.id"
            class="bg-surface-variant rounded-md p-3"
          >
            <!-- 返信ヘッダー：ユーザー情報と削除ボタン -->
            <div class="flex justify-between items-start mb-2">
              <!-- 返信者名と投稿日時の表示 -->
              <div class="flex items-center space-x-2">
                <span class="font-medium text-heading">
                  {{ reply.profiles?.nickname || 'Unknown' }}
                </span>
                <span class="text-text-muted text-sm">
                  {{ formatDate(reply.created_at) }}
                </span>
              </div>
              
              <!-- 削除権限がある場合の削除ボタン表示 -->
              <div v-if="canDeleteComment(reply)">
                <button
                  @click="deleteComment(reply.id)"
                  class="text-error hover:text-error-light text-sm"
                >
                  削除
                </button>
              </div>
            </div>
            
            <!-- 返信本文の表示 -->
            <p class="text-text">
              {{ reply.content }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue.jsのリアクティブ機能とライフサイクルフックをインポート
import { ref, onMounted, computed } from 'vue'
// 認証機能を提供するコンポーザブルをインポート
import { useAuth } from '@/composables/useAuth'
// Supabaseクライアントをインポート
import { supabase } from '@/lib/supabase'
// Supabaseデータベースの型定義をインポート
import type { Database } from '@/lib/supabase'

// コメントデータの型定義：基本のコメント情報に追加プロパティを含む
type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']  // プロフィール情報
  replies?: Comment[]  // 返信コメントの配列
  isLiked?: boolean   // 現在のユーザーがいいねしているかどうか
  likeCount?: number  // いいね数
}

// 親コンポーネントから受け取るプロパティの型定義
const props = defineProps<{
  postId: string  // 投稿ID（文字列型のUUID）
}>()

// 親コンポーネントに送信するイベントの型定義
const emit = defineEmits<{
  commentAdded: []    // コメント追加時のイベント
  commentDeleted: []  // コメント削除時のイベント
}>()

// 認証関連の状態と機能を取得
const { user, isAdmin } = useAuth()

// コメント一覧を格納するリアクティブ変数
const comments = ref<Comment[]>([])
// ローディング状態を管理するリアクティブ変数
const loading = ref(false)
// いいね処理のローディング状態を管理するリアクティブ変数
const likeLoading = ref(false)
// 新規コメント入力内容を格納するリアクティブ変数
const newComment = ref('')
// 現在返信中のコメントIDを格納するリアクティブ変数
const replyingTo = ref<number | null>(null)
// 返信内容を格納するリアクティブ変数
const replyContent = ref('')

// コメント削除権限をチェックする関数
const canDeleteComment = (comment: Comment) => {
  // ユーザーが認証済みで、かつ（コメント作成者本人または管理者）の場合に削除可能
  return user.value && (
    user.value.id === comment.author_id || 
    isAdmin.value
  )
}

// コメント一覧を読み込む非同期関数
const loadComments = async () => {
  try {
    // 親コメント（返信ではないコメント）を取得
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:author_id (nickname)
      `)
      .eq('post_id', props.postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 各コメントに対して返信といいね情報を追加
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        // 該当コメントの返信を取得
        const { data: replies } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:author_id (nickname)
          `)
          .eq('parent_comment_id', comment.id)
          .order('created_at', { ascending: true })
        
        // 該当コメントのいいね数を取得
        const { count: likeCount } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id)
        
        // 現在のユーザーがいいねしているかチェック
        let isLiked = false
        if (user.value) {
          const { data: likeData } = await supabase
            .from('comment_likes')
            .select('id')
            .eq('comment_id', comment.id)
            .eq('user_id', user.value.id)
            .single()
          
          // いいねデータが存在する場合はtrue
          isLiked = !!likeData
        }
        
        // コメントデータに追加情報を含めて返却
        return {
          ...comment,
          replies: replies || [],
          likeCount: likeCount || 0,
          isLiked
        }
      })
    )
    
    // 取得したコメントデータを変数に格納
    comments.value = commentsWithReplies
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Comments load error:', error instanceof Error ? error.stack : error)
  }
}

// 新規コメントを投稿する非同期関数
const submitComment = async () => {
  // ユーザーが未認証またはコメント内容が空の場合は処理を中断
  if (!user.value || !newComment.value.trim()) return
  
  // ローディング状態を開始
  loading.value = true
  try {
    // Supabaseにコメントデータを挿入
    const { error } = await supabase
      .from('comments')
      .insert({
        content: newComment.value.trim(),
        author_id: user.value.id,
        post_id: props.postId
      })
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 入力フィールドをクリア
    newComment.value = ''
    // コメント一覧を再読み込み
    await loadComments()
    // 親コンポーネントにコメント追加イベントを送信
    emit('commentAdded')
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Comment submit error:', error instanceof Error ? error.stack : error)
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// 返信コメントを投稿する非同期関数
const submitReply = async (parentId: number) => {
  // ユーザーが未認証または返信内容が空の場合は処理を中断
  if (!user.value || !replyContent.value.trim()) return
  
  // ローディング状態を開始
  loading.value = true
  try {
    // Supabaseに返信コメントデータを挿入
    const { error } = await supabase
      .from('comments')
      .insert({
        content: replyContent.value.trim(),
        author_id: user.value.id,
        post_id: props.postId,
        parent_comment_id: parentId
      })
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // 返信入力フィールドをクリア
    replyContent.value = ''
    // 返信中状態を解除
    replyingTo.value = null
    // コメント一覧を再読み込み
    await loadComments()
    // 親コンポーネントにコメント追加イベントを送信
    emit('commentAdded')
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Reply submit error:', error instanceof Error ? error.stack : error)
  } finally {
    // ローディング状態を終了
    loading.value = false
  }
}

// コメントを削除する非同期関数
const deleteComment = async (commentId: number) => {
  // 削除確認ダイアログを表示し、キャンセルされた場合は処理を中断
  if (!confirm('このコメントを削除しますか？')) return
  
  try {
    // Supabaseからコメントデータを削除
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
    
    // エラーが発生した場合は例外をスロー
    if (error) throw error
    
    // コメント一覧を再読み込み
    await loadComments()
    // 親コンポーネントにコメント削除イベントを送信
    emit('commentDeleted')
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Comment delete error:', error instanceof Error ? error.stack : error)
  }
}

// コメントのいいね状態を切り替える非同期関数
const toggleCommentLike = async (commentId: number) => {
  // ユーザーが未認証の場合は処理を中断
  if (!user.value) return
  
  // いいね処理のローディング状態を開始
  likeLoading.value = true
  try {
    // 対象コメントを検索
    const comment = comments.value.find(c => c.id === commentId)
    if (!comment) return
    
    // 既にいいねしている場合は削除、していない場合は追加
    if (comment.isLiked) {
      // いいねデータを削除
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.value.id)
      
      // エラーが発生した場合は例外をスロー
      if (error) throw error
    } else {
      // いいねデータを挿入
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.value.id
        })
      
      // エラーが発生した場合は例外をスロー
      if (error) throw error
    }
    
    // コメント一覧を再読み込みして最新状態を反映
    await loadComments()
  } catch (error) {
    // エラーログを出力：スタック情報またはエラーオブジェクトを表示
    console.error('Comment like toggle error:', error instanceof Error ? error.stack : error)
  } finally {
    // いいね処理のローディング状態を終了
    likeLoading.value = false
  }
}

// 返信フォームの表示状態を切り替える関数
const toggleReplyForm = (commentId: number) => {
  // 既に該当コメントに返信中の場合は返信状態を解除
  if (replyingTo.value === commentId) {
    replyingTo.value = null
    replyContent.value = ''
  } else {
    // 新しいコメントに対する返信状態に設定
    replyingTo.value = commentId
    replyContent.value = ''
  }
}

// 返信をキャンセルする関数
const cancelReply = () => {
  // 返信中状態を解除
  replyingTo.value = null
  // 返信入力内容をクリア
  replyContent.value = ''
}

// 日付文字列を日本語形式でフォーマットする関数
const formatDate = (dateString: string) => {
  // 日本語ロケールで月日時分形式に変換
  return new Date(dateString).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// コンポーネントマウント時にコメント一覧を読み込み
onMounted(() => {
  loadComments()
})
</script>
