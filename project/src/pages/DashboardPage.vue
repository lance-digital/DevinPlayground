<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="mb-8 text-3xl font-bold text-heading">ダッシュボード</h1>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="glass-card flex flex-col items-center justify-center p-8">
      <PhSpinner class="mb-4 w-10 h-10 animate-spin text-primary" />
      <p class="text-text-muted">読み込み中...</p>
    </div>
    
    <!-- メインコンテンツ -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <!-- サイドナビゲーション -->
      <div class="md:col-span-1">
        <div class="glass-card sticky top-24 p-4 shadow-background/50">
          <h2 class="mb-4 text-xl font-bold text-heading">メニュー</h2>
          <nav class="space-y-2">
            <button 
              @click="activeTab = 'posts'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'posts' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhArticle class="w-5 h-5" />
              投稿管理
            </button>
            <button 
              @click="activeTab = 'drafts'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'drafts' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhNotePencil class="w-5 h-5" />
              下書き
            </button>
            <button 
              @click="activeTab = 'comments'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'comments' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhChatText class="w-5 h-5" />
              コメント
            </button>
            <button 
              @click="activeTab = 'likes'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'likes' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhHeart class="w-5 h-5" />
              いいね
            </button>
            <button 
              @click="activeTab = 'stats'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'stats' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhChartBar class="w-5 h-5" />
              統計
            </button>
          </nav>
        </div>
      </div>
      
      <!-- メインコンテンツエリア -->
      <div class="md:col-span-2">
        <!-- 投稿管理 -->
        <DashboardPostsList v-if="activeTab === 'posts'" />
        
        <!-- 下書き -->
        <DashboardDraftsList v-else-if="activeTab === 'drafts'" />
        
        <!-- コメント -->
        <DashboardCommentsList v-else-if="activeTab === 'comments'" />
        
        <!-- いいね -->
        <DashboardLikesList v-else-if="activeTab === 'likes'" />
        
        <!-- 統計 -->
        <DashboardStatistics v-else-if="activeTab === 'stats'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import DashboardPostsList from '../components/DashboardPage/DashboardPostsList.vue';
import DashboardDraftsList from '../components/DashboardPage/DashboardDraftsList.vue';
import DashboardCommentsList from '../components/DashboardPage/DashboardCommentsList.vue';
import DashboardLikesList from '../components/DashboardPage/DashboardLikesList.vue';
import DashboardStatistics from '../components/DashboardPage/DashboardStatistics.vue';
import { 
  PhSpinner, 
  PhArticle, 
  PhNotePencil, 
  PhChatText, 
  PhHeart, 
  PhChartBar 
} from '@phosphor-icons/vue';

const router = useRouter();
const route = useRoute();  // ルート情報を取得するために追加
const authStore = useAuthStore();

// 状態
const activeTab = ref('posts');
const loading = ref(true);

// URLからタブ情報を取得
function getTabFromUrl() {
  const tabParam = route.query.tab as string;
  const validTabs = ['posts', 'drafts', 'comments', 'likes', 'stats'];
  return validTabs.includes(tabParam) ? tabParam : 'posts';
}

// タブ変更時にURLを更新
watch(activeTab, (newTab) => {
  router.replace({ query: { tab: newTab } });
});

// 認証チェックとタブの初期化
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  
  // URLからタブを取得してセット
  activeTab.value = getTabFromUrl();
  loading.value = false;
});
</script> 