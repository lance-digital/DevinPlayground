
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


INSERT INTO profiles (id, account_id, nickname, bio, is_admin, created_at, updated_at)
VALUES (
  'a50469a9-0b62-4115-a61f-990cf2c5f074',
  'admin',
  '管理者',
  'システム管理者アカウントです。サイト全体の管理を行います。',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  account_id = EXCLUDED.account_id,
  nickname = EXCLUDED.nickname,
  bio = EXCLUDED.bio,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

INSERT INTO profiles (id, account_id, nickname, bio, is_admin, created_at, updated_at)
SELECT 
  u.id,
  'admin',
  '管理者',
  'システム管理者アカウントです。サイト全体の管理を行います。',
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'admin@juna-supabase.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

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
