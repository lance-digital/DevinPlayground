// ストレージバケット名とURLを管理するユーティリティ
const VITE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const StorageBuckets = {
  // スキーマ上の名前
  PROFILE_IMAGES: 'profile_images',
  POST_IMAGES: 'post_images',
  COVER_IMAGES: 'cover_images'
};

// プロフィール画像URL取得（null安全）
export function getProfileImageUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') 
    ? path 
    : `${VITE_SUPABASE_URL}/storage/v1/object/public/${StorageBuckets.PROFILE_IMAGES}/${path}`;
}

// 投稿画像URL取得（null安全）
export function getPostImageUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') 
    ? path 
    : `${VITE_SUPABASE_URL}/storage/v1/object/public/${StorageBuckets.POST_IMAGES}/${path}`;
}

// カバー画像URL取得（null安全）
export function getCoverImageUrl(path: string | null): string {
  if (!path) return '';
  
  // パスがHTTPで始まる場合はそのまま返す
  if (path.startsWith('http')) return path;
  
  // ストレージパスを構築
  const url = `${VITE_SUPABASE_URL}/storage/v1/object/public/${StorageBuckets.COVER_IMAGES}/${path}`;
  
  return url;
} 