// login-with-account-function.ts
// Supabase Edge Function: アカウントIDまたはメールアドレスを受け取り、
// メールアドレスを返却する関数（バリデーション、レートリミット、型安全性、セキュリティ対応済）

// @ts-ignore - Deno環境で型定義非対応を抑制 (Deno標準ライブラリのインポート)
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'; // DenoのHTTPサーバー機能
// @ts-ignore - Deno環境で型定義非対応を抑制 (Supabaseクライアントライブラリのインポート)
import { createClient, type SupabaseClient, type UserResponse } from 'https://esm.sh/@supabase/supabase-js@2'; // Supabaseクライアントと関連型

// エラーレスポンスの型定義
interface EdgeFunctionErrorResponse {
  success: false; // 処理失敗フラグ
  error: string; // エラーメッセージ
  errorCode: string; // エラーコード（クライアントでの識別用）
  retryAfterSeconds?: number; // レートリミット時に再試行までの秒数を示す (任意)
}

// 成功レスポンスの型定義
interface EdgeFunctionSuccessResponse {
  success: true; // 処理成功フラグ
  email: string; // 取得したメールアドレス
}

// CORS関連のヘッダーを定義
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*', // すべてのオリジンを許可
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // 許可するリクエストヘッダー
  'Content-Type': 'application/json' // レスポンスのコンテントタイプをJSONに設定
};

// 環境変数を取得する関数（未定義の場合はエラー）
function getEnv(name: string): string {
  // @ts-ignore - Deno環境を想定しているため無視
  const value = Deno.env.get(name); // DenoのAPIで環境変数を取得
  if (!value) throw new Error(`環境変数 ${name} が未定義です。`); // 未定義ならエラーをスロー
  return value; // 取得した値を返す
}

// JSON形式のエラーレスポンスを生成する関数
function jsonError(status: number, message: string, code: string, retryAfterSeconds?: number): Response {
  // エラーレスポンスのボディを作成
  const body: EdgeFunctionErrorResponse = { success: false, error: message, errorCode: code, ...(retryAfterSeconds && { retryAfterSeconds }) };
  // ヘッダーにCORS設定をコピー
  const headers: Record<string, string> = { ...corsHeaders };
  // retryAfterSecondsが指定されていれば、Retry-Afterヘッダーを追加
  if (retryAfterSeconds) headers['Retry-After'] = retryAfterSeconds.toString();
  // JSON文字列化したボディとステータス、ヘッダーを持つResponseオブジェクトを返す
  return new Response(JSON.stringify(body), { status, headers });
}

// 簡易レートリミット機構: 同一IPからのリクエストを一定間隔で制限（本番ではDeno KVやRedis推奨）
const ipAccessMap = new Map<string, number>(); // IPアドレスと最終アクセス時刻(Unixタイムスタンプ)を格納するMap
const RATE_LIMIT_WINDOW = 10; // レートリミットの期間（秒）

// HTTPリクエストを処理するメイン関数
serve(async (req: Request): Promise<Response> => {
  // OPTIONSメソッド（プリフライトリクエスト）への対応
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  // try-catchでエラー処理
  try {
    // リクエストヘッダーからクライアントIPアドレスを取得（プロキシ経由も考慮）
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    // 現在時刻のUnixタイムスタンプ（秒）を取得
    const now = Math.floor(Date.now() / 1000);
    // このIPアドレスからの最後のアクセス時刻を取得
    const lastAccess = ipAccessMap.get(ip);
    // 最後のアクセスがあり、かつレートリミット期間内の場合
    if (lastAccess && now - lastAccess < RATE_LIMIT_WINDOW) {
      // 429 Too Many Requests エラーを返す
      return jsonError(429, 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。', 'rate_limited', RATE_LIMIT_WINDOW);
    }
    // 現在のアクセス時刻を記録（または更新）
    ipAccessMap.set(ip, now);

    // リクエストボディをJSONとしてパースし、identifierを取得
    const { identifier }: { identifier: string } = await req.json();
    // identifierが空または文字列でない場合は400エラー
    if (!identifier || typeof identifier !== 'string') return jsonError(400, 'アカウントIDまたはメールアドレスを入力してください。', 'missing_identifier');

    // identifierがメールアドレス形式かどうかを正規表現で判定
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    // Supabaseクライアントを初期化（サービスロールキーを使用）
    const supabase: SupabaseClient = createClient(
      getEnv('SUPABASE_URL'), // SupabaseプロジェクトURL
      getEnv('SUPABASE_SERVICE_ROLE_KEY'), // Supabaseサービスロールキー
      { auth: { persistSession: false } } // セッションを保持しない設定
    );

    // 結果として返すメールアドレスを格納する変数。初期値はidentifier
    let email = identifier;

    // identifierがメールアドレス形式でなかった場合（アカウントIDと判断）
    if (!isEmail) {
      // identifierが'@'で始まる場合は'@'を除去、そうでなければそのまま使用
      const accountId = identifier.startsWith('@') ? identifier.slice(1) : identifier;

      // accountId のバリデーション：長さ(3-15文字)、使用可能文字（英数、一部記号、日本語）をチェック
      if (accountId.length < 3 || accountId.length > 15 || !/^[a-zA-Z0-9_\\-\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FFF]+$/.test(accountId)) {
        // 無効な形式の場合は400エラー
        return jsonError(400, 'アカウントIDの形式が正しくありません。3文字以上15文字以下で入力してください。', 'invalid_account_id');
      }

      // profilesテーブルからaccountIdに一致するレコードのid（＝ユーザーUUID）を検索
      const { data: profile, error: profileError } = await supabase
        .from('profiles') // profilesテーブルを指定
        .select('id') // idカラムを選択
        .eq('account_id', accountId) // account_idが一致するものを検索
        .maybeSingle(); // 結果が0件または1件であることを期待

      // プロフィール検索でエラーが発生したか、プロフィールが見つからなかった場合
      if (profileError || !profile) return jsonError(404, '入力されたアカウントIDを持つユーザーが見つかりませんでした。', 'account_not_found');

      // プロフィールID（ユーザーUUID）を使って、Authユーザー情報を取得 (Admin API)
      const { data: userResult, error: userError }: UserResponse = await supabase.auth.admin.getUserById(profile.id);
      // Authユーザー取得でエラーが発生したか、ユーザー情報またはメールアドレスが存在しない場合
      if (userError || !userResult?.user?.email) return jsonError(500, 'ユーザー情報の取得中にエラーが発生しました。', 'user_fetch_failed');

      // 取得したAuthユーザーのメールアドレスをemail変数に格納
      email = userResult.user.email;
    }

    // 成功レスポンスのデータを作成
    const success: EdgeFunctionSuccessResponse = {
      success: true, // 成功フラグ
      email // 取得したメールアドレス
    };
    // JSON文字列化した成功レスポンスと200 OKステータス、ヘッダーを返す
    return new Response(JSON.stringify(success), {
      headers: { ...corsHeaders }
    });
  // tryブロック内で予期せぬエラーが発生した場合
  } catch (err: unknown) {
    // エラーオブジェクトからメッセージを取得
    const msg = err instanceof Error ? err.message : String(err);
    // エラーログをコンソールに出力
    console.error('識別子からのメールアドレス取得処理中にエラーが発生しました:', msg); // 処理名エラーログ
    // 500 Internal Server Error を返す
    return jsonError(500, 'サーバー内部でエラーが発生しました。', 'internal_error');
  }
}); 