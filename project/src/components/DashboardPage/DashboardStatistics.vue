<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-heading">統計情報</h2>
      <button 
        @click="fetchAllStats"
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
    <div v-if="loading" class="flex justify-center p-6">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 統計カード -->
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2">
      <!-- 投稿数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">投稿数</h3>
          <PhArticle class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2 flex items-end justify-between">
          <div class="text-2xl font-bold text-heading">{{ stats.postCount }}</div>
          <div class="text-xs text-text-muted">直近30日: {{ stats.recentPostCount }}</div>
        </div>
      </div>
      
      <!-- 総閲覧数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総閲覧数</h3>
          <PhEye class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2 flex items-end justify-between">
          <div class="text-2xl font-bold text-heading">{{ stats.totalViews }}</div>
          <div class="text-xs text-text-muted">平均: {{ stats.averageViews }}/投稿</div>
        </div>
      </div>
      
      <!-- いいね数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総いいね数</h3>
          <PhHeart class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2 flex items-end justify-between">
          <div class="text-2xl font-bold text-heading">{{ stats.totalLikes }}</div>
          <div class="text-xs text-text-muted">平均: {{ stats.averageLikes }}/投稿</div>
        </div>
      </div>
      
      <!-- コメント数 -->
      <div class="glass-card p-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-muted">総コメント数</h3>
          <PhChatText class="h-6 w-6 text-primary" />
        </div>
        <div class="mt-2 flex items-end justify-between">
          <div class="text-2xl font-bold text-heading">{{ stats.totalComments }}</div>
          <div class="text-xs text-text-muted">平均: {{ stats.averageComments }}/投稿</div>
        </div>
      </div>
    </div>
    
    <!-- 人気の投稿 -->
    <div class="mt-6">
      <h3 class="mb-3 text-lg font-bold text-heading">人気の投稿</h3>
      <div v-if="popularPosts.length === 0" class="glass-card p-6 text-center">
        <p class="text-text-muted">まだ投稿はありません。</p>
      </div>
      <div v-else class="space-y-3">
        <div 
          v-for="post in popularPosts" 
          :key="post.id" 
          class="glass-card p-3 transition-shadow hover:shadow-lg"
        >
          <router-link :to="`/posts/${post.id}`" class="block">
            <h4 class="font-bold text-heading">{{ post.title }}</h4>
            <div class="mt-2 flex justify-between text-xs text-text-muted">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <PhEye class="mr-1 h-4 w-4" />
                  {{ post.views }}
                </span>
                <span class="flex items-center">
                  <PhHeart class="mr-1 h-4 w-4" />
                  {{ post.like_count }}
                </span>
                <span class="flex items-center">
                  <PhChatText class="mr-1 h-4 w-4" />
                  {{ post.comment_count }}
                </span>
              </div>
              <span>{{ formatDate(post.published_at || post.created_at) }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  PhSpinner, 
  PhArticle, 
  PhEye, 
  PhHeart, 
  PhChatText, 
  PhArrowClockwise
} from '@phosphor-icons/vue';

// 型定義
interface Stats {
  postCount: number;
  recentPostCount: number;
  totalViews: number;
  averageViews: number;
  totalLikes: number;
  averageLikes: number;
  totalComments: number;
  averageComments: number;
}

interface PopularPost {
  id: string;
  title: string;
  views: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  published_at: string | null;
}

const authStore = useAuthStore();
const loading = ref(true);

// 統計データ
const stats = ref<Stats>({
  postCount: 0,
  recentPostCount: 0,
  totalViews: 0,
  averageViews: 0,
  totalLikes: 0,
  averageLikes: 0,
  totalComments: 0,
  averageComments: 0
});

// 人気投稿
const popularPosts = ref<PopularPost[]>([]);

// 初期データ取得
onMounted(() => {
  fetchAllStats();
});

// 全統計データ取得
async function fetchAllStats() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    await Promise.all([
      fetchPostStats(),
      fetchPopularPosts()
    ]);
  } catch (err) {
    console.error('統計データ取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// 投稿関連の統計データ取得
async function fetchPostStats() {
  if (!authStore.user) return;
  
  // 30日前の日付
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  
  // 投稿数
  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', authStore.user.id)
    .eq('published', true);
  
  // 最近の投稿数
  const { count: recentPostCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', authStore.user.id)
    .eq('published', true)
    .gte('created_at', thirtyDaysAgo);
  
  // 総閲覧数
  const { data: viewsData } = await supabase
    .from('posts')
    .select('views')
    .eq('author_id', authStore.user.id)
    .eq('published', true);
  
  let totalViews = 0;
  if (viewsData) {
    totalViews = viewsData.reduce((sum, post) => sum + (post.views || 0), 0);
  }
  
  // 総いいね数 - post_likesテーブルから著者の投稿に対するいいね数を集計
  const { data: likeData } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', authStore.user.id)
    .eq('published', true);
  
  const postIds = likeData?.map(post => post.id) || [];
  
  let totalLikes = 0;
  if (postIds.length > 0) {
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .in('post_id', postIds);
    
    totalLikes = count || 0;
  }
  
  // 総コメント数 - commentsテーブルから著者の投稿に対するコメント数を集計
  let totalComments = 0;
  if (postIds.length > 0) {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('post_id', postIds);
    
    totalComments = count || 0;
  }
  
  // 統計データを更新
  stats.value = {
    ...stats.value,
    postCount: postCount || 0,
    recentPostCount: recentPostCount || 0,
    totalViews,
    averageViews: postCount ? Math.round(totalViews / postCount) : 0,
    totalLikes,
    averageLikes: postCount ? Math.round(totalLikes / postCount) : 0,
    totalComments,
    averageComments: postCount ? Math.round(totalComments / postCount) : 0
  };
}

// 人気投稿の取得
async function fetchPopularPosts() {
  if (!authStore.user) return;
  
  try {
    // 投稿の取得
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        views,
        created_at,
        published_at
      `)
      .eq('author_id', authStore.user.id)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(5);
    
    if (!posts || posts.length === 0) {
      popularPosts.value = [];
      return;
    }
    
    // 投稿IDの配列を作成
    const postIds = posts.map(post => post.id);
    
    // 各投稿のいいね数を取得
    const { data: likeData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);
    
    // 投稿ごとのいいね数をカウント
    const likeCounts: Record<string, number> = {};
    if (likeData) {
      likeData.forEach(like => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      });
    }
    
    // 各投稿のコメント数を取得
    const { data: commentData } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);
    
    // 投稿ごとのコメント数をカウント
    const commentCounts: Record<string, number> = {};
    if (commentData) {
      commentData.forEach(comment => {
        commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
      });
    }
    
    // 結果を整形
    popularPosts.value = posts.map(post => ({
      id: post.id,
      title: post.title,
      views: post.views || 0,
      like_count: likeCounts[post.id] || 0,
      comment_count: commentCounts[post.id] || 0,
      created_at: post.created_at,
      published_at: post.published_at
    }));
  } catch (err) {
    console.error('人気投稿の取得に失敗しました:', err);
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