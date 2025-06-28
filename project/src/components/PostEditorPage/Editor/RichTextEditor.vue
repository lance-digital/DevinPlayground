<!-- リッチテキストエディタのメインコンポーネント -->
<template>
  <div class="rich-text-editor">
    <!-- 通常のツールバー（キーボードが非表示時に表示） -->
    <div 
      v-if="!isKeyboardVisible"
      ref="normalToolbar"
      class="glass-card flex flex-wrap mb-2 gap-1 p-2"
    >
      <EditorToolbar 
        ref="normalToolbarRef"
        :editor="editor" 
        :uploading="uploading" 
        :is-focused="isFocused"
        :toolbar-element="normalToolbar"
        @open-link-dialog="showLinkModalDialog" 
        @open-file-dialog="openFileDialog"
        @keyboard-visibility-changed="handleKeyboardVisibilityChange"
      />
    </div>
    
    <!-- エディタのメインコンテンツエリア -->
    <div 
      class="glass-card p-4"
      :class="{ 'ring-2 ring-primary ring-opacity-50': isFocused }"
    >
      <EditorContent 
        :editor="editor" 
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter.prevent="handleEnterKey"
        class="prose-editor-content"
      />
    </div>
    
    <!-- 画像アップロード用の非表示input -->
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      class="hidden absolute w-px h-px opacity-0" 
      @change="uploadImage"
    />
  </div>
  
  <!-- モバイルキーボード表示時のフローティングツールバー -->
  <Teleport to="body" v-if="isKeyboardVisible && (isFocused || showLinkMenu)">
    <div 
      ref="floatingToolbar"
      class="editor-toolbar glass-card fixed bottom-0 left-0 right-0 z-100 flex flex-wrap w-full gap-1 p-2"
    >
      <EditorToolbar 
        ref="floatingToolbarRef"
        :editor="editor" 
        :uploading="uploading" 
        :is-floating="true"
        :is-focused="isFocused"
        :toolbar-element="floatingToolbar"
        @open-link-dialog="showLinkModalDialog" 
        @open-file-dialog="openFileDialog"
        @keyboard-visibility-changed="handleKeyboardVisibilityChange"
      />
    </div>
  </Teleport>

  <!-- リンク編集用のポップアップメニュー -->
  <Teleport to="body">
    <EditorLinkMenu
      v-if="editor"
      ref="linkMenuRef"
      :editor="editor"
      :visible="showLinkMenu"
      :position="linkMenuPosition"
      :is-keyboard-visible="isKeyboardVisible"
      :selected-text="selectedText"
      :initial-url="linkUrl"
      :initial-text="linkText"
      @close="handleLinkMenuClose"
      @apply="handleLinkApplied"
      @open="handleLinkMenuOpen"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, nextTick } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { v4 as uuidv4 } from 'uuid';
import EditorToolbar from './EditorToolbar.vue';
import EditorLinkMenu from './EditorLinkMenu.vue';
import { useImageUpload } from '../../../composables/useImageUpload';
import { useImageCleanup } from '../../../composables/useImageCleanup';

// リファレンス変数の定義
const fileInput = ref<HTMLInputElement | null>(null); // 画像アップロード用input要素
const isFocused = ref(false); // エディタフォーカス状態
const isKeyboardVisible = ref(false); // モバイルキーボード表示状態
const previousContent = ref<string>(''); // 以前のコンテンツ（画像比較用）

// 画像アップロード用コンポーザブル
const { 
  isUploading: uploading,
  error: imageError,
  handleFileSelect,
  encodeToBase64 
} = useImageUpload('post_images', {
  maxWidth: 910,
  maxHeight: 1620,
  outputFormat: 'webp',
  quality: 0.85
});

// 画像クリーンアップ用コンポーザブル
const { cleanupUnusedImages, extractImagePathsFromContent } = useImageCleanup();

// ツールバー関連の参照
const normalToolbarRef = ref<InstanceType<typeof EditorToolbar> | null>(null);
const floatingToolbarRef = ref<InstanceType<typeof EditorToolbar> | null>(null);
const floatingToolbar = ref<HTMLElement | null>(null);
const normalToolbar = ref<HTMLElement | null>(null);

