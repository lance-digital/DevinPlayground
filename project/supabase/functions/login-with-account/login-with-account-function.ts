// @ts-ignore
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { identifier, password } = await req.json();
    
    // メールアドレス形式かどうかを判断
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    
    // サービスロールキーでクライアントを作成
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    let email = identifier;
    
    // アカウントIDの場合、ユーザーIDを取得してからメールアドレスを取得
    if (!isEmail) {
      // @から始まる場合は@を削除
      const accountId = identifier.startsWith('@') ? identifier.substring(1) : identifier;
      
      // プロフィールテーブルからアカウントIDを持つユーザーを検索
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('account_id', accountId)
        .single();
      
      if (profileError || !profileData) {
        return new Response(
          JSON.stringify({ success: false, error: 'アカウントが見つかりません' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // ユーザーIDからユーザー情報を取得
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin
        .getUserById(profileData.id);
      
      if (userError || !userData?.user?.email) {
        return new Response(
          JSON.stringify({ success: false, error: 'ユーザー情報の取得に失敗しました' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      email = userData.user.email;
    }
    
    // メールアドレスでログイン（パスワードチェックはSupabaseが行う）
    return new Response(
      JSON.stringify({ success: true, email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 