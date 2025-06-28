<template>
  <header class="sticky top-0 z-50 transition-all duration-300">
    <nav class="border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md">
      <div class="container mx-auto">
        <!-- モバイルナビゲーション -->
        <div class="flex items-center justify-between">
          <!-- ロゴ -->
          <router-link to="/" class="group flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-8 w-8 text-primary-light group-hover:scale-110 transition-transform">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span class="ml-2 text-xl font-bold tracking-wide text-primary-light">Juna</span>
          </router-link>

          <div class="flex items-center space-x-3">
            <!-- デスクトップのみ表示するリンク -->
            <div class="hidden items-center space-x-5 sm:flex">
              <router-link 
                to="/posts" 
                class="active-nav-link relative py-1 tracking-[0.02em] text-secondary hover:text-primary-light transition-colors"
                active-class="active-nav-link"
              >投稿一覧</router-link>
              
              <!-- 認証済みユーザーのみ表示 - 投稿作成ボタン -->
              <router-link 
                v-if="authStore.isAuthenticated" 
                to="/editor" 
                class="hidden items-center text-primary-light hover:text-primary transition-colors md:flex"
              >
                <PhPlus class="mr-1 h-4 w-4" />
                <span>投稿作成</span>
              </router-link>
            </div>

            <!-- 認証メニュー -->
            <div class="flex items-center space-x-3">
              <!-- 未認証の場合 -->
              <template v-if="!authStore.isAuthenticated">
                <router-link
                  to="/auth?mode=login"
                  class="btn btn-outline-primary rounded-full"
                >
                  ログイン
                </router-link>
                <router-link
                  to="/auth?mode=register"
                  class="btn btn-primary rounded-full hidden sm:flex"
                >
                  会員登録
                </router-link>
              </template>
              
              <!-- 認証済みの場合 - プロフィールメニュー -->
              <div v-else class="relative" ref="dropdownRef">
                <div 
                  @click="handleAvatarClick" 
                  class="flex items-center rounded-full bg-primary/20 px-2 py-1.5 cursor-pointer hover:bg-primary/30 transition-colors"
                >
                  <div 
                    class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full"
                  >
                    <img 
                      v-if="authStore.avatarUrl" 
                      :src="authStore.avatarUrl" 
                      :alt="authStore.displayName"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center bg-primary-dark/30 text-sm text-text">
                      {{ getInitials(authStore.displayName) }}
                    </div>
                  </div>
                  <PhCaretDown class="ml-1 h-4 w-4 hidden text-text sm:block" />
                </div>
                
                <!-- ドロップダウンメニュー -->
                <div 
                  v-show="dropdownOpen" 
                  class="absolute right-0 z-50 mt-2 hidden w-48 overflow-hidden rounded-lg border border-border-light/20 bg-background/80 py-2 shadow-lg backdrop-blur-md transition-all duration-200 ease-out animate-[dropdown_0.2s_ease-out_forwards] sm:block"
                >
                  <router-link 
                    to="/dashboard" 
                    class="flex items-center px-4 py-2.5 text-sm text-text hover:bg-primary/15 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    <PhList class="mr-2 h-4 w-4" />
                    ダッシュボード
                  </router-link>
                  
                  <router-link 
                    :to="`/profile/${authStore.user?.id}`" 
                    class="flex items-center px-4 py-2.5 text-sm text-text hover:bg-primary/15 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    <PhUser class="mr-2 h-4 w-4" />
                    プロフィール
                  </router-link>
                  
                  <router-link 
                    to="/editor" 
                    class="flex items-center px-4 py-2.5 text-sm text-text hover:bg-primary/15 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    <PhPlus class="mr-2 h-4 w-4" />
                    投稿作成
                  </router-link>
                  
                  <router-link 
                    to="/profile/edit" 
                    class="flex items-center px-4 py-2.5 text-sm text-text hover:bg-primary/15 transition-colors"
                    @click="dropdownOpen = false"
                  >
                    <PhGear class="mr-2 h-4 w-4" />
                    設定
                  </router-link>
                  
                  <div class="my-1 border-t border-border/30"></div>
                  
                  <button 
                    @click="handleLogout" 
                    class="flex w-full items-center px-4 py-2.5 text-left text-sm text-error hover:bg-primary/15 hover:text-error-dark transition-colors"
                  >
                    <PhSignOut class="mr-2 h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              </div>
            </div>

            <!-- モバイルメニューボタン -->
            <button 
              @click="toggleMobileMenu" 
              class="btn-icon-text sm:hidden"
              aria-label="モバイルメニュー"
            >
              <div v-if="!isMenuOpen">
                <PhList class="h-6 w-6" />
              </div>
              <div v-else>
                <PhX class="h-6 w-6" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- モバイルメニュー -->
    <div 
      v-if="isMenuOpen" 
      class="fixed inset-0 z-40 bg-background/95 sm:hidden"
      @click="isMenuOpen = false"
    >
      <div 
        class="h-full w-full max-w-xs overflow-y-auto bg-surface-variant px-4 py-6 shadow-xl shadow-background/50 ml-auto"
        @click.stop
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-medium text-heading">メニュー</h2>
          <button 
            @click="isMenuOpen = false" 
            class="btn-icon-text"
          >
            <PhX class="h-6 w-6" />
          </button>
        </div>
          
        <nav class="space-y-1">
          <router-link to="/" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">ホーム</router-link>
          <router-link to="/posts" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">投稿一覧</router-link>
          
          <div class="my-3 border-t border-border"></div>
          
          <template v-if="authStore.isAuthenticated">
            <div class="mb-2 flex items-center p-2">
              <div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/30">
                <img 
                  v-if="authStore.avatarUrl" 
                  :src="authStore.avatarUrl" 
                  :alt="authStore.displayName"
                  class="h-full w-full rounded-full object-cover"
                />
                <span v-else class="text-text">{{ getInitials(authStore.displayName) }}</span>
              </div>
              <span class="font-medium text-heading">{{ authStore.displayName }}</span>
            </div>
            <router-link to="/editor" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">投稿作成</router-link>
            <router-link to="/dashboard" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">ダッシュボード</router-link>
            <router-link :to="`/profile/${authStore.user?.id}`" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">プロフィール</router-link>
            <router-link to="/profile/edit" class="block rounded px-2 py-2.5 text-text hover:bg-primary/10 transition-colors" @click="isMenuOpen = false">設定</router-link>
            
            <div class="my-3 border-t border-border"></div>
            
            <button 
              @click="handleLogout(); isMenuOpen = false;" 
              class="btn btn-outline-error w-full justify-start text-left"
            >
              ログアウト
            </button>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { 
  PhPlus, 
  PhList, 
  PhUser, 
  PhGear, 
  PhSignOut,
  PhCaretDown,
  PhX 
} from '@phosphor-icons/vue';

