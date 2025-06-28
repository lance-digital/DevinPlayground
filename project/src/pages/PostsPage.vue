<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <h1 class="mb-6 text-3xl font-bold text-heading">投稿一覧</h1>
    
    <!-- 検索フォーム -->
    <div class="mx-auto mb-8 max-w-3xl">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          class="w-full rounded-full border border-border bg-surface px-4 py-3 pr-10 text-text focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-30"
          placeholder="検索キーワードを入力してください"
          @input="debouncedSearch"
        />
        <button 
          @click="refreshData"
          class="btn-icon-primary absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <PhMagnifyingGlass class="h-6 w-6" />
        </button>
      </div>
    </div>
    
    <!-- フィルターとソート -->
    <div class="glass-card mb-6 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- カテゴリフィルター -->
        <div class="w-full sm:w-auto">
          <label for="category-filter" class="mb-1 block text-sm font-medium text-text">カテゴリ</label>
          <select
            id="category-filter"
            v-model="selectedCategoryId"
            class="appearance-none w-full rounded border border-border bg-surface bg-no-repeat pl-4 pr-10 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[160px]"
            style="background-size: 16px; background-position: right 16px center;"
          >
            <option :value="null">すべて</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }} ({{ category.post_count || 0 }})
            </option>
          </select>
        </div>
        
        <!-- ソート -->
        <div class="w-full sm:w-auto">
          <label for="sort-order" class="mb-1 block text-sm font-medium text-text">並び順</label>
          <select
            id="sort-order"
            v-model="sortOrder"
            class="appearance-none w-full rounded border border-border bg-surface bg-no-repeat pl-4 pr-10 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[160px]"
            style="background-size: 16px; background-position: right 16px center;"
          >
            <option value="created_at.desc">新しい順</option>
            <option value="created_at.asc">古い順</option>
            <option value="views.desc">閲覧数順</option>
            <option value="likes.desc">いいね数順</option>
          </select>
        </div>
        
        <!-- フィルターリセットボタン -->
        <div class="mt-auto ml-auto w-full sm:w-auto">
          <button @click="resetFilters" class="btn btn-outline-primary flex items-center">
            <PhArrowCounterClockwise class="mr-1 h-5 w-5" />
            フィルターをリセット
          </button>
        </div>
      </div>
    </div>
    
    <!-- メインコンテンツ -->
    <div>
      <!-- 検索中ローディング -->
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <PhSpinner class="h-8 w-8 animate-spin text-primary" />
      </div>
      
      <!-- エラー表示 -->
      <div v-else-if="error" class="glass-card p-4 text-error">
        <p>{{ error }}</p>
        <button @click="refreshData" class="btn btn-error mt-2">再試行</button>
      </div>
      
      <!-- 選択されたカテゴリタイトル -->
      <div v-else-if="selectedCategoryId && selectedCategory" class="mb-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-heading">{{ selectedCategory.name }}</h2>
        </div>
        <p v-if="selectedCategory.description" class="mt-2 text-text-muted">
          {{ selectedCategory.description }}
        </p>
      </div>
      
      <!-- 検索キーワードがあれば表示 -->
      <div v-else-if="searchQuery.trim()" class="mb-6">
        <h2 class="text-2xl font-bold text-heading">「{{ searchQuery }}」の検索結果</h2>
      </div>
      
      <!-- 投稿が存在しない場合 -->
      <div v-if="!loading && posts.length === 0" class="glass-card p-6 text-center">
        <p v-if="searchQuery.trim() || selectedCategoryId" class="text-text-muted">
          条件に一致する投稿は見つかりませんでした
        </p>
        <p v-else class="text-text-muted">
          まだ投稿はありません。
        </p>
        <button v-if="searchQuery.trim() || selectedCategoryId" 
                @click="resetFilters" 
                class="btn btn-outline-primary mt-4">
          フィルターをリセット
        </button>
      </div>
      
      <!-- 投稿一覧 -->
      <div v-else-if="posts.length > 0">
        <div v-if="totalResults > 0" class="mb-2 text-sm text-text-muted">
          {{ totalResults }}件中 {{ startIndex + 1 }}～{{ endIndex }}件を表示
        </div>
        
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PostCard 
            v-for="post in posts" 
            :key="post.id"
            :post="post"
          />
        </div>
        
        <!-- ページネーション -->
        <div v-if="totalPages > 1" class="mt-8 flex justify-center">
          <div class="flex space-x-2">
            <button 
              @click="changePage(currentPage - 1)" 
              class="btn btn-outline-primary btn-sm flex items-center"
              :disabled="currentPage === 1"
            >
              <PhCaretLeft class="mr-1 h-4 w-4" />
              前へ
            </button>
            
            <button
              v-for="page in getPageNumbers()"
              :key="page"
              @click="changePage(Number(page))"
              class="btn btn-sm"
              :class="currentPage === page ? 'btn-primary' : 'btn-outline-primary'"
            >
              {{ page }}
            </button>
            
            <button 
              @click="changePage(currentPage + 1)" 
              class="btn btn-outline-primary btn-sm flex items-center"
              :disabled="currentPage === totalPages"
            >
              次へ
              <PhCaretRight class="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { supabase } from '@/lib/supabase';
