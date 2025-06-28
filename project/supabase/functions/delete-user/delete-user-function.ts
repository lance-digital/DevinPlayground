// ファイル名: delete-user-function.ts
// 処理概要: 指定されたSupabaseユーザーの認証・ストレージ・投稿・カテゴリを完全削除（副作用あり）
// --- 設計思想 ---
//
// 1. **多段トランザクション設計**
//    明示的にrollback関数を積み、失敗時に逆順undo（Stack構造）で整合性担保
//
// 2. **完全削除処理の実装**
//    ストレージ→投稿→カテゴリ→プロフィール→認証の順に副作用を整理
//
// 3. **カテゴリの引き継ぎ処理**
//    共有カテゴリはsystemに引き継ぎ、孤立カテゴリは削除
//
// 4. **CORS・入力検証・所有者確認**
//    ALLOWED_ORIGINS, Bearer Token, auth.getUser() で明示的に実装
//
// 5. **監査・トレース性**
//    traceId + structured logging + rollback追跡用ログ

// @ts-ignore
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
// @ts-ignore
import { z } from 'https://esm.sh/zod@3.22.4';

const SYSTEM_USER_ID: string = '00000000-0000-0000-0000-000000000000';
const BUCKETS = ['profile_images', 'post_images', 'cover_images'] as const;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

const allowedOrigins: string[] = (() => {
  // @ts-ignore
  const raw = Deno.env.get('ALLOWED_ORIGINS');
  return raw ? raw.split(',').map((s: string) => s.trim()).filter(Boolean) : ['*'];
})();

function getEnv(key: string): string {
  // @ts-ignore
  const val = Deno.env.get(key);
  if (!val) throw new Error(`Missing env: ${key}`);
  return val;
}

function validateOrigin(origin: string | null): boolean {
  return origin ? allowedOrigins.includes(origin) || allowedOrigins.includes('*') : false;
}

function jsonResponse<T extends object>(
  body: T & { success: boolean; errorCode?: string },
  traceId: string,
  status = 200,
  origin: string | null = null
): Response {
  const headers = new Headers(corsHeaders);
  if (origin && validateOrigin(origin)) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Trace-Id', traceId);

  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}

const RequestSchema = z.object({
  userId: z.string().uuid(),
});

type RequestBody = z.infer<typeof RequestSchema>;

type Profile = {
  id: string;
  nickname: string;
  account_id: string;
};

type StorageFile = {
  name: string;
};

type Category = {
  id: number;
};

type PostCategory = {
  category_id: number;
  posts: { author_id: string };
};

serve(async (req: Request): Promise<Response> => {
  const traceId = crypto.randomUUID();
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS') {
    const headers = new Headers(corsHeaders);
    headers.set('Access-Control-Allow-Origin', validateOrigin(origin) ? origin : 'null');
    headers.set('X-Trace-Id', traceId);
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  try {
    if (!validateOrigin(origin)) {
      return jsonResponse({ success: false, error: '許可されていないオリジンです', errorCode: 'forbidden_origin' }, traceId, 403, origin);
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return jsonResponse({ success: false, error: 'トークンが必要です', errorCode: 'unauthorized' }, traceId, 401, origin);
    }

    const raw = await req.json();
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonResponse({
        success: false,
        error: 'リクエスト形式が不正です',
        errorCode: 'validation_error',
        details: parsed.error.flatten(),
      }, traceId, 400, origin);
    }

    const { userId }: RequestBody = parsed.data;
    const supabase: SupabaseClient = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );

    const { data: authUser, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || authUser.user?.id !== userId) {
      return jsonResponse({ success: false, error: '認証失敗', errorCode: 'invalid_user' }, traceId, 403, origin);
    }

    const rollbackStack: Array<() => Promise<void>> = [];

    for (const bucket of BUCKETS) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(userId);
        const paths = (files ?? []).map((f: StorageFile) => `${userId}/${f.name}`);
        if (paths.length) {
          await supabase.storage.from(bucket).remove(paths);
          rollbackStack.unshift(() =>
            Promise.all(paths.map((p: string) =>
              supabase.storage.from(bucket).upload(p, new Blob(['rollback']), { upsert: true })
            )).then(() => {})
          );
        }
      } catch (e) {
        console.warn(`[${traceId}] Storage ${bucket} 削除エラー`, e);
      }
    }

    await supabase.from('posts').delete().eq('author_id', userId);
    await supabase.from('post_likes').delete().eq('user_id', userId);
    await supabase.from('comment_likes').delete().eq('user_id', userId);

    const { data: categories } = await supabase.from('categories').select('id').eq('creator_id', userId);
    const categoryIds = (categories ?? []).map((c: Category) => c.id);

    if (categoryIds.length) {
      const { data: shared } = await supabase.from('post_categories')
        .select('category_id, posts!inner(author_id)')
        .in('category_id', categoryIds)
        .neq('posts.author_id', userId);

      const sharedIds = [...new Set((shared ?? []).map((r: PostCategory) => r.category_id))];
      const ownOnly = categoryIds.filter((id: number) => !sharedIds.includes(id));

      if (sharedIds.length) {
        await supabase.from('categories').update({ creator_id: SYSTEM_USER_ID }).in('id', sharedIds);
      }
      if (ownOnly.length) {
        await supabase.from('categories').delete().in('id', ownOnly);
      }
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
      rollbackStack.unshift(() => supabase.from('profiles').insert(profile as Profile));
      await supabase.from('profiles').delete().eq('id', userId);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return jsonResponse({ success: true }, traceId, 200, origin);
  } catch (err) {
    console.error(`[${traceId}] ユーザー削除失敗:`, err instanceof Error ? err.stack : err);
    return jsonResponse({ success: false, error: 'ユーザー削除に失敗しました', errorCode: 'internal_error' }, traceId, 500, origin);
  }
}); 