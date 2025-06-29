import { ref, onBeforeUnmount } from 'vue'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useImageUpload } from './useImageUpload'
import { useAuth } from './useAuth'

export function useTipTap(initialContent?: string) {
  const editor = ref<Editor | null>(null)
  const { uploadInlineImage } = useImageUpload()
  const { user } = useAuth()

  const initEditor = () => {
    editor.value = new Editor({
      content: initialContent || '',
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
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-500 hover:text-blue-700 underline',
          },
        }),
      ],
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 border border-gray-300 rounded-lg',
        },
      },
    })
  }

  const addImage = async (file: File) => {
    if (!editor.value || !user.value) return

    try {
      const imageUrl = await uploadInlineImage(file, user.value.id)
      if (imageUrl) {
        editor.value.chain().focus().setImage({ src: imageUrl }).run()
      }
    } catch (error) {
      console.error('画像アップロードエラー:', error)
    }
  }

  const addLink = (url: string) => {
    if (!editor.value) return
    
    if (url) {
      editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    }
  }

  const getContent = () => {
    return editor.value?.getJSON() || null
  }

  const getHTML = () => {
    return editor.value?.getHTML() || ''
  }

  const setContent = (content: any) => {
    if (editor.value) {
      editor.value.commands.setContent(content)
    }
  }

  const destroy = () => {
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
  }

  onBeforeUnmount(() => {
    destroy()
  })

  return {
    editor,
    initEditor,
    addImage,
    addLink,
    getContent,
    getHTML,
    setContent,
    destroy
  }
}