import PostCard from '../components/common/PostCard.vue';
import { 
  PhMagnifyingGlass, 
  PhArrowCounterClockwise, 
  PhCaretLeft, 
  PhCaretRight,
  PhSpinner
} from '@phosphor-icons/vue';

// カテゴリの型定義
interface Category {
  id: number;
  name: string;
  description: string | null;
  post_count?: number;
  created_at?: string;
  updated_at?: string;
}

// 検索結果の型定義
interface PostResult {
  id: string;
  author_id: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  published_at: string | null;
  created_at: string;
  views: number;
  author_name?: string;
  avatar_url?: string | null;
  like_count?: number;
}

// 状態管理
const searchQuery = ref('');
const posts = ref<PostResult[]>([]);
const categories = ref<Category[]>([]);
const selectedCategoryId = ref<number | null>(null);
const selectedCategory = ref<Category | null>(null);
const sortOrder = ref('created_at.desc');

// ローディング状態
const loading = ref(false);
const categoriesLoading = ref(false);
const error = ref('');
const categoriesError = ref('');
const isSearching = ref(false);

// ページネーション関連
const pageSize = 10;
const currentPage = ref(1);
const totalResults = ref(0);
const startIndex = computed(() => (currentPage.value - 1) * pageSize);
const endIndex = computed(() => Math.min(startIndex.value + pageSize, totalResults.value));
const totalPages = computed(() => Math.ceil(totalResults.value / pageSize));

// ルート・ルーターの取得
const route = useRoute();
const router = useRouter();

// 変数追加（スクリプト部分の上部）
const isUpdatingCategoryCounts = ref(false);

// 初期化
onMounted(() => {
  // データの取得
  fetchCategories();
  
  // URLからクエリパラメータを取得
  const query = route.query.q as string;
  const page = parseInt(route.query.page as string) || 1;
  const categoryId = route.query.category ? parseInt(route.query.category as string) : null;
  const sort = route.query.sort as string || 'created_at.desc';
  
  searchQuery.value = query || '';
  currentPage.value = page;
  selectedCategoryId.value = categoryId;
  sortOrder.value = sort;
  
  if (categoryId) {
    fetchCategoryDetails(categoryId);
  }
  
  // 検索またはフィルターがある場合はデータを取得
  refreshData();
  
  // 矢印のSVGカラーを動的に設定
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  
  const selectElements = document.querySelectorAll('select');
  selectElements.forEach(select => {
    select.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(${primaryColor})'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`;
  });
});

// 検索クエリが変更されたらURLを更新
watch(searchQuery, () => {
  if (!isSearching.value) {
    updateQueryParams();
    currentPage.value = 1;
  }
});

