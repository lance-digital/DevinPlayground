<template>
  <router-link 
    :to="`/posts/${post.id}`" 
    class="glass-card relative block overflow-hidden flex-col rounded-xl transition-all duration-300 hover:-translate-y-[5px] hover:shadow-primary-dark/40"
  >
    <!-- アクセント装飾 - プライマリカラーのグラデーションに統一 -->
    <div class="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary to-primary-light opacity-70"></div>
    
    <div class="relative flex h-full flex-col">
      <!-- 画像コンテナ -->
      <div class="relative aspect-video overflow-hidden">
        <img 
          v-if="post.cover_image_path" 
          :src="getImageUrl(post.cover_image_path)" 
          :alt="post.title"
          class="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
          loading="lazy"
        />
        <div 
          v-else 
          class="flex h-full w-full items-center justify-center bg-surface-variant/50"
        >
          <PhImage class="h-12 w-12 text-text-muted" />
        </div>
        
        <!-- 日付オーバーレイ - 背景色を統一 -->
        <div class="absolute bottom-3 right-3 rounded px-2 py-1 bg-background/70 text-xs text-text-white backdrop-blur-sm">
          {{ formatDate(post.published_at || post.created_at) }}
        </div>
      </div>
      
      <!-- コンテンツ部分 -->
      <div class="flex flex-1 flex-col px-5 pt-5">
        <!-- タイトル - 見出し色に統一 -->
        <h3 
          class="mb-2 line-clamp-2 text-xl font-semibold text-heading"
          v-if="post.title_highlight" 
          v-html="post.title_highlight"
        ></h3>
        <h3 
          class="mb-2 line-clamp-2 text-xl font-semibold text-heading"
          v-else
        >{{ post.title }}</h3>
        
        <!-- カテゴリバッジ表示の修正 - 表示数制限と高さ制限を追加 -->
        <div v-if="post.categories && post.categories.length > 0" class="mb-3 flex max-h-[60px] flex-wrap gap-1.5 overflow-hidden">
          <span 
            v-for="category in limitedCategories" 
            :key="category.id"
            class="rounded-full px-2 py-0.5 bg-primary/20 text-xs text-primary-light"
          >
            {{ category.name }}
          </span>
          <span 
            v-if="post.categories.length > maxCategories" 
            class="rounded-full px-2 py-0.5 bg-surface-variant text-xs text-text-muted"
          >
            +{{ post.categories.length - maxCategories }}
          </span>
        </div>
        
        <!-- 抜粋 - 二次テキスト色に統一 -->
        <p 
          v-if="post.excerpt_highlight" 
          class="mb-4 line-clamp-3 text-sm text-text-muted"
          v-html="post.excerpt_highlight"
        ></p>
        <p 
          v-else-if="post.excerpt" 
          class="mb-4 line-clamp-3 text-sm text-text-muted"
        >
          {{ post.excerpt }}
        </p>
        
        <!-- フッター部分 - 2行レイアウトに変更 -->
        <div class="mt-auto flex flex-col border-t border-border-light pt-3">
          <!-- 上段：著者情報 -->
          <div class="mb-2 flex items-center">
            <!-- ユーザーアバター -->
            <div class="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
              <img 
                v-if="post.profiles?.avatar_data || post.avatar_url" 
                :src="getAvatarUrl(post.profiles?.avatar_data || post.avatar_url!)" 
                :alt="getUserName()"
                class="h-full w-full rounded-full object-cover"
              />
              <div 
                v-else 
                class="flex h-full w-full items-center justify-center bg-primary/30 text-text-white"
              >
                {{ getInitials(getUserName()) }}
              </div>
            </div>
            
            <!-- 著者情報 -->
            <div class="flex min-w-0 flex-grow flex-col">
              <!-- ユーザー名 - 切り詰めを最大幅設定で制御 -->
              <span class="overflow-hidden text-ellipsis text-sm text-text" :class="{'truncate': isLongUsername}">
                {{ getUserName() }}
              </span>
            </div>
          </div>
          
          <!-- 下段：統計情報 -->
          <div class="flex items-center justify-end gap-4">
            <div class="flex items-center">
              <PhEye class="mr-1 h-4 w-4 text-text-muted" />
              <span class="text-sm text-text-muted">{{ post.views || 0 }}</span>
            </div>
            
            <div class="flex items-center">
              <PhHeart class="mr-1 h-4 w-4 text-error" />
              <span class="text-sm text-error">{{ post.like_count || post.likes_count || 0 }}</span>
            </div>
            
            <div class="flex items-center">
              <PhChatText class="mr-1 h-4 w-4 text-info" />
              <span class="text-sm text-info">{{ post.comment_count || post.comments_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getProfileImageUrl, getCoverImageUrl } from '../../lib/storage';
import { 
  PhImage, 
  PhEye, 
  PhHeart, 
  PhChatText 
} from '@phosphor-icons/vue';
import { computed } from 'vue';

// カテゴリの型定義
interface Category {
  id: number;
  name: string;
}

// 投稿の型定義
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  created_at: string;
  views?: number;
  profiles?: {
    nickname?: string | null;
    avatar_data?: string | null;
  };
  author_id?: string;
  nickname?: string | null;
  author_name?: string | null;
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  title_highlight?: string;
  excerpt_highlight?: string;
  avatar_url?: string | null;
  categories?: Category[];
}

// プロップス定義
const props = defineProps({
  post: {
    type: Object as () => Post,
    required: true
  }
});

// 日付フォーマット
function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch (e) {
    return dateString;
  }
}

// ユーザー名取得 - 様々な場所から名前を取得可能にする
function getUserName(): string {
  return props.post.profiles?.nickname || 
         props.post.author_name || 
         props.post.nickname || 
         '不明なユーザー';
}

// イニシャル取得
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

// 画像URL取得
function getImageUrl(path: string): string {
  return getCoverImageUrl(path);
}

// アバターURL取得
function getAvatarUrl(path: string): string {
  return getProfileImageUrl(path);
}

// 名前が長いかどうかを判定する計算プロパティ
const isLongUsername = computed(() => {
  const name = getUserName();
  return name.length > 10; // 10文字以上を長い名前と判断
});

// カテゴリの最大表示数
const maxCategories = 3;

// 表示するカテゴリを制限する計算プロパティ
const limitedCategories = computed(() => {
  if (!props.post.categories) return [];
  return props.post.categories.slice(0, maxCategories);
});
</script>

<style>
/* Tailwind の line-clamp クラスがうまく動作しない場合のバックアップ */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 