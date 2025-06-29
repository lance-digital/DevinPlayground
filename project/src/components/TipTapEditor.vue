<template>
  <div class="border border-border rounded-md bg-surface-variant">
    <div class="border-b border-border p-2 flex gap-2 flex-wrap">
      <button
        type="button"
        @click="() => editor?.chain().focus().toggleBold().run()"
        :class="{ 'bg-primary text-white': editor?.isActive('bold') }"
        class="px-3 py-1 bg-surface hover:bg-surface-variant rounded text-sm"
      >
        太字
      </button>
      <button
        type="button"
        @click="() => editor?.chain().focus().toggleItalic().run()"
        :class="{ 'bg-primary text-white': editor?.isActive('italic') }"
        class="px-3 py-1 bg-surface hover:bg-surface-variant rounded text-sm"
      >
        斜体
      </button>
      <button
        type="button"
        @click="() => editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-primary text-white': editor?.isActive('heading', { level: 2 }) }"
        class="px-3 py-1 bg-surface hover:bg-surface-variant rounded text-sm"
      >
        見出し
      </button>
      <button
        type="button"
        @click="() => editor?.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-primary text-white': editor?.isActive('bulletList') }"
        class="px-3 py-1 bg-surface hover:bg-surface-variant rounded text-sm"
      >
        リスト
      </button>
      <input
        type="file"
        accept="image/*"
        @change="handleImageUpload"
        ref="imageInput"
        class="hidden"
      />
      <button
        type="button"
        @click="() => $refs.imageInput?.click()"
        class="px-3 py-1 bg-surface hover:bg-surface-variant rounded text-sm"
      >
        画像
      </button>
    </div>
    <div :data-testid="testId">
      <editor-content :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import { useTipTap } from '@/composables/useTipTap'

interface Props {
  modelValue?: any
  testId?: string
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  testId: 'tiptap-editor'
})

const emit = defineEmits<Emits>()

const { editor, initEditor, addImage, getContent, setContent, destroy } = useTipTap(props.modelValue)

const imageInput = ref<HTMLInputElement>()

onMounted(() => {
  initEditor()
  
  if (editor.value) {
    editor.value.on('update', () => {
      emit('update:modelValue', getContent())
    })
  }
})

onBeforeUnmount(() => {
  destroy()
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== getContent()) {
    setContent(newValue)
  }
})

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    await addImage(file)
    target.value = ''
  }
}
</script>

<style>
.ProseMirror {
  outline: none;
  padding: 1rem;
  min-height: 200px;
  color: rgb(var(--color-text));
  background-color: rgb(var(--color-surface-variant));
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: rgb(var(--color-heading));
}

.ProseMirror ul {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror li {
  margin: 0.25rem 0;
  color: rgb(var(--color-text));
}

.ProseMirror p {
  margin: 0.5rem 0;
  color: rgb(var(--color-text));
}

.ProseMirror a {
  color: rgb(var(--color-primary));
  text-decoration: underline;
}

.ProseMirror a:hover {
  color: rgb(var(--color-primary-light));
}
</style>