// フィルターやソートが変更されたらURLを更新
watch([selectedCategoryId, sortOrder], () => {
  updateQueryParams();
  currentPage.value = 1;
  
  if (selectedCategoryId.value) {
    fetchCategoryDetails(selectedCategoryId.value);
  } else {
    selectedCategory.value = null;
  }
  
  refreshData();
});

// ページが変更されたらURLを更新
watch(currentPage, () => {
  updateQueryParams();
});

// URLパラメータを更新
function updateQueryParams() {
  const query: Record<string, string | undefined> = {};
  
  if (searchQuery.value.trim()) query.q = searchQuery.value;
  if (selectedCategoryId.value) query.category = selectedCategoryId.value.toString();
  if (sortOrder.value !== 'created_at.desc') query.sort = sortOrder.value;
  if (currentPage.value > 1) query.page = currentPage.value.toString();
  
  router.replace({ query });
}

// フィルターのリセット
function resetFilters() {
  searchQuery.value = '';
  selectedCategoryId.value = null;
  selectedCategory.value = null;
  sortOrder.value = 'created_at.desc';
  currentPage.value = 1;
  updateQueryParams();
  refreshData();
}

// カテゴリ一覧を取得
async function fetchCategories() {
  categoriesLoading.value = true;
  categoriesError.value = '';
  
  try {
    // カテゴリの取得
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) throw categoriesError;
    
    // 各カテゴリの投稿数を取得（公開済み投稿のみカウント）
    const categoriesWithPostCount = await Promise.all((categoriesData || []).map(async (category) => {
      // 2つのクエリを組み合わせて公開済み投稿数を取得
      const { data: postIds, error: postIdError } = await supabase
        .from('posts')
        .select('id')
        .eq('published', true);
        
      if (postIdError) {
        console.error(`公開済み投稿ID取得エラー:`, postIdError);
        return {
          ...category,
          post_count: 0
        };
      }
        
      // 公開済み投稿IDのリストを取得
      const publicPostIds = postIds.map(post => post.id);
        
      // 該当カテゴリーかつ公開済み投稿のみをカウント
      const { count, error: countError } = await supabase
        .from('post_categories')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .in('post_id', publicPostIds);
      
      if (countError) console.error(`カテゴリ ${category.id} の投稿数取得エラー:`, countError);
      
      return {
        ...category,
        post_count: count || 0
      };
    }));
    
    categories.value = categoriesWithPostCount;
  } catch (err: any) {
    console.error('カテゴリ取得エラー:', err);
    categoriesError.value = err.message || 'カテゴリの読み込みに失敗しました';
  } finally {
    categoriesLoading.value = false;
  }
}

// 選択されたカテゴリの詳細を取得
async function fetchCategoryDetails(categoryId: number) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
      
    if (error) throw error;
    selectedCategory.value = data;
  } catch (err: any) {
    console.error('カテゴリ詳細取得エラー:', err);
    // エラーは表示しない（メインコンテンツのエラーと重複するため）
  }
}

// デバウンス処理された検索
const debouncedSearch = debounce(() => {
  updateQueryParams();
  refreshData();
}, 500);

// データ更新（検索または選択されたカテゴリの投稿を取得）
async function refreshData() {
  loading.value = true;
  error.value = '';
  isSearching.value = true;
  
  try {
    // キーワード検索がある場合
    if (searchQuery.value.trim()) {
      await performSearch();
    } else {
      // フィルター検索または全投稿取得
      await fetchFilteredPosts();
    }
  } catch (err: any) {
    console.error('データ取得エラー:', err);
    error.value = err.message || 'データの読み込みに失敗しました';
    posts.value = [];
    totalResults.value = 0;
  } finally {
    loading.value = false;
    isSearching.value = false;
    await updateFilterCounts();
  }
}