const router = useRouter();
const authStore = useAuthStore();
const dropdownOpen = ref(false);
const isMenuOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const isMobile = ref(window.innerWidth < 640);

// ウィンドウサイズの変更を監視
function handleResize() {
  isMobile.value = window.innerWidth < 640;
  
  // モバイルからデスクトップへの切り替え時にメニューを閉じる
  if (!isMobile.value && isMenuOpen.value) {
    isMenuOpen.value = false;
    document.body.style.overflow = '';
  }
}

// アバターアイコンクリック時の処理
function handleAvatarClick() {
  // モバイル表示時は何もしない
  if (isMobile.value) {
    return;
  }
  // デスクトップ表示時はドロップダウンを切り替え
  dropdownOpen.value = !dropdownOpen.value;
}

// モバイルメニューの表示・非表示を切り替え
function toggleMobileMenu() {
  isMenuOpen.value = !isMenuOpen.value;
  
  // メニューを開いたらスクロールを無効化
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// ドロップダウン外側クリック時に閉じる
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

// ログアウト処理
function handleLogout() {
  dropdownOpen.value = false;
  authStore.logout();
  router.push('/');
}

// 名前のイニシャルを取得
function getInitials(name: string): string {
  if (!name) return '';
  return name.split(' ').map(part => part[0]).join('').toUpperCase();
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  // 初期状態を設定
  handleResize();
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  document.body.style.overflow = '';
  isMenuOpen.value = false;
});
</script>