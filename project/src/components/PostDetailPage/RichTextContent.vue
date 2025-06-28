<template>
  <div class="rich-text-container">
    <!-- 操作ボタングループを削除 -->
    
    <div 
      ref="contentRef"
      :class="['rich-text-content prose max-w-none leading-[1.75] text-text dark:prose-invert prose-headings:text-heading prose-a:text-primary prose-a:no-underline prose-blockquote:my-4 prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:border-primary prose-blockquote:text-text-muted prose-pre:my-4 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:bg-surface-variant prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:rounded prose-code:font-mono prose-code:bg-surface-variant prose-ul:pl-6 prose-ul:list-disc prose-ol:pl-6 prose-ol:list-decimal prose-li:my-1 prose-img:rounded-lg prose-img:shadow-background/50 [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:border-b [&_h2]:border-border-light hover:prose-a:text-primary-dark hover:prose-a:underline', fontSizeClass]"
      v-html="content"
    ></div>
    
    <!-- 共有リンクのモーダルを削除 -->
    
    <!-- コピー完了通知を削除 -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DOMPurify from 'dompurify';

const props = defineProps({
  content: {
    type: [String, Object],  // 文字列とオブジェクト両方を受け入れる
    default: ''
  }
});

// フォントサイズはデフォルト値を設定
const fontSizeClass = computed(() => 'text-base');

// コンテンツ参照（他の機能で使用されている可能性があるため残す）
const contentRef = ref<HTMLElement | null>(null);

// コンテンツ処理を改善：JSONBオブジェクトの構造をより適切に処理する
const sanitizedContent = computed(() => {
  if (!props.content) return '';
  
  // コンテンツがJSONBオブジェクトの場合
  if (typeof props.content === 'object') {
    try {
      // スキーマのpostsテーブルからJSONB形式のコンテンツを処理
      if (props.content.type === 'doc' && props.content.content) {
        // ProseMirror/Tiptap形式の処理
        return DOMPurify.sanitize(renderTiptapContent(props.content));
      } else if (props.content.html) {
        // html形式をそのまま利用
        return DOMPurify.sanitize(props.content.html, {
          ADD_ATTR: ['target'],
          ADD_TAGS: ['iframe'],
          ALLOWED_ATTR: ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
        });
      } else if (props.content.text) {
        // テキスト形式
        return DOMPurify.sanitize(props.content.text);
      }
      
      // その他の形式：JSON文字列として表示
      return DOMPurify.sanitize(JSON.stringify(props.content));
    } catch (e) {
      console.error('コンテンツ処理エラー:', e);
      return '';
    }
  }
  
  // 文字列の場合は直接サニタイズ
  return DOMPurify.sanitize(props.content, {
    ADD_ATTR: ['target'],
    ADD_TAGS: ['iframe'],
    ALLOWED_ATTR: ['src', 'allowfullscreen', 'frameborder', 'width', 'height']
  });
});

