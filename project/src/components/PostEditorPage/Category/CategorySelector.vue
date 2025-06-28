<template>
  <div>
    <label class="block mb-1 text-sm font-medium text-text-muted">カテゴリ <span class="text-error">*</span></label>
    
    <div class="relative">
      <div 
        class="flex flex-wrap items-center w-full min-h-10 gap-2 px-4 py-2 border border-border rounded bg-surface cursor-text"
        @click="isCategoryDropdownOpen = true"
      >
        <div 
          v-for="categoryId in modelValue" 
          :key="categoryId"
          class="inline-flex items-center px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
        >
          {{ getCategoryName(categoryId) }}
          <button 
            type="button" 
            @click.stop="removeCategory(categoryId)"
            class="ml-1 text-primary hover:text-primary-dark"
          >
            <PhX class="w-4 h-4" />
          </button>
        </div>
        
        <input
          ref="categoryInputRef"
          v-model="categorySearchQuery"
          @focus="isCategoryDropdownOpen = true"
          @blur="handleCategoryBlur"
          @keydown.enter.prevent="handleCategoryEnterKey"
          class="flex-1 min-w-[120px] bg-transparent text-text outline-none"
          placeholder="カテゴリを選択または入力..."
        />
      </div>
      
      <div 
        v-if="isCategoryDropdownOpen" 
        class="absolute z-10 w-full max-h-60 mt-1 overflow-y-auto border border-border rounded glass-card shadow-lg"
      >
        <div 
          v-if="categorySearchQuery && filteredCategories.length === 0" 
          @click="createNewCategory"
          class="flex items-center px-4 py-2 cursor-pointer text-text-muted hover:bg-surface-variant"
        >
          <PhPlus class="w-5 h-5 mr-2 text-success" />
          <span>「{{ categorySearchQuery }}」を新しいカテゴリとして追加</span>
        </div>
        
        <div 
          v-for="category in filteredCategories" 
          :key="category.id"
          @click="addCategory(category.id)"
          class="px-4 py-2 cursor-pointer text-text hover:bg-surface-variant"
          :class="{'bg-surface-variant': modelValue.includes(category.id.toString())}"
        >
          {{ category.name }}
        </div>
        
        <div v-if="!categorySearchQuery && !filteredCategories.length" class="px-4 py-2 text-text-muted">
          利用可能なカテゴリがありません
        </div>
      </div>
    </div>
    
    <p v-if="modelValue.length === 0" class="mt-1 text-xs text-error">
      少なくとも1つのカテゴリを選択してください
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { PhX, PhPlus } from '@phosphor-icons/vue';
import { supabase } from '../../../lib/supabase';

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface NewCategory {
  id: string;
  name: string;
}

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    default: () => []
  },
  postId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'error', 'categories-loaded']);

const availableCategories = ref<Category[]>([]);
const newCategories = ref<NewCategory[]>([]);
const isCategoryDropdownOpen = ref(false);
const categorySearchQuery = ref('');
const categoryInputRef = ref<HTMLInputElement | null>(null);
const formError = ref('');

const filteredCategories = computed(() => {
  if (!categorySearchQuery.value.trim()) {
    return availableCategories.value.filter(
      cat => !props.modelValue.includes(cat.id.toString())
    );
  }
  
  const query = categorySearchQuery.value.toLowerCase().trim();
  return availableCategories.value.filter(
    cat => cat.name.toLowerCase().includes(query) && 
           !props.modelValue.includes(cat.id.toString())
  );
});

onMounted(async () => {
  await fetchCategories();
});

async function fetchCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    availableCategories.value = data || [];
    emit('categories-loaded', availableCategories.value);
  } catch (err) {
    console.error('カテゴリ取得エラー:', err);
    formError.value = 'カテゴリの読み込みに失敗しました';
    emit('error', 'カテゴリの読み込みに失敗しました');
  }
}

function handleCategoryBlur() {
  setTimeout(() => {
    isCategoryDropdownOpen.value = false;
  }, 150);
}

function handleCategoryEnterKey() {
  if (categorySearchQuery.value.trim() && filteredCategories.value.length > 0) {
    addCategory(filteredCategories.value[0].id);
  } else if (categorySearchQuery.value.trim()) {
    createNewCategory();
  }
}

function createNewCategory() {
  if (!categorySearchQuery.value.trim()) return;
  const categoryName = categorySearchQuery.value.trim();
  
  // カテゴリ名のバリデーション - 最低2文字以上必要
  if (categoryName.length < 2) {
    emit('error', 'カテゴリ名は2文字以上必要です');
    return;
  }
  
  // まず既存のカテゴリで同名のものを検索
  const existingCategory = availableCategories.value.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  );
  
  if (existingCategory) {
    // 既存のカテゴリが見つかった場合はそれを使用
    addCategory(existingCategory.id);
    categorySearchQuery.value = '';
    return;
  }
  
  // 新しいカテゴリを一時的に保存
  const tempId = `new-${Date.now()}`;
  newCategories.value.push({
    id: tempId,
    name: categoryName
  });
  
  // 選択中のカテゴリに追加
  const updatedCategories = [...props.modelValue, tempId];
  emit('update:modelValue', updatedCategories);
  categorySearchQuery.value = '';
  categoryInputRef.value?.focus();
}

function addCategory(categoryId: number) {
  const categoryIdStr = categoryId.toString();
  if (!props.modelValue.includes(categoryIdStr)) {
    const newCategories = [...props.modelValue, categoryIdStr];
    emit('update:modelValue', newCategories);
  }
  categorySearchQuery.value = '';
  categoryInputRef.value?.focus();
}

function removeCategory(categoryId: string) {
  const newCategories = props.modelValue.filter(id => id !== categoryId);
  emit('update:modelValue', newCategories);
}