// キーワード検索の実行
async function performSearch() {
  if (!searchQuery.value.trim()) {
    posts.value = [];
    totalResults.value = 0;
    return;
  }
  
  try {
    // SQLスキーマに合わせて修正：search_term のみを渡す
    const { data, error: searchError } = await supabase.rpc('search_posts', {
      search_term: searchQuery.value
    });
    
    if (searchError) throw searchError;
    
    if (data && data.length > 0) {
      let filteredData: any[] = data;
      
      // カテゴリでさらにフィルタリング
      if (selectedCategoryId.value) {
        const { data: postIds } = await supabase
          .from('post_categories')
          .select('post_id')
          .eq('category_id', selectedCategoryId.value);
          
        if (postIds && postIds.length > 0) {
          const postIdSet = new Set(postIds.map(p => p.post_id));
          filteredData = filteredData.filter((post: PostResult) => postIdSet.has(post.id));
        } else {
          posts.value = [];
          totalResults.value = 0;
          return;
        }
      }
      
      // ソート処理
      filteredData = sortPosts(filteredData);
      
      // プロフィール情報を取得してアバターURLを追加
      const resultsWithDetails = await Promise.all(filteredData.map(async (post: any) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_data, nickname')
          .eq('id', post.author_id)
          .single();
          
        // いいね数を取得
        const { count: likeCount, error: likeError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
        
        if (likeError) console.error(`投稿 ${post.id} のいいね数取得エラー:`, likeError);
        
        // コメント数を取得
        const { count: commentCount, error: commentError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);
          
        if (commentError) console.error(`投稿 ${post.id} のコメント数取得エラー:`, commentError);
        
        return {
          ...post,
          avatar_url: profileData?.avatar_data || null,
          author_name: profileData?.nickname || '不明なユーザー',
          like_count: likeCount || 0,
          comment_count: commentCount || 0
        };
      }));
      
      // クライアントサイドでページネーション処理
      const allResults = resultsWithDetails;
      totalResults.value = allResults.length;
      
      // 現在のページに表示する結果のみをフィルタリング
      const start = (currentPage.value - 1) * pageSize;
      const end = start + pageSize;
      posts.value = allResults.slice(start, end);
    } else {
      posts.value = [];
      totalResults.value = 0;
    }
  } catch (err) {
    throw err;
  }
}