// リンクメニュー関連の状態
const showLinkMenu = ref(false);
const linkMenuPosition = ref({ x: 0, y: 0 });
const selectedText = ref('');
const linkUrl = ref('');
const linkText = ref('');
const linkMenuRef = ref<InstanceType<typeof EditorLinkMenu> | null>(null);

// 画像アップロード関連の状態
const pendingImages = ref<{file: File, id: string}[]>([]);

/**
 * キーボード表示状態変更ハンドラー
 * @param visible キーボードが表示されているか
 */
function handleKeyboardVisibilityChange(visible: boolean) {
  isKeyboardVisible.value = visible;
  
  if (visible && floatingToolbarRef.value) {
    nextTick(() => {
      floatingToolbarRef.value?.updateFloatingToolbarPosition();
    });
  }
}

// コンポーネントのプロパティ定義
const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  placeholder: {
    type: String,
    default: '内容を入力してください...'
  },
  uploadingExternalImages: {
    type: Boolean,
    default: false
  }
});

// イベント定義
const emit = defineEmits([
  'update:modelValue', 
  'pending-images-updated',
  'upload-status-changed'
]);

/**
 * カスタム画像拡張の定義
 * 一時IDを属性として追加して画像の追跡を可能にする
 */
const CustomImage = Image.extend({
  addAttributes() {
    const defaultAttrs = {
      src: {
        default: null
      },
      alt: {
        default: null
      },
      title: {
        default: null
      }
    };
    
    return {
      ...defaultAttrs,
      'data-temp-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-temp-id'),
        renderHTML: attributes => {
          if (!attributes['data-temp-id']) {
            return {};
          }
          return {
            'data-temp-id': attributes['data-temp-id'],
          };
        },
      },
    };
  },
});

/**
 * Tiptapエディタインスタンスの初期化
 */
const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      hardBreak: {
        keepMarks: true
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    CustomImage.configure({
      allowBase64: true,
      inline: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
      },
    }),
  ],
  editorProps: {
    handleKeyDown: (_, event) => {
      // Enterキーとカスタムキーボードショートカットのハンドリングはそのまま継続
      if (event.key === 'Enter' && isKeyboardVisible.value) {
        return false;
      }
      
      // ブラウザのデフォルトショートカットを無効化
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isAlt = event.altKey;
      
      // 2キー組み合わせのショートカットを無効化（編集用のショートカット）
      if ((isCtrlOrCmd && ['b', 'i', 'z', 'y', 'k'].includes(event.key.toLowerCase())) || 
          (isAlt && ['2', '3', '7', '8', 'q', 'h', 'i', 's'].includes(event.key.toLowerCase()))) {
        event.preventDefault();
        return true; // イベントを処理済みとしてマーク
      }
      
      // リンク関連のショートカット (Ctrl+K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        showLinkModalDialog();
        return true;
      }
      
      return false;
    }
  },
  // コンテンツ更新時のハンドラー
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    emit('update:modelValue', html);

    // 内容が変わっていない場合は何もしない
    if (html === previousContent.value) {
      return;
    }

    // 画像の削除/変更を検出して古い画像を削除
    handleImageChanges(previousContent.value, html);

    // 現在の内容を保存
    previousContent.value = html;
    
    // リンク選択状態の処理
    if (editor.isActive('link')) {
      const { state } = editor;
      const { from, to } = state.selection;
      
      if (from === to) {
        const node = state.doc.nodeAt(from);
        const isEmpty = node?.isText && node.text === '';
        
        const prevPos = Math.max(0, from - 1);
        const prevNode = state.doc.nodeAt(prevPos);
        const prevMarks = prevNode ? prevNode.marks.filter(mark => mark.type.name === 'link') : [];
        
        const nextPos = Math.min(state.doc.content.size, to + 1);
        const nextNode = state.doc.nodeAt(nextPos);
        const nextMarks = nextNode ? nextNode.marks.filter(mark => mark.type.name === 'link') : [];
        
        if (isEmpty || (prevMarks.length === 0 && nextMarks.length === 0)) {
          editor.chain().focus().unsetMark('link').run();
        }
      }
    }
  },
  onFocus: () => {
    isFocused.value = true;
  },
  onBlur: () => {
    isFocused.value = false;
  },
  enableInputRules: true,
  enablePasteRules: true
});

/**
 * コンテンツ内の画像変更を検出して古い画像を削除する
 */
