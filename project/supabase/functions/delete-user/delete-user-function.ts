// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

// システムユーザーのID
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface RequestBody {
  userId: string;
}

serve(async (req: Request) => {
  // CORSプリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authorization ヘッダーから Bearer トークンを取得
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('認証エラー: Authorization ヘッダーがないか無効です');
      return new Response(
        JSON.stringify({ success: false, error: '認証エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // リクエストボディからユーザーIDを取得
    const { userId } = await req.json() as RequestBody;
    
    console.log('削除リクエスト受信:', { userId: userId.substring(0, 8) + '...' }) // IDの一部だけログ出力

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ユーザーIDが指定されていません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // サービスロールキーを取得
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      console.error('環境変数エラー: SUPABASE_SERVICE_ROLE_KEY が設定されていません')
      return new Response(
        JSON.stringify({ success: false, error: 'サーバー構成エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // アプリのURLを取得
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      console.error('環境変数エラー: SUPABASE_URL が設定されていません')
      return new Response(
        JSON.stringify({ success: false, error: 'サーバー構成エラー' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('環境変数確認OK')

    // 管理者クライアントの作成
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { 
        auth: { 
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
    
    // JWT デコード用の関数
    async function decodeAndVerifyJWT(token: string) {
      try {
        // サービスロールを使って管理者クライアントでユーザーを取得
        const { data, error } = await supabaseAdmin.auth.getUser(token)
        
        if (error) throw error
        return { user: data.user, error: null }
      } catch (error) {
        console.error('JWT検証エラー:', error)
        return { user: null, error }
      }
    }

    // ユーザーIDの検証
    const { user, error: jwtError } = await decodeAndVerifyJWT(token)

    if (jwtError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '認証に失敗しました: ' + (jwtError?.message || 'トークンが無効です') 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // 要求されたユーザーIDと認証されたユーザーIDが一致することを確認
    if (user.id !== userId) {
      console.error('ユーザーID不一致:', { requestedId: userId.substring(0, 8) + '...', tokenUserId: user.id.substring(0, 8) + '...' })
      return new Response(
        JSON.stringify({ success: false, error: '他のユーザーアカウントは削除できません' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('認証成功:', user.id.substring(0, 8) + '...')

    // ストレージ削除処理
    try {
      console.log('1. ストレージ削除開始')
      
      // バケットごとに処理を分離し、エラーが発生しても続行できるように
      const buckets = ['profile_images', 'post_images', 'cover_images']
      
      for (const bucket of buckets) {
        try {
          console.log(`${bucket} 処理開始`)
          const { data: objects, error: listError } = await supabaseAdmin.storage
            .from(bucket)
            .list(userId)
          
          if (listError) {
            console.error(`${bucket} 一覧取得エラー:`, listError)
            continue
          }
          
          if (objects && objects.length > 0) {
            const filePaths = objects.map(obj => `${userId}/${obj.name}`)
            console.log(`${bucket} 削除対象:`, filePaths.length)
            
            const { error: deleteError } = await supabaseAdmin.storage
              .from(bucket)
              .remove(filePaths)
              
            if (deleteError) {
              console.error(`${bucket} 削除エラー:`, deleteError)
            } else {
              console.log(`${bucket} 削除成功:`, filePaths.length)
            }
          } else {
            console.log(`${bucket} 削除対象なし`)
          }
        } catch (bucketError) {
          console.error(`${bucket} 処理エラー:`, bucketError)
        }
      }
    } catch (storageError) {
      console.error('ストレージ全体の削除エラー:', storageError)
      // エラーは記録するが処理は続行
    }

    // 投稿の削除（カスケード削除によりコメントや画像も削除される）
    try {
      console.log('2. 投稿削除開始')
      const { error: postsError } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('author_id', userId)

      if (postsError) {
        console.error('投稿削除エラー:', postsError)
      } else {
        console.log('投稿削除成功')
      }
    } catch (error) {
      console.error('投稿削除例外:', error)
      // エラーは記録するが処理は続行
    }

    // いいねの削除
    try {
      console.log('3. いいね削除開始')
      await Promise.all([
        supabaseAdmin.from('post_likes').delete().eq('user_id', userId),
        supabaseAdmin.from('comment_likes').delete().eq('user_id', userId)
      ])
      console.log('いいね削除成功')
    } catch (error) {
      console.error('いいね削除例外:', error)
      // エラーは記録するが処理は続行
    }

    // カテゴリの処理
    try {
      console.log('4. カテゴリ処理開始')
      
      // ユーザーが作成したカテゴリを取得
      const { data: userCategories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('creator_id', userId);
      
      if (categoriesError) {
        console.error('カテゴリ取得エラー:', categoriesError);
        // エラーは記録するが処理は続行
      } else if (userCategories && userCategories.length > 0) {
        console.log(`ユーザー作成カテゴリ: ${userCategories.length}件`);
        
        // 他のユーザーが使用しているカテゴリを特定
        const categoryIds = userCategories.map(c => c.id);
        
        // 他のユーザーの投稿で使われているカテゴリを特定
        const { data: sharedCategoryData, error: sharedError } = await supabaseAdmin
          .from('post_categories')
          .select('category_id, posts!inner(author_id)')
          .in('category_id', categoryIds)
          .neq('posts.author_id', userId);
          
        if (sharedError) {
          console.error('共有カテゴリ特定エラー:', sharedError);
        } else {
          // 他のユーザーが使用しているカテゴリIDの配列を作成
          const sharedCategoryIds = [...new Set(
            (sharedCategoryData || []).map(item => item.category_id)
          )];
          
          if (sharedCategoryIds.length > 0) {
            console.log(`他ユーザー使用カテゴリ: ${sharedCategoryIds.length}件`);
            
            // 他のユーザーが使用しているカテゴリをシステムユーザーに移管
            const { error: updateError } = await supabaseAdmin
              .from('categories')
              .update({ creator_id: SYSTEM_USER_ID })
              .in('id', sharedCategoryIds);
              
            if (updateError) {
              console.error('カテゴリ移管エラー:', updateError);
            } else {
              console.log(`システムユーザーへ移管: ${sharedCategoryIds.length}件`);
            }
          }
          
          // 他のユーザーが使用していないカテゴリを特定して削除
          const unusedCategoryIds = categoryIds.filter(id => !sharedCategoryIds.includes(id));
          
          if (unusedCategoryIds.length > 0) {
            console.log(`未共有カテゴリ: ${unusedCategoryIds.length}件`);
            
            // 未共有カテゴリを削除
            const { error: deleteError } = await supabaseAdmin
              .from('categories')
              .delete()
              .in('id', unusedCategoryIds);
              
            if (deleteError) {
              console.error('未共有カテゴリ削除エラー:', deleteError);
            } else {
              console.log(`未共有カテゴリ削除完了: ${unusedCategoryIds.length}件`);
            }
          }
        }
      } else {
        console.log('ユーザー作成カテゴリなし');
      }
    } catch (error) {
      console.error('カテゴリ処理例外:', error);
      // エラーは記録するが処理は続行
    }

    // プロフィール削除（最後にプロフィールを削除）
    try {
      console.log('5. プロフィール削除開始')
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('プロフィール削除エラー:', profileError)
        // エラーは記録するが処理は続行
      } else {
        console.log('プロフィール削除成功')
      }
    } catch (error) {
      console.error('プロフィール削除例外:', error)
      // エラーは記録するが処理は続行
    }

    // 認証ユーザーの削除
    try {
      console.log('6. ユーザー削除開始')
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

      if (deleteUserError) {
        console.error('ユーザー削除APIエラー:', deleteUserError)
        throw deleteUserError
      }
      
      console.log('ユーザー削除成功')
    } catch (authDeleteError) {
      console.error('ユーザー削除例外:', authDeleteError)
      throw authDeleteError
    }

    console.log('削除処理完了')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('エッジ関数全体のエラー:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || '不明なエラー') }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 