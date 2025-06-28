
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  'admin@juna-supabase.com',
  '$2a$10$x123456789012345678901uabc123456789012345678901234567890',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  true,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, account_id, nickname, is_admin, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'システム管理者',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET is_admin = true;

CREATE POLICY "管理者は全プロフィール参照可能" 
  ON profiles FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全プロフィール更新可能" 
  ON profiles FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全プロフィール削除可能" 
  ON profiles FOR DELETE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全投稿参照可能" 
  ON posts FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全投稿更新可能" 
  ON posts FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全投稿削除可能" 
  ON posts FOR DELETE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全コメント参照可能" 
  ON comments FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全コメント更新可能" 
  ON comments FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全コメント削除可能" 
  ON comments FOR DELETE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全カテゴリ更新可能" 
  ON categories FOR UPDATE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全カテゴリ削除可能" 
  ON categories FOR DELETE 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全いいね参照可能" 
  ON post_likes FOR SELECT 
  USING (is_admin(auth.uid()));

CREATE POLICY "管理者は全コメントいいね参照可能" 
  ON comment_likes FOR SELECT 
  USING (is_admin(auth.uid()));
