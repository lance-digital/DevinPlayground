<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-heading">カテゴリ管理</h2>
      <div class="flex items-center gap-2">
        <button 
          @click="showCreateModal = true"
          class="btn btn-primary btn-sm flex items-center gap-1"
        >
          <PhPlus class="h-4 w-4" />
          新規作成
        </button>
        <button 
          @click="fetchCategories"
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
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-8">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- カテゴリ一覧 -->
    <div v-else class="glass-card">
      <div v-if="categories.length === 0" class="p-6 text-center">
        <p class="text-text-muted">カテゴリがありません。</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-text-muted">カテゴリ名</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">作成者</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">投稿数</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">作成日</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr 
              v-for="category in categories" 
              :key="category.id"
              class="hover:bg-surface-variant/30"
            >
              <td class="p-4">
                <div class="font-medium text-text">{{ category.name }}</div>
              </td>
              <td class="p-4">
                <div class="text-sm text-text">{{ category.creator?.nickname || 'システム' }}</div>
                <div class="text-xs text-text-muted">{{ category.creator?.account_id || 'system' }}</div>
              </td>
              <td class="p-4">
                <span class="text-sm text-text-muted">{{ category.post_count }}</span>
              </td>
              <td class="p-4">
                <span class="text-sm text-text-muted">{{ formatDate(category.created_at) }}</span>
              </td>
              <td class="p-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="editCategory(category)"
                    class="btn btn-sm btn-outline-primary"
                  >
                    編集
                  </button>
                  <button
                    @click="deleteCategory(category)"
                    class="btn btn-sm btn-outline-error"
                    :disabled="category.post_count > 0"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 作成・編集モーダル -->
    <div v-if="showCreateModal || editingCategory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="glass-card w-full max-w-md p-6">
        <h3 class="mb-4 text-lg font-bold text-heading">
          {{ editingCategory ? 'カテゴリ編集' : 'カテゴリ作成' }}
        </h3>
        
        <form @submit.prevent="saveCategory">
          <div class="mb-4">
            <label class="mb-2 block text-sm font-medium text-text">カテゴリ名</label>
            <input
              v-model="categoryForm.name"
              type="text"
              class="input w-full"
              placeholder="カテゴリ名を入力..."
              required
            />
          </div>
          
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="cancelEdit"
              class="btn btn-outline-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!categoryForm.name.trim()"
            >
              {{ editingCategory ? '更新' : '作成' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  PhSpinner, 
  PhPlus,
  PhArrowClockwise
} from '@phosphor-icons/vue';

interface Category {
  id: string;
  name: string;
  created_at: string;
  post_count: number;
  creator: {
    nickname: string | null;
    account_id: string;
  } | null;
}

const authStore = useAuthStore();

const loading = ref(true);
const categories = ref<Category[]>([]);
const showCreateModal = ref(false);
const editingCategory = ref<Category | null>(null);

const categoryForm = ref({
  name: ''
});

onMounted(() => {
  fetchCategories();
});

async function fetchCategories() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        created_at,
        profiles:created_by (
          nickname,
          account_id
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const categoriesWithCounts = await Promise.all(
      (data || []).map(async (category) => {
        const { count: postCount } = await supabase
          .from('post_categories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        return {
          ...category,
          creator: Array.isArray(category.profiles) ? category.profiles[0] : category.profiles,
          post_count: postCount || 0
        };
      })
    );
    
    categories.value = categoriesWithCounts;
    
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

async function saveCategory() {
  try {
    if (editingCategory.value) {
      const { error } = await supabase
        .from('categories')
        .update({ name: categoryForm.value.name.trim() })
        .eq('id', editingCategory.value.id);
      
      if (error) throw error;
      
      alert('カテゴリを更新しました。');
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: categoryForm.value.name.trim(),
          created_by: authStore.user?.id
        });
      
      if (error) throw error;
      
      alert('カテゴリを作成しました。');
    }
    
    cancelEdit();
    fetchCategories();
    
  } catch (err) {
    console.error('カテゴリ保存エラー:', err);
    alert('カテゴリの保存に失敗しました。');
  }
}

function editCategory(category: Category) {
  editingCategory.value = category;
  categoryForm.value.name = category.name;
}

function cancelEdit() {
  showCreateModal.value = false;
  editingCategory.value = null;
  categoryForm.value.name = '';
}

async function deleteCategory(category: Category) {
  if (category.post_count > 0) {
    alert('投稿が関連付けられているカテゴリは削除できません。');
    return;
  }
  
  const confirmMessage = `カテゴリ「${category.name}」を削除しますか？この操作は取り消せません。`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);
    
    if (error) throw error;
    
    categories.value = categories.value.filter(c => c.id !== category.id);
    
    alert('カテゴリを削除しました。');
    
  } catch (err) {
    console.error('カテゴリ削除エラー:', err);
    alert('カテゴリの削除に失敗しました。');
  }
}

function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateString;
  }
}
</script>
