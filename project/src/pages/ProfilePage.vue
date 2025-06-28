<template>
  <div class="mx-auto max-w-4xl py-8">
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card flex flex-col items-center justify-center p-8">
      <div class="flex flex-col items-center">
        <PhSpinner class="mb-4 h-10 w-10 animate-spin text-primary" />
        <p class="text-text-muted">読み込み中...</p>
      </div>
    </div>
    
    <!-- エラー表示 -->
    <div v-else-if="error" class="glass-card p-8 text-center">
      <PhWarning class="mx-auto mb-4 h-16 w-16 text-error" />
      <h2 class="mb-2 text-2xl font-bold">エラーが発生しました</h2>
      <p class="mb-4 text-text-muted">{{ error }}</p>
      <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
    </div>
    
    <!-- プロフィール表示 -->
    <div v-else>
      <!-- プロフィールヘッダー - 視覚的改善 -->
      <div class="glass-card relative mb-8 overflow-hidden p-8">
        <!-- 装飾的な背景要素 -->
        <div class="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary bg-opacity-10 filter blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col items-center md:flex-row md:items-start">
          <!-- アバター - サイズ拡大と効果追加 -->
          <div class="mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-primary-light text-4xl text-text-white ring-4 ring-primary-light ring-opacity-30 shadow-primary-dark shadow-opacity-20 transition-transform duration-300 hover:scale-105 md:mb-0 md:mr-8 md:h-40 md:w-40">
            <img 
              v-if="profile.avatar_data" 
              :src="getAvatarUrl(profile.avatar_data)" 
              :alt="profile.nickname"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ getInitials(profile.nickname) }}</span>
          </div>
          
          <!-- ユーザー情報 - レイアウト改善 -->
          <div class="flex-1 text-center md:text-left">
            <h1 class="mb-2 text-3xl font-bold text-primary">{{ profile.nickname }}</h1>
            
            <div class="mb-4 flex flex-wrap items-center justify-center space-x-3 text-sm text-text-muted md:justify-start">
              <p class="flex items-center">
                <span class="inline-block">@{{ profile.account_id }}</span>
              </p>
              <span class="hidden md:inline-block">•</span>
              <p>登録日: {{ formatDate(profile.created_at) }}</p>
            </div>
            
            <!-- 自己紹介 -->
            <div v-if="profile.bio" class="mb-6">
              <h3 class="mb-2 text-sm uppercase tracking-wide text-text-muted">自己紹介</h3>
              <p class="leading-relaxed text-text">
                {{ profile.bio }}
              </p>
            </div>
            
            <!-- シェアボタン - ボタンクラスを統一 -->
            <div class="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <button 
                @click="shareProfile('twitter')" 
                class="btn btn-accent3 btn-sm"
              >
                <PhTwitterLogo class="h-5 w-5" />
                X(Twitter)でシェア
              </button>
              
              <button 
                @click="copyProfileLink" 
                class="btn btn-secondary btn-sm"
              >
                <PhCopy class="h-5 w-5" />
                リンクをコピー
              </button>
            </div>
            
            <!-- 編集/ダッシュボードボタン - 自分のプロフィールのみ -->
            <div v-if="isOwnProfile" class="mt-4 flex justify-center gap-3 md:justify-start">
              <router-link 
                to="/profile/edit" 
                class="btn btn-outline-primary"
              >
                <PhPencilSimple class="mr-1.5 h-5 w-5" />
                編集
              </router-link>
              
              <router-link 
                to="/dashboard" 
                class="btn btn-outline-secondary"
              >
                <PhChartBar class="mr-1.5 h-5 w-5" />
                ダッシュボード
              </router-link>
              
              <!-- 削除ボタン -->
              <button 
                @click="showDeleteConfirmation = true" 
                class="btn btn-outline-error"
              >
                <PhTrash class="mr-1.5 h-5 w-5" />
                削除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 投稿一覧セクション - 視覚的改善 -->
      <div class="mb-8">
        <h2 class="mb-4 flex items-center text-2xl font-bold text-heading">
          <PhArticle class="mr-2 h-6 w-6 text-primary" />
          投稿一覧
        </h2>
        
        <div v-if="posts.length === 0" class="glass-card p-6 text-center">
          <p class="text-text-muted">まだ投稿はありません。</p>
        </div>
        
        <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <PostCard 
            v-for="post in posts" 
            :key="post.id" 
            :post="post"
          />
        </div>
      </div>
      
      <!-- カテゴリセクション -->
      <div v-if="topCategories && topCategories.length > 0" class="mb-8">
        <h2 class="mb-4 flex items-center text-2xl font-bold text-heading">
          <PhTag class="mr-2 h-6 w-6 text-primary" />
          関連カテゴリ
        </h2>
        
        <div class="flex flex-wrap gap-2">
          <router-link 
            v-for="category in topCategories" 
            :key="category.id" 
            :to="{path: '/posts', query: {category: category.id}}"
            class="rounded-full bg-primary bg-opacity-20 px-3 py-1 text-sm text-primary-light transition-colors hover:bg-primary hover:bg-opacity-30"
          >
            {{ category.name }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-70 p-4">
      <div class="glass-card w-full max-w-md p-6">
        <h3 class="mb-4 text-xl font-bold text-error">削除の確認</h3>
        
        <p class="mb-6 text-text">
          削除すると、あなたの全ての投稿、コメント、いいねなども削除されます。
          この操作は元に戻せません。本当に削除しますか？
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="showDeleteConfirmation = false" 
            class="btn btn-secondary"
          >
            キャンセル
          </button>
          
          <button 
            @click="deleteProfile" 
            class="btn btn-error"
            :disabled="isDeleting"
          >
            <PhSpinner v-if="isDeleting" class="mr-1.5 h-5 w-5 animate-spin" />
            <span v-if="isDeleting">削除中...</span>
            <span v-else>削除する</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { getProfileImageUrl } from '../lib/storage';
import PostCard from '../components/common/PostCard.vue';
import { useNotification } from '../composables/useNotification';
import { 
  PhSpinner,
  PhWarning,
  PhTwitterLogo,
  PhCopy,
  PhPencilSimple,
  PhChartBar,
  PhTrash,
  PhArticle,
  PhTag
} from '@phosphor-icons/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// 通知機能をコンポーザブルから取得
const { showNotification } = useNotification();

// 状態
const profile = ref<any>({});
const posts = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = 10;
const totalPosts = ref(0);
const topCategories = ref<any[]>([]);
const showDeleteConfirmation = ref(false);
const isDeleting = ref(false);

// 計算プロパティ
const userId = computed(() => {
  return route.params.id as string || authStore.user?.id;
});

const isOwnProfile = computed(() => {
  return authStore.isAuthenticated && authStore.user?.id === userId.value;
});

// プロフィールデータの取得
async function fetchProfile() {
  loading.value = true;
  error.value = null;
  
  try {
    // userId が undefined の場合は自分のプロフィールを表示
    const id = userId.value || authStore.user?.id;
    
    if (!id) {
      error.value = 'ユーザーが見つかりません';
      loading.value = false;
      return;
    }
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!data) {
      error.value = 'プロフィールが見つかりません';
      return;
    }
    
    // データを設定
    profile.value = data;
    
    // 追加情報を取得
    await Promise.all([
      fetchPosts(),
      fetchTopCategories()
    ]);
    
  } catch (err: any) {
    console.error('プロフィール取得エラー:', err);
    error.value = 'プロフィールの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// ユーザーの投稿一覧を取得
async function fetchPosts() {
  if (!userId.value) {
    console.error('ユーザーIDが不明です');
    error.value = 'ユーザー情報の取得に失敗しました';
    return;
  }

  try {
    // 投稿数を取得
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('author_id', userId.value)
      .eq('published', true);
    
    if (countError) throw countError;
    totalPosts.value = count || 0;
    
    // 投稿を取得（ページネーション対応）
    const offset = (currentPage.value - 1) * pageSize;
    const limit = pageSize;
    
    const { data, error: postsError } = await supabase
      .from('posts')
      .select('*, profiles:author_id(nickname, avatar_data)')
      .eq('author_id', userId.value)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (postsError) throw postsError;
    
    // いいね数、コメント数、カテゴリ情報を追加
    const postsWithDetails = await Promise.all((data || []).map(async (post) => {
      // いいね数、コメント数、カテゴリを並行取得
      const [{ count: likeCount }, { count: commentCount }, { data: categoryData }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_categories').select('categories(id, name)').eq('post_id', post.id)
      ]);
      
      // カテゴリデータの整形
      const categories = (categoryData || [])
        .filter(item => item.categories)
        .map(item => {
          // 配列かオブジェクトかをチェック
          const cat = Array.isArray(item.categories) 
            ? (item.categories.length > 0 ? item.categories[0] : { id: 0, name: '' })
            : item.categories;
          
          return {
            id: Number(cat.id),
            name: String(cat.name)
          };
        });
      
      return {
        ...post,
        like_count: likeCount || 0,
        comment_count: commentCount || 0,
        categories
      };
    }));
    
    posts.value = postsWithDetails;
  } catch (err: any) {
    console.error('投稿取得エラー:', err);
    error.value = '投稿の読み込みに失敗しました';
  }
}

// よく使うカテゴリの取得を修正
async function fetchTopCategories() {
  if (!userId.value) return;
  
  try {
    // サブクエリを修正してユーザーの投稿IDを取得
    const { data: userPostIds } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId.value);
    
    if (!userPostIds || userPostIds.length === 0) {
      topCategories.value = [];
      return;
    }
    
    // 投稿IDの配列を作成
    const postIds = userPostIds.map(post => post.id);
    
    // カテゴリを取得
    const { data, error: categoriesError } = await supabase
      .from('post_categories')
      .select('category_id, categories(*)')
      .in('post_id', postIds)
      .limit(5);
    
    if (categoriesError) throw categoriesError;
    
    // カテゴリの重複を除去 - 明示的な型チェックを追加
    const uniqueCategories = data?.reduce((acc: any[], item: any) => {
      if (!item.categories || typeof item.categories !== 'object') {
        return acc;
      }
      const exists = acc.some(cat => cat.id === item.categories.id);
      if (!exists) {
        acc.push(item.categories);
      }
      return acc;
    }, []);
    
    topCategories.value = uniqueCategories || [];
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
  }
}

