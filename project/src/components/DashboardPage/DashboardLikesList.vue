<template>
  <div class="dashboard-likes-list">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-heading">いいね管理</h2>
      <div class="text-sm text-text-muted">
        全 {{ totalLikes }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- いいねがない場合 -->
    <div v-else-if="likes.length === 0" class="glass-card p-8 text-center">
      <p class="mb-4 text-text-muted">
        まだいいねした投稿はありません
      </p>
      <router-link to="/posts" class="btn btn-primary">
        投稿を探す
      </router-link>
    </div>
    
    <!-- いいねリスト -->
    <div v-else class="space-y-4">
      <div v-for="like in likes" :key="like.post_id" class="glass-card p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex-1">
            <h3 class="mb-1 text-lg font-bold text-heading">
              <router-link :to="`/posts/${like.post.id}`" class="hover:text-primary">
                {{ like.post.title }}
              </router-link>
            </h3>
            <p class="mb-2 text-sm text-text-muted">
              いいねした日: {{ formatDate(like.created_at) }}
            </p>
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <div class="mr-2 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-light text-text-white">
                  <img 
                    v-if="like.post.author?.avatar_data" 
                    :src="getProfileImageUrl(like.post.author.avatar_data)" 
                    :alt="like.post.author?.nickname || ''"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ getInitials(like.post.author?.nickname || '') }}</span>
                </div>
                <span class="text-sm text-text">{{ like.post.author?.nickname || '不明なユーザー' }}</span>
              </div>
            </div>
          </div>
          
          <!-- アクションボタン -->
          <div class="mt-3 flex space-x-2 md:mt-0">
            <router-link :to="`/posts/${like.post.id}`" class="btn btn-outline-primary btn-sm">
              <PhEye class="mr-1 h-4 w-4" />
              表示
            </router-link>
            <button 
              @click="removeLike(like)" 
              class="btn btn-outline-error btn-sm"
            >
              <PhHeartBreak class="mr-1 h-4 w-4" />
              いいね解除
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { getProfileImageUrl } from '../../lib/storage';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { PhSpinner, PhEye, PhHeartBreak } from '@phosphor-icons/vue';
import { useNotification } from '../../composables/useNotification';

// 型定義
interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    author?: {
      id: string;
      nickname: string | null;
      avatar_data: string | null;
    };
  };
}

const authStore = useAuthStore();
const { showNotification } = useNotification();

// 状態
const likes = ref<PostLike[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalLikes = ref(0);

// 計算プロパティ
const totalPages = computed(() => Math.ceil(totalLikes.value / pageSize));

// 初期データ取得
onMounted(() => {
  fetchLikes();
});

// いいね一覧を取得
async function fetchLikes() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // いいね数を取得
    const { count, error: countError } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id);
    
    if (countError) throw countError;
    totalLikes.value = count || 0;
    
    // ページネーションの計算
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // いいねデータを取得
    const { data, error: likesError } = await supabase
      .from('post_likes')
      .select(`
        post_id,
        user_id,
        created_at,
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
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (likesError) throw likesError;

    // データを正しい形式に変換
    likes.value = (data || []).map((item: any) => ({
      post_id: item.post_id,
      user_id: item.user_id,
      created_at: item.created_at,
      post: {
        id: item.post?.id,
        title: item.post?.title,
        author: item.post?.author ? {
          id: item.post.author.id,
          nickname: item.post.author.nickname,
          avatar_data: item.post.author.avatar_data
        } : undefined
      }
    }));
  } catch (err) {
    console.error('いいね取得エラー:', err);
    showNotification('error', 'エラー', 'いいねの取得に失敗しました');
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
  fetchLikes();
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

// いいねを削除
async function removeLike(like: PostLike) {
  if (!authStore.user) return;
  
  try {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', like.post_id)
      .eq('user_id', authStore.user.id);
    
    if (error) throw error;
    
    // リストから削除
    likes.value = likes.value.filter(l => l.post_id !== like.post_id);
    totalLikes.value--;
    
    // ページが空になった場合は前のページに戻る
    if (likes.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchLikes();
    }
    
    showNotification('success', '完了', 'いいねを解除しました');
  } catch (err) {
    console.error('いいね解除エラー:', err);
    showNotification('error', 'エラー', 'いいねの解除に失敗しました');
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

// イニシャルを取得
function getInitials(nickname: string) {
  if (!nickname) return 'U';
  return nickname.charAt(0).toUpperCase();
}
</script> 