// TiptapコンテンツをHTML文字列に変換する補助関数
function renderTiptapContent(doc: any): string {
  try {
    let html = '';
    
    if (Array.isArray(doc.content)) {
      doc.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
          html += '<p class="my-4">';
          if (Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                let text = textNode.text || '';
                if (textNode.marks) {
                  textNode.marks.forEach((mark: any) => {
                    if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                    if (mark.type === 'italic') text = `<em>${text}</em>`;
                    if (mark.type === 'code') text = `<code>${text}</code>`;
                    if (mark.type === 'link' && mark.attrs?.href) {
                      text = `<a href="${mark.attrs.href}" target="_blank" rel="noopener noreferrer" class="text-primary transition-all hover:text-primary-dark hover:underline">${text}</a>`;
                    }
                  });
                }
                html += text;
              }
            });
          }
          html += '</p>';
        } else if (node.type === 'heading') {
          const level = node.attrs?.level || 1;
          const headingClasses = level === 1 ? 'mt-6 mb-4 text-2xl font-bold text-heading' : 
                                level === 2 ? 'mt-6 mb-3 pb-2 border-b border-border-light text-xl font-semibold text-heading' : 
                                'mt-5 mb-2 text-lg font-semibold text-heading';
          
          html += `<h${level} class="${headingClasses}">`;
          if (node.content) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') html += textNode.text || '';
            });
          }
          html += `</h${level}>`;
        } else if (node.type === 'blockquote') {
          html += '<blockquote class="my-4 border-l-4 pl-4 italic border-primary text-text-muted">';
          if (Array.isArray(node.content)) {
            node.content.forEach((contentNode: any) => {
              if (contentNode.type === 'paragraph' && contentNode.content) {
                html += '<p>';
                contentNode.content.forEach((textNode: any) => {
                  if (textNode.type === 'text') html += textNode.text || '';
                });
                html += '</p>';
              }
            });
          }
          html += '</blockquote>';
        } else if (node.type === 'codeBlock') {
          const language = node.attrs?.language || '';
          html += `<pre class="my-4 p-4 rounded-lg overflow-x-auto bg-surface-variant">`;
          html += `<code class="language-${language}">${node.content?.[0]?.text || ''}</code>`;
          html += `</pre>`;
        } else if (node.type === 'bulletList') {
          html += '<ul class="my-4 pl-6 list-disc">';
          if (Array.isArray(node.content)) {
            node.content.forEach((listItem: any) => {
              if (listItem.type === 'listItem' && listItem.content) {
                html += '<li class="my-1">';
                listItem.content.forEach((contentNode: any) => {
                  if (contentNode.type === 'paragraph' && contentNode.content) {
                    contentNode.content.forEach((textNode: any) => {
                      if (textNode.type === 'text') html += textNode.text || '';
                    });
                  }
                });
                html += '</li>';
              }
            });
          }
          html += '</ul>';
        } else if (node.type === 'orderedList') {
          html += '<ol class="my-4 pl-6 list-decimal">';
          if (Array.isArray(node.content)) {
            node.content.forEach((listItem: any) => {
              if (listItem.type === 'listItem' && listItem.content) {
                html += '<li class="my-1">';
                listItem.content.forEach((contentNode: any) => {
                  if (contentNode.type === 'paragraph' && contentNode.content) {
                    contentNode.content.forEach((textNode: any) => {
                      if (textNode.type === 'text') html += textNode.text || '';
                    });
                  }
                });
                html += '</li>';
              }
            });
          }
          html += '</ol>';
        } else if (node.type === 'image' && node.attrs?.src) {
          const src = node.attrs.src;
          const alt = node.attrs.alt || '';
          html += `<img src="${src}" alt="${alt}" class="my-4 rounded-lg shadow-background/50" />`;
        } else if (node.type === 'horizontalRule') {
          html += '<hr class="my-6 border-border-light" />';
        }
      });
    }
    
    return html;
  } catch (e) {
    console.error('Tiptapコンテンツレンダリングエラー:', e);
    return '';
  }
}

// コンテンツを表示
const content = computed(() => sanitizedContent.value);
</script>

<style>
/* リストマーカーの色をテキスト色に合わせる */
.rich-text-content ul li::marker,
.rich-text-content ol li::marker {
  color: rgb(var(--color-text));
}

/* エディタコンポーネントのスタイルを移植 */
.rich-text-content {
  & h2 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: rgb(var(--color-heading));
    border-bottom: 1px solid rgb(var(--color-border-light));
    padding-bottom: 0.5rem;
  }
  
  & h3 {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: bold;
    color: rgb(var(--color-heading));
  }
  
  & p {
    margin-bottom: 0.75rem;
    color: rgb(var(--color-text));
  }
  
  & ul {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    list-style-type: disc;
    
    & li::marker {
      color: rgb(var(--color-text));
    }
  }
  
  & ol {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
    list-style-type: decimal;
    
    & li::marker {
      color: rgb(var(--color-text));
    }
  }
  
  & blockquote {
    margin-top: 1rem;
    margin-bottom: 1rem;
    padding-left: 1rem;
    border-left: 3px solid rgb(var(--color-border-light));
    color: rgb(var(--color-text-muted));
  }
  
  & hr {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
    border: 0;
    border-top: 2px solid rgb(var(--color-border-light));
  }
  
  & img {
    max-width: 100%;
    height: auto;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 0.25rem;
  }
  
  & a {
    color: rgb(var(--color-primary));
    text-decoration: underline;
  }
}

@media print {
  .rich-text-container > div:first-child,
  .fixed {
    display: none !important;
  }
}
</style> 