async function handleImageChanges(oldContent: string, newContent: string) {
  try {
    // 削除すべき古い画像パスを検出
    const oldImagePaths = extractImagePathsFromContent(oldContent);
    const newImagePaths = extractImagePathsFromContent(newContent);

    // 変更がない場合は処理しない
    if (oldImagePaths.length === 0 || JSON.stringify(oldImagePaths) === JSON.stringify(newImagePaths)) {
      return;
    }

    // 古い画像を削除
    const result = await cleanupUnusedImages(oldContent, newContent);
    
    if (result.deletedPaths.length > 0) {
      console.log(`エディタ内容の変更により${result.deletedPaths.length}個の画像を削除しました:`, result.deletedPaths);
    }
  } catch (err) {
    console.error('画像クリーンアップエラー:', err);
  }
}

// props.modelValueの変更を監視して、エディタ内容を更新
watch(() => props.modelValue, (newValue) => {
  if (!editor.value || !newValue) return;
  
  const editorContent = editor.value.getHTML();
  if (typeof newValue === 'object') {
    const currentJson = editor.value.getJSON();
    if (JSON.stringify(currentJson) !== JSON.stringify(newValue)) {
      editor.value.commands.setContent(newValue);
      previousContent.value = editor.value.getHTML();
    }
  } else if (typeof newValue === 'string' && newValue !== editorContent) {
    editor.value.commands.setContent(newValue);
    previousContent.value = newValue;
  }
}, { deep: true });

// アップロード状態変更の監視
watch(() => uploading.value, (newValue) => {
  emit('upload-status-changed', newValue);
});

// エディタ初期化時に内容を保存
watch(() => editor.value, (newEditor) => {
  if (newEditor) {
    previousContent.value = newEditor.getHTML();
  }
}, { immediate: true });

// コンポーネント破棄時にエディタを破棄
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});

// コンポーネントマウント時の初期化
onMounted(() => {
  nextTick(() => {
    if (normalToolbarRef.value) {
      normalToolbarRef.value.updateToolbarPosition();
    }
  });
});

// ツールバー要素の監視
watch(() => [floatingToolbar.value, normalToolbar.value], () => {
  nextTick(() => {
    if (normalToolbarRef.value && normalToolbar.value) {
      normalToolbarRef.value.updateToolbarPosition();
    }
    if (floatingToolbarRef.value && floatingToolbar.value) {
      floatingToolbarRef.value.updateFloatingToolbarPosition();
    }
  });
});

/**
 * リンクメニューダイアログを表示
 */
function showLinkModalDialog() {
  if (!editor.value) return;
  
  if (linkMenuRef.value) {
    linkMenuRef.value.showLinkMenu();
  }
}

/**
 * リンクメニューが開かれた時のハンドラー
 */
function handleLinkMenuOpen(data: { 
  position: { x: number, y: number }, 
  initialUrl: string, 
  initialText: string, 
  selectedText: string 
}) {
  linkMenuPosition.value = data.position;
  linkUrl.value = data.initialUrl;
  linkText.value = data.initialText;
  selectedText.value = data.selectedText;
  
  showLinkMenu.value = true;
}

/**
 * リンク適用時のハンドラー
 */
function handleLinkApplied(data: { url: string, text: string }) {
  if (!editor.value) return;
  
  if (linkMenuRef.value) {
    linkMenuRef.value.handleApplyLink(data);
  }
  
  showLinkMenu.value = false;
  
  ensureEditorFocus();
}

/**
 * 画像アップロード処理
 */
async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0 || !editor.value) return;
  
  const file = input.files[0];
  
  // ファイルサイズなどのバリデーションはコンポーザブルで行われる
  const imageId = uuidv4();
  
  try {
    // コンポーザブルを使用して画像処理
    const success = await handleFileSelect(file);
    
    if (success) {
      // Base64画像を取得
      const base64Image = await encodeToBase64(file);
      
      // 画像をエディタに挿入
      if (editor.value && base64Image) {
        const imageOptions = {
          src: base64Image,
          'data-temp-id': imageId
        } as any;
        
        // 画像をエディタに挿入
        editor.value.chain().focus().setImage(imageOptions).run();
        
        // 保留中の画像として追加
        pendingImages.value.push({
          file: file,
          id: imageId
        });
        
        emit('pending-images-updated', pendingImages.value);
      }
    } else if (imageError.value) {
      alert(imageError.value);
    }
  } catch (error) {
    console.error('画像処理エラー:', error);
    alert('画像の処理に失敗しました');
  } finally {
    if (fileInput.value) fileInput.value.value = '';
  }
}

