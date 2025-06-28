<template>
  <div class="max-w-7xl mx-auto py-8">
    <h1 class="mb-8 text-3xl font-bold text-heading">サイト管理</h1>
    
    <!-- 管理者権限チェック -->
    <div v-if="!authStore.isAdmin" class="glass-card p-8 text-center">
      <PhWarning class="mx-auto mb-4 h-16 w-16 text-error" />
      <h2 class="mb-2 text-xl font-bold text-heading">アクセス権限がありません</h2>
      <p class="text-text-muted">このページにアクセスするには管理者権限が必要です。</p>
    </div>
    
    <!-- ローディング状態 -->
    <div v-else-if="loading" class="glass-card flex flex-col items-center justify-center p-8">
      <PhSpinner class="mb-4 w-10 h-10 animate-spin text-primary" />
      <p class="text-text-muted">読み込み中...</p>
    </div>
    
    <!-- 管理画面メインコンテンツ -->
    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <!-- サイドナビゲーション -->
      <div class="lg:col-span-1">
        <div class="glass-card sticky top-24 p-4 shadow-background/50">
          <h2 class="mb-4 text-xl font-bold text-heading">管理メニュー</h2>
          <nav class="space-y-2">
            <button 
              @click="activeTab = 'overview'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'overview' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhChartBar class="w-5 h-5" />
              概要
            </button>
            <button 
              @click="activeTab = 'users'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'users' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhUsers class="w-5 h-5" />
              ユーザー管理
            </button>
            <button 
              @click="activeTab = 'posts'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'posts' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhArticle class="w-5 h-5" />
              投稿管理
            </button>
            <button 
              @click="activeTab = 'comments'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'comments' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhChatText class="w-5 h-5" />
              コメント管理
            </button>
            <button 
              @click="activeTab = 'categories'" 
              class="btn btn-ghost flex w-full justify-start"
              :class="activeTab === 'categories' ? 'bg-primary/20 text-primary' : ''"
            >
              <PhTag class="w-5 h-5" />
              カテゴリ管理
            </button>
          </nav>
        </div>
      </div>
      
      <!-- メインコンテンツエリア -->
      <div class="lg:col-span-3">
        <!-- 概要 -->
        <AdminOverview v-if="activeTab === 'overview'" />
        
        <!-- ユーザー管理 -->
        <AdminUserManagement v-else-if="activeTab === 'users'" />
        
        <!-- 投稿管理 -->
        <AdminPostManagement v-else-if="activeTab === 'posts'" />
        
        <!-- コメント管理 -->
        <AdminCommentManagement v-else-if="activeTab === 'comments'" />
        
        <!-- カテゴリ管理 -->
        <AdminCategoryManagement v-else-if="activeTab === 'categories'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import AdminOverview from '../components/AdminPage/AdminOverview.vue';
import AdminUserManagement from '../components/AdminPage/AdminUserManagement.vue';
import AdminPostManagement from '../components/AdminPage/AdminPostManagement.vue';
import AdminCommentManagement from '../components/AdminPage/AdminCommentManagement.vue';
import AdminCategoryManagement from '../components/AdminPage/AdminCategoryManagement.vue';
import { 
  PhSpinner, 
  PhWarning,
  PhChartBar,
  PhUsers,
  PhArticle, 
  PhChatText, 
  PhTag
} from '@phosphor-icons/vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const activeTab = ref('overview');
const loading = ref(true);

function getTabFromUrl() {
  const tabParam = route.query.tab as string;
  const validTabs = ['overview', 'users', 'posts', 'comments', 'categories'];
  return validTabs.includes(tabParam) ? tabParam : 'overview';
}

watch(activeTab, (newTab) => {
  router.replace({ query: { tab: newTab } });
});

onMounted(async () => {
  if (!authStore.isAuthReady) {
    await new Promise(resolve => {
      const unwatch = watch(() => authStore.isAuthReady, (ready) => {
        if (ready) {
          unwatch();
          resolve(true);
        }
      });
    });
  }
  
  if (!authStore.isAuthenticated) {
    router.push('/auth');
    return;
  }
  
  if (!authStore.isAdmin) {
    router.push('/');
    return;
  }
  
  activeTab.value = getTabFromUrl();
  loading.value = false;
});
</script>
