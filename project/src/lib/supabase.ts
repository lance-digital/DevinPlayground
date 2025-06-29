import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // ユーザーID（主キー）
          nickname: string // ニックネーム
          account_id: string // アカウントID（ユニーク）
          avatar_data: string | null // アバター画像データ（Base64等）
          bio: string | null // 自己紹介文
          is_admin: boolean // 管理者フラグ
          created_at: string // 作成日時
          updated_at: string // 更新日時
        }
        Insert: {
          id: string // ユーザーID（必須）
          nickname: string // ニックネーム（必須）
          account_id: string // アカウントID（必須）
          avatar_data?: string | null // アバター画像データ（任意）
          bio?: string | null // 自己紹介文（任意）
          is_admin?: boolean // 管理者フラグ（任意、デフォルトfalse）
          created_at?: string // 作成日時（任意、自動設定）
          updated_at?: string // 更新日時（任意、自動設定）
        }
        Update: {
          id?: string // ユーザーID（任意）
          nickname?: string // ニックネーム（任意）
          account_id?: string // アカウントID（任意）
          avatar_data?: string | null // アバター画像データ（任意）
          bio?: string | null // 自己紹介文（任意）
          is_admin?: boolean // 管理者フラグ（任意）
          created_at?: string // 作成日時（任意）
          updated_at?: string // 更新日時（任意）
        }
      }
      posts: {
        Row: {
          id: number // 投稿ID（主キー、自動増分）
          title: string // 投稿タイトル
          content: any // 投稿内容（JSONB形式）
          excerpt: string | null // 投稿の概要・抜粋
          cover_image_url: string | null // カバー画像のURL
          author_id: string // 投稿者ID（外部キー）
          published: boolean // 公開状態フラグ
          created_at: string // 作成日時
          updated_at: string // 更新日時
        }
        Insert: {
          id?: number // 投稿ID（任意、自動増分）
          title: string // 投稿タイトル（必須）
          content: any // 投稿内容（必須、JSONB形式）
          excerpt?: string | null // 投稿の概要・抜粋（任意）
          cover_image_url?: string | null // カバー画像のURL（任意）
          author_id: string // 投稿者ID（必須）
          published?: boolean // 公開状態フラグ（任意、デフォルトfalse）
          created_at?: string // 作成日時（任意、自動設定）
          updated_at?: string // 更新日時（任意、自動設定）
        }
        Update: {
          id?: number // 投稿ID（任意）
          title?: string // 投稿タイトル（任意）
          content?: any // 投稿内容（任意、JSONB形式）
          excerpt?: string | null // 投稿の概要・抜粋（任意）
          cover_image_url?: string | null // カバー画像のURL（任意）
          author_id?: string // 投稿者ID（任意）
          published?: boolean // 公開状態フラグ（任意）
          created_at?: string // 作成日時（任意）
          updated_at?: string // 更新日時（任意）
        }
      }
      comments: {
        Row: {
          id: number // コメントID（主キー、自動増分）
          content: string // コメント内容
          author_id: string // コメント投稿者ID（外部キー）
          post_id: number // 投稿ID（外部キー）
          parent_comment_id: number | null // 親コメントID（返信の場合）
          created_at: string // 作成日時
          updated_at: string // 更新日時
        }
        Insert: {
          id?: number // コメントID（任意、自動増分）
          content: string // コメント内容（必須）
          author_id: string // コメント投稿者ID（必須）
          post_id: number // 投稿ID（必須）
          parent_comment_id?: number | null // 親コメントID（任意、返信の場合）
          created_at?: string // 作成日時（任意、自動設定）
          updated_at?: string // 更新日時（任意、自動設定）
        }
        Update: {
          id?: number // コメントID（任意）
          content?: string // コメント内容（任意）
          author_id?: string // コメント投稿者ID（任意）
          post_id?: number // 投稿ID（任意）
          parent_comment_id?: number | null // 親コメントID（任意）
          created_at?: string // 作成日時（任意）
          updated_at?: string // 更新日時（任意）
        }
      }
      categories: {
        Row: {
          id: number // カテゴリID（主キー、自動増分）
          name: string // カテゴリ名
          description: string | null // カテゴリの説明
          creator_id: string // 作成者ID（外部キー）
          created_at: string // 作成日時
          updated_at: string // 更新日時
        }
        Insert: {
          id?: number // カテゴリID（任意、自動増分）
          name: string // カテゴリ名（必須）
          description?: string | null // カテゴリの説明（任意）
          creator_id: string // 作成者ID（必須）
          created_at?: string // 作成日時（任意、自動設定）
          updated_at?: string // 更新日時（任意、自動設定）
        }
        Update: {
          id?: number // カテゴリID（任意）
          name?: string // カテゴリ名（任意）
          description?: string | null // カテゴリの説明（任意）
          creator_id?: string // 作成者ID（任意）
          created_at?: string // 作成日時（任意）
          updated_at?: string // 更新日時（任意）
        }
      }
      post_likes: {
        Row: {
          id: number // いいねID（主キー、自動増分）
          user_id: string // ユーザーID（外部キー）
          post_id: number // 投稿ID（外部キー）
          created_at: string // 作成日時
        }
        Insert: {
          id?: number // いいねID（任意、自動増分）
          user_id: string // ユーザーID（必須）
          post_id: number // 投稿ID（必須）
          created_at?: string // 作成日時（任意、自動設定）
        }
        Update: {
          id?: number // いいねID（任意）
          user_id?: string // ユーザーID（任意）
          post_id?: number // 投稿ID（任意）
          created_at?: string // 作成日時（任意）
        }
      }
      comment_likes: {
        Row: {
          id: number // いいねID（主キー、自動増分）
          user_id: string // ユーザーID（外部キー）
          comment_id: number // コメントID（外部キー）
          created_at: string // 作成日時
        }
        Insert: {
          id?: number // いいねID（任意、自動増分）
          user_id: string // ユーザーID（必須）
          comment_id: number // コメントID（必須）
          created_at?: string // 作成日時（任意、自動設定）
        }
        Update: {
          id?: number // いいねID（任意）
          user_id?: string // ユーザーID（任意）
          comment_id?: number // コメントID（任意）
          created_at?: string // 作成日時（任意）
        }
      }
      post_categories: {
        Row: {
          id: number // 関連ID（主キー、自動増分）
          post_id: number // 投稿ID（外部キー）
          category_id: number // カテゴリID（外部キー）
          created_at: string // 作成日時
        }
        Insert: {
          id?: number // 関連ID（任意、自動増分）
          post_id: number // 投稿ID（必須）
          category_id: number // カテゴリID（必須）
          created_at?: string // 作成日時（任意、自動設定）
        }
        Update: {
          id?: number // 関連ID（任意）
          post_id?: number // 投稿ID（任意）
          category_id?: number // カテゴリID（任意）
          created_at?: string // 作成日時（任意）
        }
      }
    } // テーブル定義の終了
  } // publicスキーマの終了
} // データベース型定義の終了
