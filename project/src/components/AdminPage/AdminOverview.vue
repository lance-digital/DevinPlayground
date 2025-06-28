<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-heading">サイト概要</h2>
      <button 
        @click="fetchOverviewData"
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
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-8">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 統計カード -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 総ユーザー数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総ユーザー数</h3>
          <PhUsers class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-heading">{{ stats.totalUsers }}</div>
          <div class="text-xs text-text-muted">直近30日: +{{ stats.newUsersThisMonth }}</div>
        </div>
      </div>
      
      <!-- 総投稿数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総投稿数</h3>
          <PhArticle class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-heading">{{ stats.totalPosts }}</div>
          <div class="text-xs text-text-muted">公開済み: {{ stats.publishedPosts }}</div>
        </div>
      </div>
      
      <!-- 総コメント数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総コメント数</h3>
          <PhChatText class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-heading">{{ stats.totalComments }}</div>
          <div class="text-xs text-text-muted">直近7日: +{{ stats.newCommentsThisWeek }}</div>
        </div>
      </div>
      
      <!-- 総いいね数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総いいね数</h3>
          <PhHeart class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2">
          <div class="text-2xl font-bold text-heading">{{ stats.totalLikes }}</div>
          <div class="text-xs text-text-muted">投稿: {{ stats.postLikes }} / コメント: {{ stats.commentLikes }}</div>
        </div>
      </div>
    </div>
    
    <!-- 最近のアクティビティ -->
    <div class="mt-8">
      <h3 class="mb-4 text-lg font-bold text-heading">最近のアクティビティ</h3>
      <div class="glass-card">
        <div v-if="recentActivities.length === 0" class="p-6 text-center">
          <p class="text-text-muted">最近のアクティビティはありません。</p>
        </div>
        <div v-else class="divide-y divide-border">
          <div 
            v-for="activity in recentActivities" 
            :key="activity.id" 
            class="p-4 hover:bg-surface-variant/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <PhUser v-if="activity.type === 'user'" class="h-5 w-5 text-primary" />
                  <PhArticle v-else-if="activity.type === 'post'" class="h-5 w-5 text-success" />
                  <PhChatText v-else-if="activity.type === 'comment'" class="h-5 w-5 text-info" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-text">{{ activity.description }}</p>
                  <p class="text-xs text-text-muted">{{ formatDate(activity.created_at) }}</p>
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
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { format, parseISO, subDays, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  PhSpinner, 
  PhUsers,
  PhArticle, 
  PhChatText, 
  PhHeart,
  PhUser,
  PhArrowClockwise
} from '@phosphor-icons/vue';

interface OverviewStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalPosts: number;
  publishedPosts: number;
  totalComments: number;
  newCommentsThisWeek: number;
  totalLikes: number;
  postLikes: number;
  commentLikes: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'post' | 'comment';
  description: string;
  created_at: string;
}

const loading = ref(true);

const stats = ref<OverviewStats>({
  totalUsers: 0,
  newUsersThisMonth: 0,
  totalPosts: 0,
  publishedPosts: 0,
  totalComments: 0,
  newCommentsThisWeek: 0,
  totalLikes: 0,
  postLikes: 0,
  commentLikes: 0
});

const recentActivities = ref<RecentActivity[]>([]);

onMounted(() => {
  fetchOverviewData();
});

async function fetchOverviewData() {
  loading.value = true;
  
  try {
    await Promise.all([
      fetchUserStats(),
      fetchPostStats(),
      fetchCommentStats(),
      fetchLikeStats(),
      fetchRecentActivities()
    ]);
  } catch (err) {
    console.error('概要データ取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

async function fetchUserStats() {
  const oneMonthAgo = subMonths(new Date(), 1).toISOString();
  
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  const { count: newUsersThisMonth } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneMonthAgo);
  
  stats.value.totalUsers = totalUsers || 0;
  stats.value.newUsersThisMonth = newUsersThisMonth || 0;
}

async function fetchPostStats() {
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });
  
  const { count: publishedPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);
  
  stats.value.totalPosts = totalPosts || 0;
  stats.value.publishedPosts = publishedPosts || 0;
}

async function fetchCommentStats() {
  const oneWeekAgo = subDays(new Date(), 7).toISOString();
  
  const { count: totalComments } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });
  
  const { count: newCommentsThisWeek } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo);
  
  stats.value.totalComments = totalComments || 0;
  stats.value.newCommentsThisWeek = newCommentsThisWeek || 0;
}

async function fetchLikeStats() {
  const { count: postLikes } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true });
  
  const { count: commentLikes } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true });
  
  stats.value.postLikes = postLikes || 0;
  stats.value.commentLikes = commentLikes || 0;
  stats.value.totalLikes = (postLikes || 0) + (commentLikes || 0);
}

async function fetchRecentActivities() {
  const activities: RecentActivity[] = [];
  
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, nickname, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentUsers) {
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        description: `新しいユーザー「${user.nickname || '名前未設定'}」が登録しました`,
        created_at: user.created_at
      });
    });
  }
  
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, title, created_at, profiles(nickname)')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentPosts) {
    recentPosts.forEach(post => {
      activities.push({
        id: `post-${post.id}`,
        type: 'post',
        description: `「${post.title}」が投稿されました`,
        created_at: post.created_at
      });
    });
  }
  
  const { data: recentComments } = await supabase
    .from('comments')
    .select('id, content, created_at, profiles(nickname), posts(title)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentComments) {
    recentComments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        description: `「${(comment as any).posts?.title}」にコメントが投稿されました`,
        created_at: comment.created_at
      });
    });
  }
  
  recentActivities.value = activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
}

function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch {
    return dateString;
  }
}
</script>
