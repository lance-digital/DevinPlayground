import { ref } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * クリーンアップ処理の結果を表す型
 */
export interface CleanupResult {
  success: boolean
  deletedPaths: string[]
  error?: string
}

/**
 * 画像のクリーンアップ処理を行うコンポーザブル
 * 不要になった画像をSupabaseストレージから削除する機能を提供します
 */
export function useImageCleanup() {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  /**
   * HTML/JSONコンテンツから画像パスを抽出する関数
   * @param content HTMLテキストまたはJSONオブジェクト
   * @returns 抽出された画像パスの配列
   */
  function extractImagePathsFromContent(content: string | any): string[] {
    if (!content) return []
    
    // HTML文字列として処理する場合
    if (typeof content === 'string') {
      const regex = /<img[^>]+src="([^">]+)"/g
      const matches = [...content.matchAll(regex)]
      return matches
        .map(match => match[1])
        .filter(src => {
          // Supabaseのストレージパスのみを対象とする
          return src.includes('/storage/v1/object/public/') || 
                 src.includes('post_images/') || 
                 src.includes('cover_images/')
        })
        .map(src => {
          // URLからストレージパスを抽出
          const pathMatch = src.match(/\/storage\/v1\/object\/public\/(post_images|cover_images)\/(.+)/)
          if (pathMatch) {
            return `${pathMatch[1]}/${pathMatch[2]}`
          }
          
          // すでにパス形式の場合はそのまま返す
          if (src.startsWith('post_images/') || src.startsWith('cover_images/')) {
            return src
          }
          
          return src
        })
    }
    
    // JSONオブジェクトとして処理する場合（TiptapのJSON形式など）
    if (typeof content === 'object') {
      const imagePaths: string[] = []
      
      // JSONツリーを再帰的に探索する内部関数
      function extractFromNode(node: any) {
        // 画像ノードの場合
        if (node.type === 'image' && node.attrs && node.attrs.src) {
          const src = node.attrs.src
          if (typeof src === 'string') {
            // URLからストレージパスを抽出
            const pathMatch = src.match(/\/storage\/v1\/object\/public\/(post_images|cover_images)\/(.+)/)
            if (pathMatch) {
              imagePaths.push(`${pathMatch[1]}/${pathMatch[2]}`)
            } else if (src.startsWith('post_images/') || src.startsWith('cover_images/')) {
              imagePaths.push(src)
            }
          }
        }
        
        // 子ノードがある場合は再帰的に処理
        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(extractFromNode)
        }
      }
      
      // ルートノードから処理開始
      if (content.type) {
        extractFromNode(content)
      } else if (content.doc) {
        extractFromNode(content.doc)
      }
      
      return imagePaths
    }
    
    return []
  }

  /**
   * パスを正規化してファイル名を抽出する関数
   * @param path 画像パス
   * @param bucketType バケットタイプ（'post_images'または'cover_images'）
   * @returns ファイル名
   */
  function normalizePathAndExtractFilename(path: string, bucketType: 'post_images' | 'cover_images'): string | null {
    if (!path) return null
    
    console.log(`正規化前のパス (${bucketType}):`, path)
    
    // 完全なURLからファイル名を抽出
    if (path.includes(`/storage/v1/object/public/${bucketType}/`)) {
      const filename = path.split(`${bucketType}/`).pop()
      console.log(`URLからファイル名を抽出 (${bucketType}):`, filename)
      return filename || null
    }
    
    // バケット名付きパスからファイル名を抽出
    if (path.startsWith(`${bucketType}/`)) {
      const filename = path.replace(`${bucketType}/`, '')
      console.log(`バケット名付きパスからファイル名を抽出 (${bucketType}):`, filename)
      return filename
    }
    
    // バケット名が含まれている場合はファイル名を抽出
    if (path.includes(`${bucketType}/`)) {
      const filename = path.split(`${bucketType}/`)[1]
      console.log(`バケット名を含むパスからファイル名を抽出 (${bucketType}):`, filename)
      return filename
    }
    
    // すでにファイル名の可能性がある場合
    console.log(`既にファイル名の可能性 (${bucketType}):`, path)
    return path
  }

  /**
   * 不要になった画像を特定して削除する関数
   * @param oldContent 古いコンテンツ
   * @param newContent 新しいコンテンツ
   * @param oldCoverImage 古いアイキャッチ画像パス
   * @param newCoverImage 新しいアイキャッチ画像パス
   * @returns 削除処理の結果
   */
  async function cleanupUnusedImages(
    oldContent: string | object = '',
    newContent: string | object = '',
    oldCoverImage?: string | null,
    newCoverImage?: string | null
  ): Promise<CleanupResult> {
    isProcessing.value = true
    error.value = null
    
    try {
      console.log('==== 画像クリーンアップ処理開始 ====')
      console.log('古いカバー画像:', oldCoverImage)
      console.log('新しいカバー画像:', newCoverImage)
      
      // コンテンツから画像パスを抽出
      const oldImagePaths = extractImagePathsFromContent(oldContent)
      const newImagePaths = extractImagePathsFromContent(newContent)
      
      console.log('古いコンテンツの画像パス:', oldImagePaths)
      console.log('新しいコンテンツの画像パス:', newImagePaths)
      
      // アイキャッチ画像のパスを追加
      if (oldCoverImage) {
        oldImagePaths.push(oldCoverImage)
      }
      
      if (newCoverImage) {
        newImagePaths.push(newCoverImage)
      }
      
      // 削除すべき画像を特定（古い画像パスのうち、新しいコンテンツに含まれないもの）
      const pathsToDelete = oldImagePaths.filter(oldPath => 
        !newImagePaths.some(newPath => {
          // パスの正規化（URLやパス形式の違いを吸収）
          const normalizedOldPath = oldPath.replace(/^.*\/(post_images|cover_images)\//, '$1/')
          const normalizedNewPath = newPath.replace(/^.*\/(post_images|cover_images)\//, '$1/')
          return normalizedOldPath === normalizedNewPath
        })
      )
      
      console.log('削除対象の画像パス:', pathsToDelete)
      
      if (pathsToDelete.length === 0 && !(oldCoverImage && !newCoverImage)) {
        console.log('削除する画像はありません')
        return { success: true, deletedPaths: [] }
      }
      
      // バケットごとに分類
      const postImagesToDelete: string[] = []
      const coverImagesToDelete: string[] = []
      
      // 削除対象の画像パスからファイル名を抽出して削除リストに追加
      pathsToDelete.forEach(path => {
        // post_imagesの処理
        if (path.includes('post_images')) {
          const filename = normalizePathAndExtractFilename(path, 'post_images')
          if (filename && !postImagesToDelete.includes(filename)) {
            postImagesToDelete.push(filename)
          }
        }
        // cover_imagesの処理
        else if (path.includes('cover_images')) {
          const filename = normalizePathAndExtractFilename(path, 'cover_images')
          if (filename && !coverImagesToDelete.includes(filename)) {
            coverImagesToDelete.push(filename)
          }
        }
      })
      
      // 明示的なアイキャッチ画像削除ケースの処理
      // 古いカバー画像がある＆新しいカバー画像がない場合は削除対象
      if (oldCoverImage && !newCoverImage) {
        console.log('アイキャッチ画像削除操作を検出:', oldCoverImage)
        const filename = normalizePathAndExtractFilename(oldCoverImage, 'cover_images')
        if (filename && !coverImagesToDelete.includes(filename)) {
          console.log('アイキャッチ画像削除リストに追加:', filename)
          coverImagesToDelete.push(filename)
        }
      }
      
      console.log('削除対象の記事画像リスト:', postImagesToDelete)
      console.log('削除対象のカバー画像リスト:', coverImagesToDelete)
      
      // 画像を削除
      const deletePromises: Promise<any>[] = []
      
      if (postImagesToDelete.length > 0) {
        console.log('記事画像の削除処理を実行します:', postImagesToDelete)
        deletePromises.push(supabase.storage.from('post_images').remove(postImagesToDelete))
      }
      
      if (coverImagesToDelete.length > 0) {
        console.log('カバー画像の削除処理を実行します:', coverImagesToDelete)
        deletePromises.push(supabase.storage.from('cover_images').remove(coverImagesToDelete))
      }
      
      if (deletePromises.length === 0) {
        console.log('削除対象の画像はありません')
        return { success: true, deletedPaths: [] }
      }
      
      // 削除処理を実行
      console.log('削除処理を実行します')
      const results = await Promise.all(deletePromises)
      
      // エラーチェック
      const failedResults = results.filter(result => result.error)
      
      if (failedResults.length > 0) {
        console.error('画像削除エラー:', failedResults)
        error.value = '一部の画像を削除できませんでした'
        return { 
          success: false, 
          deletedPaths: pathsToDelete,
          error: '一部の画像を削除できませんでした' 
        }
      }
      
      console.log('==== 画像クリーンアップ処理完了 ====')
      return { 
        success: true, 
        deletedPaths: pathsToDelete 
      }
      
    } catch (err: any) {
      console.error('画像クリーンアップエラー:', err)
      error.value = err.message || '画像クリーンアップ処理に失敗しました'
      return { 
        success: false, 
        deletedPaths: [],
        error: err.message || '画像クリーンアップ処理に失敗しました'
      }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    isProcessing,
    error,
    extractImagePathsFromContent,
    cleanupUnusedImages
  }
} 