// フィルター適用した投稿を取得
async function fetchFilteredPosts() {
  loading.value = true;
  error.value = '';
  
  try {
    // 基本クエリ
    let query = supabase
      .from('posts')
      .select(`
        *, 
        profiles:author_id(
          nickname, 
          avatar_data
        )
      `, { count: 'exact' })
      .eq('published', true);
    
    // カテゴリによるフィルタリング
    if (selectedCategoryId.value) {
      const { data: postIds } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', selectedCategoryId.value);
      
      if (postIds && postIds.length > 0) {
        query = query.in('id', postIds.map(p => p.post_id));
      } else {
        // カテゴリに一致する投稿がない場合
        posts.value = [];
        totalResults.value = 0;
        loading.value = false;
        return;
      }
    }
    
    // 検索クエリによるフィルタリング
    if (searchQuery.value.trim()) {
      const { data: searchResults } = await supabase.rpc('search_posts', {
        search_term: searchQuery.value
      });
      
      if (searchResults && searchResults.length > 0) {
        query = query.in('id', searchResults.map((result: any) => result.id));
      } else {
        // 検索結果がない場合
        posts.value = [];
        totalResults.value = 0;
        loading.value = false;
        return;
      }
    }
    
    // ソート適用
    switch (sortOrder.value) {
      case 'created_at.desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'created_at.asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'views.desc':
        query = query.order('views', { ascending: false });
        break;
      case 'likes.desc':
        query = query.order('like_count', { ascending: false, nullsFirst: false });
        break;
    }
    
    // ページネーション適用
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) throw fetchError;
    totalResults.value = count || 0;
    
    // 各投稿に必要な追加データを取得
    const postsWithDetails = await Promise.all((data || []).map(async (post) => {
      // いいね数、コメント数を並行取得
      const [{ count: likeCount }, { count: commentCount }, { data: categoryData }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_categories').select('categories(id, name)').eq('post_id', post.id)
      ]);
      
      // カテゴリデータの整形
      const categories = (categoryData || [])
        .filter(item => item.categories && typeof item.categories === 'object')
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
  } catch (err) {
    console.error('投稿取得エラー:', err);
    error.value = '投稿の読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// 投稿ソート関数
function sortPosts(posts: any[]) {
  return [...posts].sort((a, b) => {
    switch (sortOrder.value) {
      case 'created_at.asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'views.desc':
        return (b.views || 0) - (a.views || 0);
      case 'likes.desc':
        return (b.like_count || 0) - (a.like_count || 0);
      case 'created_at.desc':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
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
  refreshData();
}

// ページ番号の配列を取得
function getPageNumbers(): (number | string)[] {
  const pages: (number | string)[] = [];
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

// フィルターカウントを更新するための関数を追加
async function updateFilterCounts() {
  if (loading.value) return;
  
  try {
    // 基本クエリ - 公開済みの投稿を取得
    let baseQuery = supabase.from('posts').select('id').eq('published', true);
    
    // 検索クエリがある場合
    if (searchQuery.value.trim()) {
      const { data: searchResults } = await supabase.rpc('search_posts', {
        search_term: searchQuery.value
      });
      
      if (searchResults && searchResults.length > 0) {
        const postIds = searchResults.map((post: any) => post.id);
        baseQuery = baseQuery.in('id', postIds);
      } else {
        // 検索結果がない場合は空のカウントを設定して終了
        updateEmptyCounts();
        return;
      }
    }
    
    // カテゴリが選択されている場合
    if (selectedCategoryId.value && !isUpdatingCategoryCounts.value) {
      const { data: categoryPostIds } = await supabase
        .from('post_categories')
        .select('post_id')
        .eq('category_id', selectedCategoryId.value);
        
      if (categoryPostIds && categoryPostIds.length > 0) {
        const postIds = categoryPostIds.map(item => item.post_id);
        baseQuery = baseQuery.in('id', postIds);
      } else {
        // 選択されたカテゴリに投稿がない場合は空のカウントを設定して終了
        updateEmptyCounts();
        return;
      }
    }
    
    // 現在のフィルター条件に一致する投稿IDを取得
    const { data: filteredPosts, error: postsError } = await baseQuery;
    
    if (postsError) throw postsError;
    
    if (!filteredPosts || filteredPosts.length === 0) {
      updateEmptyCounts();
      return;
    }
    
    // 投稿IDリスト
    const postIds = filteredPosts.map(post => post.id);
    
    // カテゴリカウントの更新
    if (!isUpdatingCategoryCounts.value) {
      isUpdatingCategoryCounts.value = true;
      
      // カテゴリごとの投稿数をカウント
      const updatedCategories = await Promise.all(categories.value.map(async (category) => {
        // この投稿IDリストに含まれる、このカテゴリに属する投稿をカウント
        const { count } = await supabase
          .from('post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .in('post_id', postIds);
          
        return { ...category, post_count: count || 0 };
      }));
      
      categories.value = updatedCategories;
      isUpdatingCategoryCounts.value = false;
    }
  } catch (err) {
    console.error('フィルターカウント更新エラー:', err);
  }
}

// 空のカウントに更新する補助関数
function updateEmptyCounts() {
  if (!isUpdatingCategoryCounts.value) {
    categories.value = categories.value.map(category => ({ ...category, post_count: 0 }));
  }
}

// 選択変更時にもカウントを更新するために、watch関数を追加
watch([selectedCategoryId, searchQuery], (newValues, oldValues) => {
  // 値が実際に変わった場合のみ更新
  if (JSON.stringify(newValues) !== JSON.stringify(oldValues)) {
    // ページロードなど初期状態では更新しない
    if (oldValues[0] !== undefined || oldValues[1] !== undefined) {
      updateFilterCounts();
    }
  }
});
</script>
