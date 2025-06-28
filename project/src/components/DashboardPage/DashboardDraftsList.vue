<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-xl font-bold text-heading">下書き</h2>
      <div class="text-sm text-text-muted">
        全 {{ totalDrafts }} 件
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-6">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- 下書きがない場合 -->
    <div v-else-if="drafts.length === 0" class="glass-card p-6 text-center">
      <p class="text-text-muted">
        まだ投稿はありません。
      </p>
    </div>
    
    <!-- 下書きリスト -->
    <div v-else class="space-y-4">
      <div v-for="draft in drafts" :key="draft.id" class="glass-card p-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="flex-1">
            <h3 class="mb-1 text-lg font-bold text-heading">
              {{ draft.title || '(無題)' }}
            </h3>
            <p class="mb-2 text-sm text-text-muted">
              最終更新: {{ formatDate(draft.updated_at || draft.created_at) }}
            </p>
          </div>
          
          <!-- アクションボタン -->
          <div class="mt-3 flex space-x-2 md:mt-0">
            <router-link :to="`/editor/${draft.id}`" class="btn btn-outline-warning btn-sm">
              <PhPencilSimple class="mr-1 h-4 w-4" />
              編集
            </router-link>
            <button 
              @click="confirmPublish(draft)" 
              class="btn btn-outline-primary btn-sm"
            >
              <PhUpload class="mr-1 h-4 w-4" />
              公開
            </button>
            <button 
              @click="confirmDelete(draft)" 
              class="btn btn-outline-error btn-sm"
            >
              <PhTrash class="mr-1 h-4 w-4" />
              削除
            </button>
          </div>
        </div>
      </div>
      
      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <div class="flex space-x-2">
          <button 
            @click="changePage(currentPage - 1)" 
            class="btn btn-outline-primary"
            :disabled="currentPage === 1"
          >
            前へ
          </button>
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            @click="changePage(typeof page === 'number' ? page : currentPage)" 
            :class="[
              'btn',
              page === currentPage ? 'btn-primary' : 'btn-outline-primary'
            ]"
          >
            {{ page }}
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            class="btn btn-outline-primary"
            :disabled="currentPage === totalPages"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
    
    <!-- 削除確認モーダル -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
      <div class="glass-card mx-auto max-w-md">
        <h3 class="mb-4 text-xl font-bold text-heading">下書きを削除しますか？</h3>
        <p class="mb-6 text-text-muted">この操作は取り消せません。本当にこの下書きを削除しますか？</p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="btn btn-outline-secondary">
            キャンセル
          </button>
          <button 
            @click="deleteDraft" 
            class="btn btn-error"
            :disabled="actionSubmitting"
          >
            <PhSpinner v-if="actionSubmitting" class="mr-2 inline-block h-5 w-5 animate-spin" />
            {{ actionSubmitting ? '削除中...' : '削除する' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 公開確認モーダル -->
    <div v-if="showPublishModal" class="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
      <div class="glass-card mx-auto max-w-md">
        <h3 class="mb-4 text-xl font-bold text-heading">下書きを公開しますか？</h3>
        <p class="mb-6 text-text-muted">この下書きを公開すると、すべてのユーザーが閲覧できるようになります。</p>
        <div class="flex justify-end space-x-3">
          <button @click="showPublishModal = false" class="btn btn-outline-secondary">
            キャンセル
          </button>
          <button 
            @click="publishDraft" 
            class="btn btn-primary"
            :disabled="actionSubmitting"
          >
            <PhSpinner v-if="actionSubmitting" class="mr-2 inline-block h-5 w-5 animate-spin" />
            {{ actionSubmitting ? '公開中...' : '公開する' }}
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
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { PhSpinner, PhPencilSimple, PhUpload, PhTrash } from '@phosphor-icons/vue';

// 型定義を単純化
interface Draft {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const authStore = useAuthStore();

// 状態
const drafts = ref<Draft[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = 10;
const totalDrafts = ref(0);
const showDeleteModal = ref(false);
const showPublishModal = ref(false);
const selectedDraft = ref<Draft | null>(null);
const actionSubmitting = ref(false);

// 総ページ数
const totalPages = computed(() => {
  return Math.ceil(totalDrafts.value / pageSize);
});

// 初期化
onMounted(() => {
  fetchDrafts();
});

// 下書き一覧を取得
async function fetchDrafts() {
  if (!authStore.user) return;
  
  loading.value = true;
  
  try {
    // 下書き数を取得
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', authStore.user.id)
      .eq('published', false);
    
    if (countError) throw countError;
    
    totalDrafts.value = count || 0;
    
    // 下書きを取得（ページネーション対応）
    const from = (currentPage.value - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error: draftsError } = await supabase
      .from('posts')
      .select('id, title, created_at, updated_at')
      .eq('author_id', authStore.user.id)
      .eq('published', false)
      .order('updated_at', { ascending: false })
      .range(from, to);
    
    if (draftsError) throw draftsError;
    drafts.value = data || [];
  } catch (err) {
    console.error('下書き取得エラー:', err);
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
  fetchDrafts();
}

// ページ番号の配列を取得
function getPageNumbers(): number[] {
  const pages: number[] = [];
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

// 下書き削除確認
function confirmDelete(draft: Draft) {
  selectedDraft.value = draft;
  showDeleteModal.value = true;
  showPublishModal.value = false;
}

// 下書き公開確認
function confirmPublish(draft: Draft) {
  selectedDraft.value = draft;
  showPublishModal.value = true;
  showDeleteModal.value = false;
}

// 下書き削除
async function deleteDraft() {
  if (!selectedDraft.value || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // 下書きを削除（関連する画像は外部キー制約のCASCADEで自動的に削除される）
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', selectedDraft.value.id)
      .eq('author_id', authStore.user.id);
    
    if (deleteError) throw deleteError;
    
    // リストから削除
    drafts.value = drafts.value.filter(d => d.id !== selectedDraft.value?.id);
    totalDrafts.value--;
    showDeleteModal.value = false;
    
    // ページが空になった場合は前のページに戻る
    if (drafts.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchDrafts();
    }
  } catch (err) {
    console.error('下書き削除エラー:', err);
    alert('下書きの削除に失敗しました');
  } finally {
    actionSubmitting.value = false;
  }
}

// 下書き公開
async function publishDraft() {
  if (!selectedDraft.value || !authStore.user) return;
  
  actionSubmitting.value = true;
  
  try {
    // 投稿を公開状態に更新
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedDraft.value.id)
      .eq('author_id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // リストから削除
    drafts.value = drafts.value.filter(d => d.id !== selectedDraft.value?.id);
    totalDrafts.value--;
    showPublishModal.value = false;
    
    // ページが空になった場合は前のページに戻る
    if (drafts.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
      fetchDrafts();
    }
  } catch (err) {
    console.error('下書き公開エラー:', err);
    alert('下書きの公開に失敗しました');
  } finally {
    actionSubmitting.value = false;
  }
}

// 日付フォーマット
function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日 HH:mm', { locale: ja });
  } catch {
    return dateString;
  }
}
</script> 