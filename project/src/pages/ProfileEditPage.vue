<template>
  <div class="mx-auto max-w-3xl py-8">
    <div class="glass-card p-6">
      <h1 class="mb-6 text-2xl font-bold text-heading">プロフィール設定</h1>
      
      <!-- エラーメッセージ -->
      <div v-if="error" class="mb-6 rounded border border-error-dark bg-error/20 px-4 py-3 text-error">
        {{ error }}
      </div>
      
      <!-- 成功メッセージ -->
      <div v-if="successMessage" class="mb-6 rounded border border-success-dark bg-success/20 px-4 py-3 text-success">
        {{ successMessage }}
      </div>
      
      <form @submit.prevent="saveProfile" class="space-y-6">
        <!-- アバター -->
        <div>
          <label class="mb-2 block text-sm font-medium text-text">プロフィール画像</label>
          <div class="flex flex-col items-start space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
            <!-- アバター表示部分 -->
            <div class="flex flex-col items-center">
              <div class="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-light text-3xl text-text-white">
                <img 
                  v-if="avatarPreview" 
                  :src="avatarPreview" 
                  alt="アバタープレビュー" 
                  class="absolute inset-0 h-full w-full object-cover"
                />
                <span v-else-if="profileData.nickname">{{ getInitials(profileData.nickname) }}</span>
                <span v-else>U</span>
              </div>
              
              <!-- 削除ボタンを画像の下に配置 -->
              <button 
                v-if="avatarPreview" 
                type="button" 
                @click="handleRemoveAvatar"
                class="btn btn-outline-error btn-sm mt-2"
              >
                <PhTrash class="mr-1 h-4 w-4" />
                削除
              </button>
            </div>
            
            <!-- アップロードボタン -->
            <div class="flex flex-col">
              <label class="btn btn-outline-secondary cursor-pointer">
                <PhCloudArrowUp class="mr-2 h-5 w-5" />
                アップロード
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleAvatarUpload" 
                  ref="avatarInput"
                />
              </label>
            </div>
          </div>
        </div>
        
        <!-- 表示名 -->
        <div>
          <label for="nickname" class="mb-1 block text-sm font-medium text-text">表示名 <span class="text-error">*</span></label>
          <input 
            id="nickname" 
            v-model="profileData.nickname" 
            type="text" 
            required
            class="w-full rounded border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <!-- アカウントID -->
        <div>
          <label for="account_id" class="mb-1 block text-sm font-medium text-text">アカウントID</label>
          <div class="flex">
            <span class="inline-flex items-center rounded-l border border-r-0 border-border bg-surface-accent px-3 py-2 text-text">@</span>
            <input 
              id="account_id" 
              v-model="profileData.account_id" 
              type="text" 
              class="flex-1 rounded-r border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="account_id"
            />
          </div>
          <p class="mt-1 text-xs text-text-muted">
            半角英数字とアンダースコアのみ使用可能です
          </p>
        </div>
        
        <!-- 自己紹介 -->
        <div>
          <label for="bio" class="mb-1 block text-sm font-medium text-text">自己紹介</label>
          <textarea 
            id="bio" 
            v-model="profileData.bio" 
            class="w-full rounded border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            rows="4"
            placeholder="自己紹介を入力してください"
          ></textarea>
        </div>
        
        <!-- 送信ボタン -->
        <div>
          <button 
            type="submit" 
            class="btn btn-primary w-full"
            :disabled="submitting"
          >
            <div class="flex items-center">
              <PhSpinner v-if="submitting" class="mr-2 h-5 w-5 animate-spin" />
              {{ submitting ? '保存中...' : '保存する' }}
            </div>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import { useImageUpload } from '../composables/useImageUpload';
import { useRouter } from 'vue-router';
import { useNotification } from '../composables/useNotification';
import { 
  PhTrash, 
  PhCloudArrowUp, 
  PhSpinner
} from '@phosphor-icons/vue';

const authStore = useAuthStore();
const router = useRouter();
const { showNotification } = useNotification();

// プロフィールデータ
const profileData = ref({
  nickname: '',
  account_id: '',
  bio: '',
  avatar_data: '' as string | null,
});

