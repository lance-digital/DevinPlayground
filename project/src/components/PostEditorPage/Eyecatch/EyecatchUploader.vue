<template>
  <div>
    <label class="block mb-1 text-sm font-medium text-text-muted">アイキャッチ画像</label>
    <div class="flex items-center space-x-4">
      <div v-if="modelValue || preview" class="relative w-32 h-24 overflow-hidden rounded bg-surface-variant">
        <img 
          :src="preview || getImageUrl(modelValue as string)" 
          alt="プレビュー" 
          class="w-full h-full object-cover"
        />
        <button 
          type="button"
          @click="clearImageData" 
          class="absolute top-1 right-1 btn-icon-error btn-icon-sm"
        >
          <PhX class="w-4 h-4" />
        </button>
      </div>
      
      <div>
        <label 
          tabindex="0" 
          @keydown.enter="featuredImageInput?.click()"
          class="inline-flex items-center cursor-pointer whitespace-nowrap btn btn-outline-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <PhImage class="w-5 h-5 mr-2" />
          <span>画像をアップロード</span>
          <input
            type="file"
            accept="image/*"
            class="hidden absolute w-px h-px opacity-0"
            @change="handleImageUpload"
            ref="featuredImageInput"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { PhX, PhImage } from '@phosphor-icons/vue';
import { useImageUpload } from '../../../composables/useImageUpload';
import { useImageCleanup } from '../../../composables/useImageCleanup';

const props = defineProps({
  modelValue: {
    type: String as () => string | null,
    default: null
  },
  richTextEditorRef: {
    type: Object as () => Record<string, any> | null,
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue', 
  'file-selected', 
  'upload-success', 
  'upload-error',
  'upload-started',
  'upload-finished'
]);

const featuredImageInput = ref<HTMLInputElement | null>(null);
const previousImagePath = ref<string | null>(null);

// 画像アップロード用コンポーザブル
const {
  preview,
  originalFile: imageFile,
  error,
  uploadImage,
  handleFileSelect,
  clearImage,
  getImageUrl,
  encodeToBase64
} = useImageUpload('cover_images', {
  maxWidth: 320,
  maxHeight: 200,
  outputFormat: 'webp',
  quality: 0.85
});

// 画像クリーンアップコンポーザブル
const { cleanupUnusedImages } = useImageCleanup();

// Base64形式のデータを保持する変数
const fileDataBase64 = ref<string | null>(null);

// modelValueを監視して、変更があれば古いパスを保存
watch(() => props.modelValue, (newVal, oldVal) => {
  // 値が変更され、かつ古い値が存在する場合のみ保存
  if (newVal !== oldVal && oldVal) {
    console.log('アイキャッチ画像のパスを保存:', oldVal);
    previousImagePath.value = oldVal;
  }
}, { immediate: true });

// ファイル選択ハンドラーを拡張してBase64データを設定
async function handleImageUpload(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) return;
  
  try {
    const file = input.files[0];
    
    // 上書き前に現在のパスを保存
    if (props.modelValue) {
      previousImagePath.value = props.modelValue;
    }
    
    // コンポーザブルを使って画像を処理
    const success = await handleFileSelect(file);
    
    if (success && imageFile.value) {
      // Base64データを取得してセット
      fileDataBase64.value = await encodeToBase64(imageFile.value);
      emit('file-selected', file);
    } else if (error.value) {
      emit('upload-error', error.value);
      alert(error.value);
    }
  } catch (error: any) {
    console.error('画像処理エラー:', error);
    alert(error.message || '画像の処理に失敗しました');
  } finally {
    const input = event.target as HTMLInputElement;
    if (input) input.value = '';
  }
}

// アイキャッチ画像をアップロードする関数
async function uploadImageToStorage(userId: string): Promise<string | null> {
  if (!imageFile.value) return null;
  
  emit('upload-started');
  
  try {
    if (!userId) {
      throw new Error('ユーザーIDが必要です');
    }
    
    // アップロード前に現在の値を確保（modelValueが変わる可能性があるため）
    const currentPath = props.modelValue;
    
    // 画像アップロード
    const result = await uploadImage(userId);
    
    if (result) {
      // 古い画像を削除
      if (currentPath && currentPath !== result.path) {
        try {
          // パスを正規化
          let normalizedPath = currentPath;
          if (!normalizedPath.startsWith('cover_images/') && normalizedPath.includes('cover_images/')) {
            normalizedPath = 'cover_images/' + normalizedPath.split('cover_images/')[1];
          }
          
          console.log('アップロード時に削除する古い画像:', normalizedPath);
          await cleanupUnusedImages('', '', normalizedPath, result.path);
          console.log('古いアイキャッチ画像を削除しました:', currentPath);
        } catch (cleanupError) {
          console.error('古い画像の削除に失敗しました:', cleanupError);
        }
      }
      
      // スキーマのcover_image_pathフォーマットに合わせる
      emit('update:modelValue', result.path);
      emit('upload-success', result.path);
      
      // 新しい画像パスを保存
      previousImagePath.value = result.path;
      
      return result.path;
    }
    
    if (error.value) {
      emit('upload-error', error.value);
    }
    
    return null;
  } catch (e: any) {
    console.error('画像アップロードエラー:', e);
    emit('upload-error', e.message || '画像のアップロードに失敗しました');
    return null;
  } finally {
    emit('upload-finished');
  }
}

// 既存のパスから画像を設定
async function setExistingImage(path: string) {
  if (!path) return;
  preview.value = getImageUrl(path);
  previousImagePath.value = path;
}

function clearImageData() {
  const oldPath = props.modelValue;
  
  clearImage();
  emit('update:modelValue', null);
  emit('file-selected', null);
  
  // modelValueがnullになった場合、古い画像を削除
  if (oldPath) {
    console.log('削除対象のアイキャッチ画像パス:', oldPath);
    
    // パスを正規化して確実に削除されるようにする
    let normalizedPath = oldPath;
    if (!normalizedPath.startsWith('cover_images/') && normalizedPath.includes('cover_images/')) {
      normalizedPath = 'cover_images/' + normalizedPath.split('cover_images/')[1];
    }
    
    cleanupUnusedImages('', '', normalizedPath, null)
      .then(result => {
        if (result.success) {
          console.log('アイキャッチ画像を削除しました:', result.deletedPaths);
        } else {
          console.error('アイキャッチ画像の削除に失敗しました:', result.error);
        }
      })
      .catch(err => {
        console.error('画像削除エラー:', err);
      });
  }
}

// コンポーネントのマウント時に既存の画像パスがある場合は表示
if (props.modelValue) {
  setExistingImage(props.modelValue);
}

// Base64形式のデータからファイルを復元するメソッド
async function restoreFileFromBase64(base64Data: string, fileName: string, fileType: string): Promise<boolean> {
  try {
    // Base64文字列をBlobに変換
    const byteString = atob(base64Data.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: fileType });
    const file = new File([blob], fileName, { type: fileType });
    
    // 画像処理を実行
    const success = await handleFileSelect(file);
    if (success) {
      fileDataBase64.value = base64Data;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('ファイル復元エラー:', error);
    return false;
  }
}

defineExpose({
  featuredImageInput,
  uploadImage: uploadImageToStorage,
  imageFile,
  preview,
  fileDataBase64,
  setPreview(previewData: string | null) {
    preview.value = previewData;
  },
  clearImage: clearImageData,
  setExistingImage,
  restoreFileFromBase64
});
</script> 