/**
 * ファイル選択ダイアログを開く
 */
function openFileDialog(e?: Event) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  setTimeout(() => {
    if (fileInput.value) {
      fileInput.value.click();
    } else {
      console.error('fileInput参照が見つかりません');
    }
  }, 10);
}

/**
 * 画像アップロード実行
 */
function uploadImage(event: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  handleImageUpload(event);
}

/**
 * Enterキーハンドラー
 */
function handleEnterKey(e: KeyboardEvent) {
  if (!editor.value) return;
  
  if (isKeyboardVisible.value) {
    e.preventDefault();
    editor.value.commands.enter();
    
    if (floatingToolbarRef.value) {
      floatingToolbarRef.value.forceToolbarUpdate();
    }
  }
}

/**
 * リンクメニュークローズハンドラー
 */
function handleLinkMenuClose() {
  showLinkMenu.value = false;
  
  ensureEditorFocus();
}

/**
 * エディタにフォーカスを戻す
 */
function ensureEditorFocus(delay = 20) {
  if (!editor.value) return;
  
  setTimeout(() => {
    try {
      if (editor.value) {
        editor.value.commands.focus();
      }
    } catch (error) {
      console.error('エディタフォーカスエラー:', error);
    }
  }, delay);
}

// 外部から呼び出し可能な関数を公開
defineExpose({
  // Base64に画像をエンコード
  encodeImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('画像のエンコードに失敗しました'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
  
  // 画像をエディタに挿入
  insertImage(imageUrl: string, tempId?: string) {
    if (!editor.value) return;
    
    const imageOptions: any = { src: imageUrl };
    if (tempId) {
      imageOptions['data-temp-id'] = tempId;
    }
    
    editor.value.chain().focus().setImage(imageOptions).run();
  },

  // エディタのコンテンツを設定
  setContent(content: string | object) {
    if (!editor.value) return;
    editor.value.commands.setContent(content);
    previousContent.value = editor.value.getHTML();
  },

  // エディタにフォーカスを確保
  ensureEditorFocus,
  
  // エディタ内の画像パスを取得
  getImagePaths() {
    if (!editor.value) return [];
    return extractImagePathsFromContent(editor.value.getHTML());
  }
});
</script>

<style scoped lang="postcss">
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: theme('colors.text-muted');
  pointer-events: none;
  height: 0;
}

.prose-editor-content {
  & :deep(.ProseMirror) {
    min-height: 250px;
    outline: none;
  }
  
  & :deep(.ProseMirror h2) {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: theme('colors.heading');
    border-bottom: 1px solid theme('colors.border-light');
    padding-bottom: 0.5rem;
  }
  
  & :deep(.ProseMirror h3) {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: bold;
    color: theme('colors.heading');
  }
  
  & :deep(.ProseMirror p) {
    margin-bottom: 0.75rem;
    color: theme('colors.text');
  }
  
  & :deep(.ProseMirror ul) {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    list-style-type: disc;
    
    & li::marker {
      color: theme('colors.text');
    }
  }
  
  & :deep(.ProseMirror ol) {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    list-style-type: decimal;
    
    & li::marker {
      color: theme('colors.text');
    }
  }
  
  & :deep(.ProseMirror blockquote) {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 1rem;
    border-left: 3px solid theme('colors.border-light');
    color: theme('colors.text-muted');
  }
  
  & :deep(.ProseMirror hr) {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    border: 0;
    border-top: 2px solid theme('colors.border-light');
  }
  
  & :deep(.ProseMirror img) {
    max-width: 100%;
    height: auto;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
  }
  
  & :deep(.ProseMirror a) {
    color: theme('colors.primary');
    text-decoration: underline;
  }
}

/* モバイルキーボード表示時のフローティングツールバー */
.editor-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100%;
  padding-bottom: env(safe-area-inset-bottom, 0);
  transition: none;
  box-shadow: 0 -2px 10px rgb(var(--color-background) / 0.15);
  backdrop-filter: blur(8px);
  touch-action: none;
}
</style>