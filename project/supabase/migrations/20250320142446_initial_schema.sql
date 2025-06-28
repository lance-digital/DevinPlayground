-- 拡張機能と基本設定
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 日本語検索用の設定
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'japanese'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION japanese (COPY = pg_catalog.simple);
  END IF;
END $$;

-- ユーティリティ関数（事前定義）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ストレージバケット設定
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile_images', 'プロフィール画像', true);

INSERT INTO storage.buckets (id, name, public) VALUES 
('post_images', '投稿画像', true);

INSERT INTO storage.buckets (id, name, public) VALUES 
('cover_images', 'アイキャッチ画像', true);

-- ストレージポリシー設定
CREATE POLICY "プロフィール画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'profile_images');

CREATE POLICY "ユーザーは自分のプロフィール画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分のプロフィール画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'profile_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "投稿画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'post_images');

CREATE POLICY "ユーザーは自分の投稿画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分の投稿画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'post_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "アイキャッチ画像は誰でも閲覧可能" 
  ON storage.objects FOR SELECT USING (bucket_id = 'cover_images');

CREATE POLICY "ユーザーは自分のアイキャッチ画像のみアップロード可能" 
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'cover_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ユーザーは自分のアイキャッチ画像のみ削除可能" 
  ON storage.objects FOR DELETE USING (
    bucket_id = 'cover_images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- セキュリティ関数
CREATE OR REPLACE FUNCTION is_post_author(uid uuid, p_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM posts WHERE id = p_id AND author_id = uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_post_published(p_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM posts WHERE id = p_id AND published = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_delete_comment(comment_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  is_parent_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM comments WHERE id = comment_id AND author_id = user_id
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM comments c
    JOIN comments parent ON c.parent_comment_id = parent.id
    WHERE c.id = comment_id AND parent.author_id = user_id
  ) INTO is_parent_owner;
  
  RETURN is_parent_owner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザープロフィールテーブル
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  account_id TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_data TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TRIGGER update_profile_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールは誰でも参照可能" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "認証済みユーザーのみプロフィール作成可能" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールのみ削除可能" 
  ON profiles FOR DELETE USING (auth.uid() = id);

-- カテゴリテーブル
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  creator_id UUID REFERENCES profiles(id)
);

CREATE TRIGGER update_category_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "カテゴリは誰でも参照可能" 
  ON categories FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーはカテゴリを作成可能" 
  ON categories FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "作成者はカテゴリを更新可能" 
  ON categories FOR UPDATE 
  USING (creator_id = auth.uid());

CREATE POLICY "作成者はカテゴリを削除可能" 
  ON categories FOR DELETE 
  USING (creator_id = auth.uid());

-- ブログ投稿テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  excerpt TEXT,
  cover_image_path TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  views INTEGER DEFAULT 0,
  last_edited_by UUID REFERENCES auth.users(id),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') || 
    setweight(to_tsvector('simple', coalesce(cast(content->>'text' as text), '')), 'B')
  ) STORED
);

CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);

CREATE TRIGGER update_post_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公開済み投稿は誰でも参照可能" 
  ON posts FOR SELECT USING (published = true);

CREATE POLICY "非公開投稿は作者のみ参照可能" 
  ON posts FOR SELECT USING (auth.uid() = author_id AND published = false);

CREATE POLICY "認証済みユーザーのみ投稿作成可能" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿更新可能" 
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿削除可能" 
  ON posts FOR DELETE USING (auth.uid() = author_id);

-- 投稿カテゴリ関連テーブル
CREATE TABLE post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, category_id)
);

ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿カテゴリは誰でも参照可能" 
  ON post_categories FOR SELECT USING (true);

CREATE POLICY "作者のみ投稿カテゴリ追加可能" 
  ON post_categories FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "作者のみ投稿カテゴリ削除可能" 
  ON post_categories FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- 投稿画像テーブル（修正版）
