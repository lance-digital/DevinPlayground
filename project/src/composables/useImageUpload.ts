import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import imageCompression from 'browser-image-compression'

export function useImageUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }
    
    try {
      return await imageCompression(file, options)
    } catch (err) {
      console.error('画像圧縮エラー:', err)
      return file
    }
  }

  const uploadProfileImage = async (file: File, userId: string): Promise<string | null> => {
    uploading.value = true
    error.value = null

    try {
      const compressedFile = await compressImage(file)
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${userId}/profile.${fileExt}`

      const { data: existingFiles } = await supabase.storage
        .from('profile_images')
        .list(userId)

      if (existingFiles && existingFiles.length > 0) {
        for (const existingFile of existingFiles) {
          await supabase.storage
            .from('profile_images')
            .remove([`${userId}/${existingFile.name}`])
        }
      }

      const { data, error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err: any) {
      error.value = err.message || '画像のアップロードに失敗しました'
      return null
    } finally {
      uploading.value = false
    }
  }

  const uploadCoverImage = async (file: File, userId: string, postId?: string): Promise<string | null> => {
    uploading.value = true
    error.value = null

    try {
      const compressedFile = await compressImage(file)
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = postId 
        ? `${userId}/${postId}_cover.${fileExt}`
        : `${userId}/${Date.now()}_cover.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('cover_images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('cover_images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err: any) {
      error.value = err.message || 'カバー画像のアップロードに失敗しました'
      return null
    } finally {
      uploading.value = false
    }
  }

  const uploadInlineImage = async (file: File, userId: string): Promise<string | null> => {
    uploading.value = true
    error.value = null

    try {
      const compressedFile = await compressImage(file)
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}_inline.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err: any) {
      error.value = err.message || '画像のアップロードに失敗しました'
      return null
    } finally {
      uploading.value = false
    }
  }

  const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (deleteError) {
        throw deleteError
      }

      return true
    } catch (err: any) {
      error.value = err.message || '画像の削除に失敗しました'
      return false
    }
  }

  return {
    uploading,
    error,
    uploadProfileImage,
    uploadCoverImage,
    uploadInlineImage,
    deleteImage
  }
}
