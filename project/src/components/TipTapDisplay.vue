<template>
  <div class="prose prose-invert max-w-none">
    <editor-content :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

interface Props {
  content?: any
}

const props = defineProps<Props>()

const editor = ref<Editor | null>(null)

onMounted(() => {
  editor.value = new Editor({
    content: props.content || '',
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-400 hover:text-blue-300 underline',
        },
      }),
    ],
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none',
      },
    },
  })
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

watch(() => props.content, (newContent) => {
  if (editor.value && newContent !== editor.value.getJSON()) {
    editor.value.commands.setContent(newContent)
  }
})
</script>

<style>
.ProseMirror {
  outline: none;
  color: rgb(var(--color-text));
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