// プロフィールをシェア
function shareProfile(platform: string) {
  const url = window.location.href;
  const title = `${profile.value.nickname || 'ユーザー'}のプロフィール | Juna`;
  
  if (platform === 'twitter') {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  }
}

// プロフィールリンクをコピー
function copyProfileLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      showNotification(
        'success',
        'リンクコピー完了',
        'プロフィールのリンクがコピーされました'
      );
    })
    .catch(err => {
      console.error('クリップボードコピーエラー:', err);
      showNotification(
        'error',
        'コピーエラー',
        'リンクのコピーに失敗しました'
      );
    });
}

// ヘルパー関数
function getInitials(name: string): string {
  return name?.charAt(0).toUpperCase() || '';
}

function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
}

// ユーザーIDの変更を監視
watch(() => route.params.id, () => {
  fetchProfile();
});

// 初期化
onMounted(() => {
  fetchProfile();
});

// プロフィール削除処理
async function deleteProfile() {
  if (!authStore.user || !isOwnProfile.value) {
    return;
  }
  
  isDeleting.value = true;
  
  try {
    // アクセストークンの取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました');
    }
    
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
    }
    
    // Edge Functionを使用してユーザーを完全に削除
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId: authStore.user.id })
      }
    );
    
    // レスポンスのステータスコードをチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `サーバーエラー (${response.status}): ${errorData.error || '不明なエラー'}`
      );
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'アカウント削除に失敗しました');
    }
    
    // ユーザーデータが削除されているので、まずストアの状態をクリア
    authStore.clearUser();
    
    // ログアウト処理はエラーを無視して実行
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (logoutError) {
      console.log('ログアウト中のエラーは無視します:', logoutError);
      // エラーは無視して処理を続行
    }
    
    // 削除成功メッセージを表示
    showNotification(
      'success', 
      'アカウント削除完了', 
      'アカウントとすべての関連データが正常に削除されました。'
    );
    
    // 少し遅延させてからリダイレクト（通知を表示する時間確保）
    setTimeout(() => {
      router.push('/');
      // 完全にリロードして状態をリセット
      setTimeout(() => window.location.reload(), 100);
    }, 500);
    
  } catch (err: any) {
    console.error('アカウント削除エラー:', err);
    // エラーメッセージを通知コンポーネントで表示
    showNotification(
      'error',
      'アカウント削除エラー',
      err.message || 'アカウントの削除中に問題が発生しました'
    );
    showDeleteConfirmation.value = false;
  } finally {
    isDeleting.value = false;
  }
}
</script>