// 画像アップロード用コンポーザブル
const { 
  preview: avatarPreview, 
  error: avatarError, 
  handleFileSelect, 
  uploadImage, 
  clearImage: removeAvatar,
  getImageUrl
} = useImageUpload('profile_images', {
  maxWidth: 160,
  maxHeight: 160,
  outputFormat: 'webp',
  quality: 0.85
});

// 新しい画像が選択されたかどうかを追跡
const newImageSelected = ref(false);

// 状態管理
const error = ref('');
const successMessage = ref('');
const submitting = ref(false);
const loading = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

// 初期データ取得
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    error.value = 'ログインが必要です';
    return;
  }
  
  await fetchProfileData();
});

// プロフィールデータの取得
async function fetchProfileData() {
  loading.value = true;
  error.value = '';
  
  try {
    if (!authStore.user) throw new Error('ユーザー情報がありません');
    
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (data) {
      profileData.value = {
        nickname: data.nickname || '',
        account_id: data.account_id || '',
        bio: data.bio || '',
        avatar_data: data.avatar_data,
      };
      
      // アバター画像を表示
      if (data.avatar_data) {
        await processExistingAvatar(data.avatar_data);
      }
    }
  } catch (err: any) {
    console.error('プロフィール取得エラー:', err);
    error.value = 'プロフィールの読み込みに失敗しました';
  } finally {
    loading.value = false;
  }
}

// 既存のアバター画像を処理
async function processExistingAvatar(avatarPath: string) {
  if (!avatarPath) return;
  
  // 既存の画像URLを直接使用
  avatarPreview.value = getImageUrl(avatarPath);
  // 既存画像を読み込んだ場合は新規選択フラグをリセット
  newImageSelected.value = false;
}

// アバター画像のアップロード処理
async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) {
    return;
  }
  
  const file = input.files[0];
  
  if (avatarError.value) {
    error.value = avatarError.value;
    return;
  }
  
  // 画像処理とプレビュー表示
  await handleFileSelect(file);
  
  // 新しい画像が選択されたことを記録
  newImageSelected.value = true;
  
  // ファイル選択をリセット
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
}

// アバター画像を削除
function handleRemoveAvatar() {
  removeAvatar();
  newImageSelected.value = true; // 削除も変更としてマーク
  profileData.value.avatar_data = null; // 既存の画像パスをクリア
}

// プロフィール保存
async function saveProfile() {
  submitting.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    if (!authStore.user) throw new Error('ユーザー情報がありません');
    
    // アバターのアップロード処理
    let avatarUrl = profileData.value.avatar_data;
    
    // 新しい画像が選択された場合はアップロード
    if (newImageSelected.value && avatarPreview.value) {
      const result = await uploadImage(authStore.user.id);
      if (result) {
        avatarUrl = result.path;
      }
    } else if (newImageSelected.value && !avatarPreview.value) {
      // 画像を削除した場合
      avatarUrl = null;
    }
    
    // プロフィールを更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        nickname: profileData.value.nickname,
        account_id: profileData.value.account_id,
        bio: profileData.value.bio,
        avatar_data: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.user.id);
    
    if (updateError) throw updateError;
    
    // プロフィールデータをストアに反映
    await authStore.fetchUserProfile();
    
    // 古いアバター画像があれば削除（新しい画像がアップロードされた場合）
    if (avatarUrl && avatarUrl !== profileData.value.avatar_data) {
      if (profileData.value.avatar_data) {
        await supabase.storage
          .from('profile_images')
          .remove([profileData.value.avatar_data]);
      }
      
      // 状態を更新
      profileData.value.avatar_data = avatarUrl;
    }
    
    // 成功通知を表示
    showNotification('success', 'プロフィール更新', 'プロフィール情報が正常に更新されました');
    
    // プロフィール画面に遷移
    router.push({
      name: 'profile',
      params: { id: authStore.user.id }
    });
    
  } catch (err: any) {
    console.error('プロフィール更新エラー:', err);
    error.value = `プロフィールの更新に失敗しました: ${err.message || '不明なエラー'}`;
  } finally {
    submitting.value = false;
  }
}

// ヘルパー関数
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}
</script>