CREATE TABLE post_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  image_path TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿画像は誰でも参照可能" 
  ON post_images FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみ投稿画像追加可能" 
  ON post_images FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿画像更新可能" 
  ON post_images FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "作者のみ投稿画像削除可能" 
  ON post_images FOR DELETE USING (auth.uid() = author_id);

-- コメントテーブル
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

CREATE TRIGGER update_comment_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントは誰でも参照可能" 
  ON comments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND published = true
    ) OR 
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "認証済みユーザーのみコメント可能" 
  ON comments FOR INSERT WITH CHECK (
    auth.uid() = author_id AND (
      EXISTS (
        SELECT 1 FROM posts WHERE id = post_id AND published = true
      ) OR 
      EXISTS (
        SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
      )
    )
  );

CREATE POLICY "自分のコメントのみ更新可能" 
  ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "自分のコメントのみ削除可能" 
  ON comments FOR DELETE USING (
    auth.uid() = author_id OR 
    can_delete_comment(id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- 投稿いいねテーブル
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿いいねは誰でも参照可能" 
  ON post_likes FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみいいね可能" 
  ON post_likes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts p WHERE p.id = post_id AND p.published = true
    )
  );

CREATE POLICY "自分のいいねのみ削除可能" 
  ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- コメントいいねテーブル
CREATE TABLE comment_likes (
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントいいねは誰でも参照可能" 
  ON comment_likes FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーのみコメントにいいね可能" 
  ON comment_likes FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE c.id = comment_id AND p.published = true
    )
  );

CREATE POLICY "自分のコメントいいねのみ削除可能" 
  ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- トリガー関数
CREATE OR REPLACE FUNCTION link_post_images_on_post_create()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE post_images
  SET post_id = NEW.id
  WHERE author_id = NEW.author_id AND post_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER link_post_images_on_post_create
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION link_post_images_on_post_create();

CREATE OR REPLACE FUNCTION delete_post_images_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  image_record RECORD;
BEGIN
  FOR image_record IN SELECT image_path FROM post_images WHERE post_id = OLD.id LOOP
    DELETE FROM storage.objects WHERE name = image_record.image_path;
  END LOOP;
  
  IF OLD.cover_image_path IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = OLD.cover_image_path;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delete_post_images_from_storage
BEFORE DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION delete_post_images_from_storage();

-- 既存のデータに作成者情報を設定するトリガー関数
CREATE OR REPLACE FUNCTION set_creator_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- カテゴリの作成者を自動設定するトリガー
CREATE TRIGGER set_category_creator
BEFORE INSERT ON categories
FOR EACH ROW EXECUTE FUNCTION set_creator_id();

-- ユーティリティ関数
CREATE OR REPLACE FUNCTION search_posts(search_term TEXT)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE published = true 
    AND search_vector @@ plainto_tsquery('simple', search_term)
  ORDER BY ts_rank(search_vector, plainto_tsquery('simple', search_term)) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_related_posts(input_post_id UUID, limit_count INTEGER DEFAULT 5)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  WITH target_categories AS (
    SELECT category_id FROM post_categories WHERE post_id = input_post_id
  ),
  category_counts AS (
    SELECT 
      p.id,
      COUNT(*) AS category_match_count
    FROM posts p
    JOIN post_categories pc ON p.id = pc.post_id
    WHERE pc.category_id IN (SELECT category_id FROM target_categories)
    GROUP BY p.id
  )
  SELECT p.*
  FROM posts p
  JOIN category_counts cc ON p.id = cc.id
  WHERE p.published = true
    AND p.id != input_post_id
  ORDER BY cc.category_match_count DESC, p.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtimeサブスクリプション設定
ALTER PUBLICATION supabase_realtime ADD TABLE posts, comments, post_likes, comment_likes;

-- システム管理者設定（必要に応じてコメントを外して実行）
/*
-- システムユーザー用のUUID
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@example.com',
  '$2a$10$x123456789012345678901uabc123456789012345678901234567890',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);

-- システム管理用のプロフィールを作成
INSERT INTO profiles (id, account_id, nickname, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system',
  'システム',
  NOW(),
  NOW()
);
*/