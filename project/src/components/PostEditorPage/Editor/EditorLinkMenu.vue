<!-- リンク編集用のフローティングメニューコンポーネント -->
<template>
  <div 
    v-if="visible" 
    ref="linkMenu"
    class="floating-link-menu fixed z-30 rounded p-3 glass-card shadow-lg"
    :style="menuStyle"
  >
    <div class="flex flex-col gap-2">
      <!-- URLの入力フィールド -->
      <div class="flex items-center">
        <input 
          ref="linkInput"
          v-model="url"
          type="text"
          placeholder="URLを入力"
          class="flex-1 rounded border border-border px-2 py-1 bg-surface text-sm text-text"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="cancel"
        />
      </div>
      
      <!-- リンクテキストの入力フィールド -->
      <div class="flex items-center">
        <input 
          ref="linkTextInput"
          v-model="text"
          type="text"
          placeholder="リンクテキストを入力（省略可）"
          class="flex-1 rounded border border-border px-2 py-1 bg-surface text-sm text-text"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="cancel"
        />
      </div>
    </div>
    <!-- アクションボタン -->
    <div class="flex justify-end mt-3 space-x-2">
      <button 
        @click.stop.prevent="cancel"
        class="btn btn-secondary btn-sm"
      >
        キャンセル
      </button>
      <button 
        @click.stop.prevent="applyLink"
        class="btn btn-primary btn-sm"
        :disabled="!url"
      >
        適用
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch, onBeforeUnmount } from 'vue';
import type { Editor } from '@tiptap/vue-3';

// コンポーネントのプロパティ定義
const props = defineProps({
  editor: {
    type: Object as () => Editor | null | undefined,
    default: undefined
  },
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object as () => { x: number, y: number },
    default: () => ({ x: 0, y: 0 })
  },
  isKeyboardVisible: {
    type: Boolean,
    default: false
  },
  selectedText: {
    type: String,
    default: ''
  },
  initialUrl: {
    type: String,
    default: ''
  },
  initialText: {
    type: String,
    default: ''
  }
});

// イベント定義
const emit = defineEmits(['close', 'apply', 'open']);

// メニューに関する状態
const linkMenu = ref<HTMLElement | null>(null);
const linkInput = ref<HTMLInputElement | null>(null);
const linkTextInput = ref<HTMLInputElement | null>(null);
const url = ref('');
const text = ref('');

// URLの正規表現パターン
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * メニューのスタイルを計算
 * キーボードが表示されているか否かで位置を調整
 */
const menuStyle = computed(() => {
  const { x, y } = props.position;
  
  if (props.isKeyboardVisible) {
    return {
      left: '50%',
      top: '40%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '90vw',
      width: '320px'
    };
  }
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    maxWidth: '320px',
    width: 'auto'
  };
});

/**
 * リンクの範囲を検出する
 * 指定された位置のノードがリンクマークを持っているか確認し、リンクの開始・終了位置を特定
 */
function findLinkRange(state: any, pos: number) {
  try {
    const linkType = state.schema.marks.link;
    if (!linkType) return null;
    
    const node = state.doc.nodeAt(pos);
    const prevNode = pos > 0 ? state.doc.nodeAt(pos - 1) : null;
    
    let linkMark = null;
    if (node && node.marks) {
      linkMark = node.marks.find((m: any) => m.type.name === 'link');
    }
    if (!linkMark && prevNode && prevNode.marks) {
      linkMark = prevNode.marks.find((m: any) => m.type.name === 'link');
      if (linkMark) pos = pos - 1;
    }
    
    if (!linkMark) return null;
    
    const href = linkMark.attrs.href;
    
    let start = pos;
    let end = pos;
    
    // リンク開始位置を検索
    let i = pos;
    while (i >= 0) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        i--;
        continue;
      }
      
      const hasLinkMark = nodeAtPos.marks.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        start = i;
        i--;
      } else {
        break;
      }
    }
    
    // リンク終了位置を検索
    i = pos;
    while (i < state.doc.content.size) {
      const nodeAtPos = state.doc.nodeAt(i);
      if (!nodeAtPos || !nodeAtPos.isText) {
        i++;
        continue;
      }
      
      const hasLinkMark = nodeAtPos.marks.some(
        (m: any) => m.type.name === 'link' && m.attrs.href === href
      );
      
      if (hasLinkMark) {
        end = i + 1;
        i++;
      } else {
        break;
      }
    }
    
    return {
      from: start,
      to: end
    };
  } catch (error) {
    console.error('リンク範囲検出エラー:', error);
    return null;
  }
}

