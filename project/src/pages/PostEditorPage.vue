<template>
  <div>
    <div class="max-w-3xl mx-auto py-8">
      <div class="post-form glass-card p-6">
        <h1 class="mb-6 text-2xl font-bold text-heading">{{ isEditMode ? '投稿を編集' : '新しい投稿を作成' }}</h1>
        
        <div v-if="formError" class="mb-6 rounded border border-error-dark border-opacity-50 bg-error bg-opacity-20 px-4 py-3 text-error">
          {{ formError }}
        </div>
        
        <form @submit.prevent="handleSubmit" @keydown.enter.prevent="preventEnterSubmit" class="space-y-6" novalidate>
          <div>
            <label for="title" class="mb-1 block text-sm font-medium text-heading">タイトル <span class="text-error">*</span></label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              class="w-full rounded border border-border bg-surface px-4 py-2 text-heading focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="投稿のタイトル"
              required
            />
          </div>
          
          <div>
            <label for="excerpt" class="mb-1 block text-sm font-medium text-text-muted">概要</label>
            <textarea
              id="excerpt"
              v-model="formData.excerpt"
              rows="3"
              class="w-full rounded border border-border bg-surface px-4 py-2 text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="投稿の短い説明（オプション）"
            ></textarea>
          </div>
          
          <div>
            <EyecatchUploader
              v-model="formData.cover_image_path"
              :richTextEditorRef="richTextEditorRef"
              @file-selected="featuredImageFile = $event"
              @upload-error="formError = $event"
              ref="eyecatchUploaderRef"
            />
          </div>
          
          <div>
            <label for="content" class="mb-1 block text-sm font-medium text-text-muted">本文 <span class="text-error">*</span></label>
            <RichTextEditor
              ref="richTextEditorRef"
              v-model="formData.content"
              placeholder="投稿の本文を入力してください"
              :uploadingExternalImages="isUploading"
              @upload-status-changed="handleUploadStatusChange"
              @pending-images-updated="handlePendingImagesUpdated"
            />
          </div>
          
          <div>
            <CategorySelector
              ref="categorySelectorRef"
              v-model="formData.categories"
              :postId="props.id"
              @error="formError = $event"
            />
          </div>
          
          <div>
            <label class="mb-1 block text-sm font-medium text-text-muted">公開設定</label>
            <div class="flex items-center space-x-4">
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="formData.published" 
                  :value="true"
                  class="h-4 w-4 text-primary focus:ring-primary"
                />
                <span class="ml-2 text-text-muted">公開</span>
              </label>
              <label class="inline-flex items-center">
                <input 
                  type="radio" 
                  v-model="formData.published" 
                  :value="false"
                  class="h-4 w-4 text-primary focus:ring-primary"
                />
                <span class="ml-2 text-text-muted">下書き</span>
              </label>
            </div>
          </div>
          
          <div class="flex justify-between pt-4">
            <router-link to="/" class="btn btn-outline-secondary" type="button" @click="handleCancel">キャンセル</router-link>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="submitting || !isFormValid || isUploading"
            >
              <PhSpinner v-if="submitting" class="mr-2 h-5 w-5 animate-spin" />
              {{ submitting ? '保存中...' : (isEditMode ? '更新する' : '投稿する') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="sessionExpiredModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-50">
      <div class="glass-card w-full max-w-md rounded-lg p-6">
        <h3 class="mb-4 text-xl font-bold text-heading">セッションが切れました</h3>
        <p class="mb-4 text-text">長時間の操作がなかったため、ログインセッションが切れました。内容は一時保存されていますので、再ログイン後に編集を続けることができます。</p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="handleLoginRedirect()" 
            class="btn btn-primary"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    </div>

    <div v-if="lastAutoSaveTime" class="fixed bottom-4 right-4 rounded bg-surface-variant p-2 text-sm text-text-muted shadow-md opacity-70 z-50">
      最終自動保存: {{ lastAutoSaveTime.toLocaleTimeString() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import RichTextEditor from '../components/PostEditorPage/Editor/RichTextEditor.vue';
import { PhSpinner } from '@phosphor-icons/vue';
import EyecatchUploader from '../components/PostEditorPage/Eyecatch/EyecatchUploader.vue';
import CategorySelector from '../components/PostEditorPage/Category/CategorySelector.vue';

interface FormData {
  title: string;
  excerpt: string | null;
  content: any;
  cover_image_path: string | null;
  published: boolean;
  categories: string[];
}

const props = defineProps({
  id: {
    type: String,
    default: null
  }
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const formData = reactive<FormData>({
  title: '',
  excerpt: null,
  content: '',
  cover_image_path: null,
  published: false,
  categories: []
});

const featuredImageFile = ref<File | null>(null);
const submitting = ref(false);
const formError = ref('');
const isEditMode = computed(() => !!props.id);
const isFormValid = computed(() => {
  let contentValid = false;
  
  if (typeof formData.content === 'string') {
    contentValid = formData.content.trim() !== '';
  } else if (typeof formData.content === 'object' && formData.content !== null) {
    contentValid = true;
    
    if (formData.content.type === 'doc' && formData.content.content) {
      contentValid = formData.content.content.length > 0;
    }
  }
  
  return formData.title.trim() !== '' && 
         contentValid &&
         formData.categories.length > 0;
});

const uploadedImages = ref<{path: string, userId: string}[]>([]);
const isUploading = ref(false);
const pendingImages = ref<{file: File, id: string}[]>([]);
const richTextEditorRef = ref<InstanceType<typeof RichTextEditor> | null>(null);
const categorySelectorRef = ref<InstanceType<typeof CategorySelector> | null>(null);
const eyecatchUploaderRef = ref<InstanceType<typeof EyecatchUploader> | null>(null);
const sessionCheckInterval = ref<number | null>(null);
const sessionExpiredModalOpen = ref(false);
const isSessionValid = ref(true);

// 自動保存のインターバルと最終保存時間
const autoSaveInterval = ref<number | null>(null);
const lastAutoSaveTime = ref<Date | null>(null);

// propsのidの変更を監視して、画面遷移時にデータをリセット
watch(() => route.path, async () => {
  // パスが変わったらデータをリセット
  resetFormData();
  resetUploadState();
  
  // 編集モードの場合は新しいデータを取得
  if (props.id) {
    await fetchPost(props.id);
  }
  
  // 24時間以内のデータを復元
  await checkForSavedData();
}, { immediate: true });

onMounted(async () => {
  resetFormData();
  
  if (props.id) {
    await fetchPost(props.id);
  }
  
  sessionCheckInterval.value = window.setInterval(async () => {
    await checkSessionStatus();
  }, 5 * 60 * 1000);

  const returnParam = new URLSearchParams(window.location.search).get('return');
  if (returnParam === 'login') {
    await restoreFromLocalStorage();
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // 既存の自動保存インターバル設定
  autoSaveInterval.value = window.setInterval(() => {
    if (isFormValid.value && !submitting.value) {
      saveToLocalStorage();
      lastAutoSaveTime.value = new Date();
    } else if (!submitting.value && (
      formData.title.trim() !== '' || 
      formData.excerpt || 
      formData.content || 
      formData.cover_image_path || 
      formData.categories.length > 0
    )) {
      // フォームが完全に有効でなくても、何か入力があれば部分的に保存
      saveToLocalStorage(true);
      lastAutoSaveTime.value = new Date();
    } else {
      // 何も入力がない場合でも時間だけは更新
      lastAutoSaveTime.value = new Date();
    }
  }, 60 * 1000);
  
  // 保存データのチェックと復元
  checkForSavedData();
  
  // 期限切れデータの削除処理
  checkExpiredData();
});

onBeforeUnmount(() => {
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
  
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
  }
});

function resetFormData() {
  formData.title = '';
  formData.excerpt = null;
  formData.content = '';
  formData.cover_image_path = null;
  formData.published = false;
  formData.categories = [];
  
  // アイキャッチ画像もリセット
  if (eyecatchUploaderRef.value) {
    eyecatchUploaderRef.value.preview = null;
    eyecatchUploaderRef.value.imageFile = null;
    if (formData.cover_image_path) {
      formData.cover_image_path = null;
    }
  }
  
  // エディタの内容をリセット
  if (richTextEditorRef.value) {
    richTextEditorRef.value.setContent('');
  }
  
  // アップロード状態もリセット
  pendingImages.value = [];
  uploadedImages.value = [];
  featuredImageFile.value = null;
}

function resetUploadState() {
  isUploading.value = false;
}

async function fetchPost(postId: string) {
  try {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        post_categories(category_id)
      `)
      .eq('id', postId)
      .single();
    
    if (postError) throw postError;
    
    if (!post) {
      throw new Error('投稿が見つかりません');
    }
    
    formData.title = post.title;
    formData.excerpt = post.excerpt;
    
    if (post.content) {
      if (typeof post.content === 'object') {
        if (post.content.type === 'doc') {
          formData.content = post.content;
        } else if (post.content.text) {
          formData.content = post.content.text;
        }
      } else if (typeof post.content === 'string') {
        formData.content = post.content;
      }
    }
    
    formData.cover_image_path = post.cover_image_path;
    formData.published = post.published;
    
    if (post.post_categories) {
      formData.categories = post.post_categories.map((c: any) => c.category_id.toString());
    }
  } catch (err) {
    console.error('投稿取得エラー:', err);
    formError.value = '投稿の読み込みに失敗しました';
  }
}

function preventEnterSubmit(e: KeyboardEvent) {
  if (!e.target) return;
  
  const target = e.target as HTMLElement;
  
  if (target.tagName === 'TEXTAREA') return;
  
  if (target.closest('.ProseMirror')) return;
  
  if (target.tagName === 'INPUT' && e.key === 'Enter') {
    e.preventDefault();
  }
}

function handleUploadStatusChange(status: boolean) {
  isUploading.value = status;
}

function handlePendingImagesUpdated(images: {file: File, id: string}[]) {
  pendingImages.value = images;
}

async function checkSessionStatus() {
  try {
    const refreshResult = await authStore.refreshSession();
    
    if (!refreshResult) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        isSessionValid.value = false;
        sessionExpiredModalOpen.value = true;
        
        saveToLocalStorage();
      }
    }
  } catch (error) {
    console.error('セッションチェックエラー:', error);
  }
}

function saveToLocalStorage(isPartial = false) {
  try {
    // 保存用キーの生成
    const storageKey = props.id ? `temp_edit_post_data_${props.id}` : 'temp_new_post_data';
    
    // ファイルデータのBase64エンコード
    let fileDataBase64: string | null = null;
    if (eyecatchUploaderRef.value?.imageFile) {
      if (eyecatchUploaderRef.value.fileDataBase64) {
        fileDataBase64 = eyecatchUploaderRef.value.fileDataBase64;
      } else if (eyecatchUploaderRef.value.preview) {
        fileDataBase64 = eyecatchUploaderRef.value.preview;
      }
    }
    
    // 新規カテゴリ情報の取得
    const newCategories = categorySelectorRef.value?.getNewCategories() || [];
    
    const tempData = {
      title: formData.title,
      excerpt: formData.excerpt,
      content: formData.content,
      categories: formData.categories,
      published: formData.published,
      timestamp: new Date().getTime(),
      postId: props.id || null,
      cover_image_path: formData.cover_image_path,
      eyecatch_preview: eyecatchUploaderRef.value?.preview || null,
      eyecatch_file_data: fileDataBase64,
      eyecatch_file_name: eyecatchUploaderRef.value?.imageFile?.name || null,
      eyecatch_file_type: eyecatchUploaderRef.value?.imageFile?.type || null,
      isPartialSave: isPartial,
      newCategories: newCategories // 新規カテゴリ情報を追加
    };
    
    localStorage.setItem(storageKey, JSON.stringify(tempData));
  } catch (error) {
    console.error('一時保存エラー:', error);
  }
}

function restoreFromLocalStorage() {
  try {
    // 復元用キーの生成
    const storageKey = props.id ? `temp_edit_post_data_${props.id}` : 'temp_new_post_data';
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const tempData = JSON.parse(savedData);
      
      // 編集モードでは該当IDの投稿データのみ復元
      if (props.id && tempData.postId !== props.id) {
        return false;
      }
      
      // 24時間以内のデータのみ復元
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (new Date().getTime() - tempData.timestamp < oneDayInMs) {
        formData.title = tempData.title;
        formData.excerpt = tempData.excerpt;
        formData.categories = tempData.categories;
        formData.published = tempData.published;
        formData.cover_image_path = tempData.cover_image_path;
        
        // エディタのコンテンツを復元
        if (richTextEditorRef.value && tempData.content) {
          richTextEditorRef.value.setContent(tempData.content);
          formData.content = tempData.content;
        }
        
        // アイキャッチプレビューの復元
        if (eyecatchUploaderRef.value) {
          if (tempData.eyecatch_preview) {
            eyecatchUploaderRef.value.setPreview(tempData.eyecatch_preview);
          }
          
          // ファイルデータの復元
          if (tempData.eyecatch_file_data && tempData.eyecatch_file_name && tempData.eyecatch_file_type) {
            eyecatchUploaderRef.value.restoreFileFromBase64(
              tempData.eyecatch_file_data,
              tempData.eyecatch_file_name,
              tempData.eyecatch_file_type
            );
          }
        }
        
        // 新規カテゴリの復元
        if (categorySelectorRef.value && tempData.newCategories) {
          categorySelectorRef.value.setNewCategories(tempData.newCategories);
        }
        
        return true;
      } else {
        // 24時間を超えたデータは削除
        localStorage.removeItem(storageKey);
      }
    }
    return false;
  } catch (error) {
    console.error('データ復元エラー:', error);
    return false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  formError.value = '';
  
  try {
    const refreshResult = await authStore.refreshSession();
    if (!refreshResult) {
      await authStore.checkSession();
    }
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    // アイキャッチ画像のアップロード処理をEyecatchUploaderに委譲
    if (eyecatchUploaderRef.value && eyecatchUploaderRef.value.imageFile) {
      const coverImagePath = await eyecatchUploaderRef.value.uploadImage(userId);
      if (coverImagePath) {
        formData.cover_image_path = coverImagePath;
      }
    }
    
    const uploadedImageMap = new Map<string, string>();
    
    if (pendingImages.value.length > 0) {
      const uploadPromises = pendingImages.value.map(async (img) => {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExt}`;
        const filePath = fileName;
        
        const { error } = await supabase.storage
          .from('post_images')
          .upload(filePath, img.file);
        
        if (error) throw error;
        
        uploadedImageMap.set(img.id, filePath);
        return { path: filePath, userId };
      });
      
      uploadedImages.value = await Promise.all(uploadPromises);
    }
    
    let finalContent = formData.content;
    if (typeof finalContent === 'string' && uploadedImageMap.size > 0) {
      for (const [tempId, filePath] of uploadedImageMap.entries()) {
        const publicUrl = supabase.storage
          .from('post_images')
          .getPublicUrl(filePath).data.publicUrl;
        
        const regex = new RegExp(`<img[^>]*data-temp-id="${tempId}"[^>]*>`, 'g');
        finalContent = finalContent.replace(regex, `<img src="${publicUrl}">`);
      }
    }
    
    if (props.id) {
      await updatePost({...formData, content: finalContent});
      // 保存成功時に編集用データを削除
      localStorage.removeItem(`temp_edit_post_data_${props.id}`);
      router.push(`/posts/${props.id}`);
    } else {
      const newPost = await createPost({...formData, content: finalContent});
      // 保存成功時に新規作成用データを削除
      localStorage.removeItem('temp_new_post_data');
      router.push(`/posts/${newPost.id}`);
    }
    
  } catch (err: any) {
    console.error('投稿保存エラー:', err);
    formError.value = err.message || '投稿の保存に失敗しました';
  } finally {
    submitting.value = false;
  }
}

async function createPost(postData: any) {
  try {
    await authStore.refreshSession();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    let contentValue = postData.content;
    
    if (typeof contentValue === 'string') {
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }
    
    const { data: newPost, error: insertError } = await supabase
      .from('posts')
      .insert({
        title: postData.title,
        content: contentValue,
        excerpt: postData.excerpt || null,
        cover_image_path: postData.cover_image_path,
        published: postData.published,
        published_at: postData.published ? new Date().toISOString() : null,
        author_id: userId
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('投稿挿入エラー詳細:', insertError);
      throw insertError;
    }
    
    if (uploadedImages.value.length > 0) {
      const postImagesData = uploadedImages.value.map((img) => ({
        post_id: newPost.id,
        image_path: img.path,
        author_id: img.userId
      }));
      
      const { error: imagesError } = await supabase
        .from('post_images')
        .insert(postImagesData);
      
      if (imagesError) {
        console.error('画像データの関連付けエラー:', imagesError);
      }
    }
    
    // カテゴリの保存をCategorySelectorコンポーネントに委譲
    if (categorySelectorRef.value) {
      await categorySelectorRef.value.savePostWithNewCategories(newPost.id);
    }
    
    return newPost;
  } catch (err) {
    console.error('投稿作成エラー:', err);
    throw new Error('投稿の作成に失敗しました');
  }
}

async function updatePost(postData: any) {
  try {
    await authStore.refreshSession();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error('認証セッションの取得に失敗しました。再ログインしてください。');
    }
    
    if (!session) {
      throw new Error('認証セッションが見つかりません。再ログインしてください。');
    }
    
    const userId = session.user.id;
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('プロフィールエラー:', profileError);
      throw new Error('ユーザープロフィールが見つかりません。プロフィールを作成してください。');
    }
    
    let contentValue = postData.content;
    
    if (typeof contentValue === 'string') {
      try {
        if (contentValue.trim().startsWith('{') && contentValue.trim().endsWith('}')) {
          contentValue = JSON.parse(contentValue);
        }
      } catch (e) {
        console.log('ContentはHTML形式として処理します');
      }
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: postData.title,
        excerpt: postData.excerpt,
        content: contentValue,
        cover_image_path: postData.cover_image_path,
        published: postData.published,
        published_at: postData.published ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
        last_edited_by: userId
      })
      .eq('id', props.id)
      .eq('author_id', userId);
    
    if (updateError) throw updateError;
    
    if (uploadedImages.value.length > 0) {
      const postImagesData = uploadedImages.value.map((img) => ({
        post_id: props.id,
        image_path: img.path,
        author_id: img.userId
      }));
      
      const { error: imagesError } = await supabase
        .from('post_images')
        .insert(postImagesData);
      
      if (imagesError) {
        console.error('画像データの関連付けエラー:', imagesError);
      }
    }
    
    // カテゴリの保存をCategorySelectorコンポーネントに委譲
    if (categorySelectorRef.value && props.id) {
      await categorySelectorRef.value.savePostWithNewCategories(props.id);
    }
  } catch (err) {
    console.error('投稿更新エラー:', err);
    throw new Error('投稿の更新に失敗しました');
  }
}

function handleLoginRedirect() {
  saveToLocalStorage();
  router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
}

// キャンセル処理を修正
function handleCancel() {
  // キャンセル時に自動保存データを削除
  if (props.id) {
    localStorage.removeItem(`temp_edit_post_data_${props.id}`);
  } else {
    localStorage.removeItem('temp_new_post_data');
  }
  router.push('/');
}

// 期限切れデータのチェックと削除
function checkExpiredData() {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  
  // LocalStorageのすべてのキーを確認
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    if (key && (key === 'temp_new_post_data' || key.startsWith('temp_edit_post_data_'))) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '');
        
        // 24時間を超えたデータは削除
        if (data.timestamp && (now - data.timestamp > oneDayInMs)) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // 不正なJSONの場合も削除
        localStorage.removeItem(key);
      }
    }
  }
}

// 保存データのチェックと復元確認
async function checkForSavedData() {
  const hasData = await restoreFromLocalStorage();
  if (hasData) {
    // 通知またはトースト表示で復元を通知
    // ここではUI実装は省略
  }
}
</script> 