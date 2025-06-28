import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URLまたはAnon Keyが設定されていません。.envファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 認証状態変更のリスナー関数
export function subscribeToAuthChanges(callback: (event: 'SIGNED_IN' | 'SIGNED_OUT', session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      callback('SIGNED_IN', session);
    } else if (event === 'SIGNED_OUT') {
      callback('SIGNED_OUT', session);
    }
  });
}

// ユーザープロフィールを取得する
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// リアルタイムサブスクリプションを設定する
export function subscribeToChannel(channel: string, callback: (payload: any) => void) {
  return supabase
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe();
} 