/**
 * リンク追加後にカーソル位置を調整
 * リンク後ろにカーソルを移動させる
 */
function moveCaretAfterLink(pos: number) {
  if (!props.editor) return;
  
  try {
    props.editor
      .chain()
      .focus()
      .setTextSelection(pos)
      .insertContent(' ')
      .deleteRange({ from: pos, to: pos + 1 })
      .unsetMark('link')
      .run();
  } catch (error) {
    console.error('カーソル移動エラー:', error);
  }
}

/**
 * キーボードショートカットハンドラー
 * リンクメニュー表示時のショートカット処理
 */
function handleKeyboardShortcuts(event: KeyboardEvent) {
  if (!props.visible) return;
  
  // エスケープキーでメニューをキャンセル
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
    return;
  }
  
  // Enter キーでリンクを適用
  if (event.key === 'Enter') {
    event.preventDefault();
    applyLink();
    return;
  }
}

// コンポーネントマウント時の初期化
onMounted(() => {
  url.value = props.initialUrl;
  text.value = props.initialText || props.selectedText;
  
  nextTick(() => {
    if (linkInput.value) {
      linkInput.value.focus();
    }
  });
  
  // キーボードショートカットのイベントリスナーを設定
  window.addEventListener('keydown', handleKeyboardShortcuts);
});

// コンポーネント破棄時の後処理
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardShortcuts);
});

// 表示状態の変更を監視
watch(() => props.visible, (newValue) => {
  if (newValue) {
    url.value = props.initialUrl;
    text.value = props.initialText || props.selectedText;
    
    nextTick(() => {
      if (linkInput.value) {
        linkInput.value.focus();
      }
    });
  }
});

/**
 * リンクメニューを表示する
 * 現在の選択テキストやカーソル位置に基づいてリンクメニューを開く
 */
function showLinkMenu() {
  if (!props.editor) return;
  
  const { state, view } = props.editor;
  const { from, to } = state.selection;
  
  const selectedText = state.doc.textBetween(from, to);
  
  let linkUrl = '';
  let linkText = '';
  
  // 選択テキストがURLの場合、URLとして使用
  if (selectedText.match(urlRegex)) {
    linkUrl = selectedText;
  } else if (props.editor.isActive('link')) {
    // 既存リンクが選択されている場合
    const attrs = props.editor.getAttributes('link');
    linkUrl = attrs.href || '';
    
    if (from === to) {
      try {
        const linkRange = findLinkRange(state, from);
        if (linkRange) {
          linkText = state.doc.textBetween(linkRange.from, linkRange.to);
        } else {
          linkText = selectedText;
        }
      } catch (error) {
        console.error('リンクテキスト取得エラー:', error);
        linkText = selectedText;
      }
    } else {
      linkText = selectedText;
    }
  } else {
    linkText = selectedText;
  }
  
  // メニュー表示位置を計算
  const coords = view.coordsAtPos(from);
  
  let x = coords.right;
  let y = coords.bottom + 10;
  
  // キーボードが表示されている場合は画面中央に配置
  if (props.isKeyboardVisible) {
    x = window.innerWidth / 2;
    y = window.innerHeight * 0.4;
  } else {
    // 画面端に近い場合の位置調整
    if (x + 320 > window.innerWidth) {
      x = Math.max(10, coords.left - 320);
    }
    
    if (y + 150 > window.innerHeight) {
      y = coords.top - 150;
    }
  }
  
  emit('open', {
    position: { x, y },
    initialUrl: linkUrl,
    initialText: linkText,
    selectedText: selectedText
  });
}