function getCategoryName(categoryId: string): string {
  // 新しく追加された一時カテゴリの場合
  if (categoryId.startsWith('new-')) {
    const newCategory = newCategories.value.find(c => c.id === categoryId);
    return newCategory ? newCategory.name : 'カテゴリなし';
  }
  
  // 既存のカテゴリの場合
  const category = availableCategories.value.find(c => c.id.toString() === categoryId);
  return category ? category.name : 'カテゴリなし';
}

async function savePostCategories(postId: string) {
  try {
    if (!postId || typeof postId !== 'string' || !postId.trim()) {
      throw new Error('投稿IDが無効です');
    }

    // 既存のカテゴリ関連を削除
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', postId);
    
    if (deleteError) throw deleteError;
    
    if (props.modelValue.length > 0) {
      // 実際のカテゴリIDのリストを作成
      const categoryIds = [];
      
      for (const categoryId of props.modelValue) {
        // 既存のカテゴリの場合はそのまま追加
        if (!categoryId.startsWith('new-')) {
          const numId = parseInt(categoryId);
          if (isNaN(numId)) {
            throw new Error(`無効なカテゴリID: ${categoryId}`);
          }
          categoryIds.push(numId);
        }
      }
      
      // カテゴリと投稿の関連付けを作成
      if (categoryIds.length > 0) {
        const categoryRelations = categoryIds.map(categoryId => ({
          post_id: postId,
          category_id: categoryId
        }));
        
        const { error: categoryError } = await supabase
          .from('post_categories')
          .insert(categoryRelations);
        
        if (categoryError) throw categoryError;
      }
    }
    
    return true;
  } catch (err) {
    console.error('カテゴリ保存エラー:', err);
    emit('error', 'カテゴリの保存に失敗しました');
    return false;
  }
}

// 新しいカテゴリをデータベースに保存する
async function saveNewCategories() {
  const savedCategoryIds: { [tempId: string]: number } = {};
  
  try {
    for (const newCategory of newCategories.value) {
      // カテゴリ名のバリデーション
      if (newCategory.name.length < 2) {
        console.warn(`スキップ: カテゴリ名「${newCategory.name}」は短すぎます`);
        continue;
      }
      
      // すべてのカテゴリを取得して、JavaScriptでフィルタリング
      const { data: allCategories, error: fetchError } = await supabase
        .from('categories')
        .select('*');
      
      if (fetchError) throw fetchError;
      
      // 同じ名前のカテゴリを検索
      const existingCategory = allCategories?.find(
        cat => cat.name.toLowerCase() === newCategory.name.toLowerCase()
      );
      
      if (existingCategory) {
        // 既存のカテゴリが見つかった場合はそれを使用
        savedCategoryIds[newCategory.id] = existingCategory.id;
        continue;
      }
      
      // 新しいカテゴリを作成
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.name }])
        .select('*')
        .single();
      
      if (error) {
        // 一意制約違反の場合（既に他のユーザーが作成した）
        if (error.code === '23505') { // PostgreSQLの一意制約違反コード
          // 再度すべてのカテゴリを取得して検索
          const { data: updatedCategories } = await supabase
            .from('categories')
            .select('*');
          
          if (updatedCategories) {
            const newlyAddedCategory = updatedCategories.find(
              cat => cat.name.toLowerCase() === newCategory.name.toLowerCase()
            );
            
            if (newlyAddedCategory) {
              savedCategoryIds[newCategory.id] = newlyAddedCategory.id;
            }
          }
        } else {
          throw error;
        }
      } else if (data) {
        savedCategoryIds[newCategory.id] = data.id;
      }
    }
    
    return savedCategoryIds;
  } catch (err) {
    console.error('新規カテゴリ保存エラー:', err);
    throw err;
  }
}

// 投稿に新しいカテゴリを関連付ける
async function savePostWithNewCategories(postId: string) {
  try {
    // 新しいカテゴリを保存し、一時IDと実際のIDのマッピングを取得
    const categoryIdMap = await saveNewCategories();
    
    // 選択されたカテゴリIDを実際のIDに変換
    const actualCategoryIds = props.modelValue.map(categoryId => {
      if (categoryId.startsWith('new-')) {
        return categoryIdMap[categoryId];
      }
      return parseInt(categoryId);
    }).filter(id => !isNaN(id));
    
    // 既存のカテゴリ関連を削除
    const { error: deleteError } = await supabase
      .from('post_categories')
      .delete()
      .eq('post_id', postId);
    
    if (deleteError) throw deleteError;
    
    // 新しいカテゴリ関連を作成
    if (actualCategoryIds.length > 0) {
      const categoryRelations = actualCategoryIds.map(categoryId => ({
        post_id: postId,
        category_id: categoryId
      }));
      
      const { error: categoryError } = await supabase
        .from('post_categories')
        .insert(categoryRelations);
      
      if (categoryError) throw categoryError;
    }
    
    // 新規カテゴリリストをクリア
    newCategories.value = [];
    
    // 利用可能なカテゴリリストを再取得
    await fetchCategories();
    
    return true;
  } catch (err) {
    console.error('カテゴリ関連付けエラー:', err);
    emit('error', 'カテゴリの保存に失敗しました');
    return false;
  }
}

// 新しいカテゴリのリストを取得
function getNewCategories() {
  return newCategories.value;
}

// 新しいカテゴリのリストを設定
function setNewCategories(categories: NewCategory[]) {
  newCategories.value = categories;
}

// 公開メソッド
defineExpose({
  fetchCategories,
  savePostCategories,
  saveNewCategories,
  savePostWithNewCategories,
  getNewCategories,
  setNewCategories,
  getAvailableCategories: () => availableCategories.value
});
</script> 