/**
 * リンクを適用する
 * 入力されたURLとテキストを使ってリンクを作成
 */
function applyLink() {
  if (!props.editor || !url.value.trim()) {
    cancel();
    return;
  }
  
  try {
    // URLの形式を調整（http/httpsプレフィックスがなければ追加）
    let finalUrl = url.value.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    
    // URLの検証
    if (!finalUrl.match(urlRegex)) {
      throw new Error('無効なURLです');
    }
    
    const finalText = text.value.trim() || finalUrl;
    
    emit('apply', {
      url: finalUrl,
      text: finalText
    });
    
    cancel();
  } catch (error) {
    console.error('リンク適用エラー:', error);
    // エラー処理をここに追加
  }
}

/**
 * シンプルなリンクを挿入
 * 新規リンク作成のためのヘルパー関数
 */
function insertSimpleLink(url: string, text: string) {
  if (!props.editor) return;
  
  const { state } = props.editor;
  const { from, to } = state.selection;
  const hasSelection = from !== to;
  
  try {
    if (hasSelection) {
      // 選択範囲がある場合は選択テキストを置き換え
      props.editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent(text)
        .setTextSelection({ from, to: from + text.length })
        .setLink({ href: url })
        .run();
        
      moveCaretAfterLink(from + text.length);
    } else {
      // カーソル位置にリンクを挿入
      const currentPos = props.editor.state.selection.from;
      
      props.editor.chain().focus().insertContent({
        type: 'text',
        text: text,
        marks: [
          {
            type: 'link',
            attrs: { href: url }
          }
        ]
      }).run();
      
      moveCaretAfterLink(currentPos + text.length);
    }
  } catch (error) {
    console.error('リンク挿入エラー:', error);
  }
}

/**
 * リンク適用を処理
 * 既存リンクの編集または新規リンクの作成を行う
 */
function handleApplyLink(data: { url: string, text: string }) {
  if (!props.editor) return;
  
  const { url, text } = data;
  const { state } = props.editor;
  const { from } = state.selection;
  
  try {
    if (props.editor.isActive('link')) {
      // 既存リンクの編集
      const linkRange = findLinkRange(state, from);
      
      if (linkRange) {
        props.editor
          .chain()
          .focus()
          .setTextSelection({ from: linkRange.from, to: linkRange.to })
          .unsetMark('link')
          .deleteRange({ from: linkRange.from, to: linkRange.to })
          .insertContent(text)
          .setTextSelection({ from: linkRange.from, to: linkRange.from + text.length })
          .setLink({ href: url })
          .run();
        
        moveCaretAfterLink(linkRange.from + text.length);
      } else {
        insertSimpleLink(url, text);
      }
    } else {
      // 新規リンクの作成
      insertSimpleLink(url, text);
    }
  } catch (error) {
    console.error('リンク適用エラー:', error);
    try {
      // エラー発生時はシンプルな挿入にフォールバック
      insertSimpleLink(url, text);
    } catch (e) {
      console.error('フォールバック挿入エラー:', e);
    }
  }
}

/**
 * リンクメニューをキャンセル
 */
function cancel() {
  url.value = '';
  text.value = '';
  
  emit('close');
}

// 外部から呼び出し可能な関数を公開
defineExpose({
  showLinkMenu,
  handleApplyLink,
  insertSimpleLink,
  findLinkRange,
  moveCaretAfterLink
});
</script>

<style scoped lang="postcss">
/* フローティングリンクメニューのスタイル */
.floating-link-menu {
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 20px rgb(var(--color-background) / 0.15);
  backdrop-filter: blur(8px);
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

/* タッチ操作の最適化 */
input, button {
  touch-action: manipulation;
}

/* ボタンのトランジション */
.btn {
  transition: all 0.15s ease-in-out;
}

/* フォーカス時のスタイル */
input:focus {
  outline: 2px solid rgb(var(--color-primary-light));
  outline-offset: 1px;
}

/* 無効化されたボタンのスタイル */
button[disabled] {
  pointer-events: auto;
  opacity: 0.6;
}
</style>