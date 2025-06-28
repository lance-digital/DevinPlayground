# セットアップ

## デプロイ情報
- [Netlify管理パネル](https://app.netlify.com/sites/juna-supabase/overview)
- [デプロイされたサイト](https://juna-supabase.netlify.app/)

## 依存関係をインストール
```bash
cd project
npm install
```

## supabaseで新しいプロジェクトを作成
1. 「.env.example」から「.env」ファイルを作成
2. supabaseから値を取得し「.env」ファイルを編集

## supabaseにDBをマイグレーション
```bash
cd project
supabase link
supabase db push --include-all
```

## supabaseにfunctionsをデプロイ
```bash
# カスタムエントリーポイントファイル名を指定してデプロイ
supabase functions deploy register-user
supabase functions deploy login-with-account
supabase functions deploy delete-user
```

## ローカルサーバーを起動
```bash
cd project
npm run dev
```


## 機能改善

- リアルタイム購読の使用
- WebPush通知の実装
- 管理者ページの実装
- フォローの概念
- 通知機能の集約
    - @useNotification.ts useNotification.tsを使用してユーザーに対する通知を一元化してください。入力フィールド固有の物などはそのままにしてください。

- リンクの更新
    - @index.ts index.tsに記載されているページ以外に遷移していませんか？

- 画像対応フォーマットの拡張
    - @useImageUpload.ts useImageUpload.tsで下記のフォーマットに対応してください。 
    ```markdown
        # 対応フォーマット一覧（全27種類）

        1. original（オリジナル形式を維持）
        2. webp（WebP）
        3. jpeg/jpg（JPEG）
        4. png（PNG）
        5. gif（GIF）
        6. bmp（BMP）
        7. tiff/tif（TIFF）
        8. avif（AVIF）
        9. heic（HEIC - Apple）
        10. heif（HEIF - 高効率画像形式）
        11. svg（SVG - ベクター画像）
        12. ico（アイコン）
        13. apng（アニメーションPNG）
        14. jxl（JPEG XL）
        15. jp2（JPEG 2000）
        16. jpx（JPEG 2000 Part-2）
        17. j2k（JPEG 2000 CodeStream）
        18. jxr（JPEG XR）
        19. wdp（Windows Digital Photo - JPEG XRの別名）
        20. dng（Adobe Digital Negative - RAW）
        21. arw（Sony Alpha RAW）
        22. cr2/cr3（Canon RAW）
        23. nef（Nikon Electronic Format - RAW）
        24. orf（Olympus RAW Format）
        25. raf（Fuji RAW Format）
        26. rw2（Panasonic RAW）
        27. pef（Pentax Electronic Format）
        28. srw（Samsung RAW）
        29. raw（汎用RAW形式）
    ```


## よく使うプロンプト


### DB関連

#### supabaseスキーマの把握
@20250320142446_initial_schema.sql supabase スキーマを日本語検索用の設定、ユーティリティ関数、ストレージバケット設定、ストレージポリシー設定、セキュリティ関数、カラムを含むテーブル詳細、RLS、ポリシー、トリガー、インデックス、タイプ、トリガー関数、Realtimeサブスクリプション設定などを含めて、完全に把握してください。スキーマは修正しないでください。


### デザイン関連

#### カラーの統一とモバイルファースト対応
@tailwind.config.js コンテキストに追加したコンポーネントのカラー使用箇所でカラーをハードコーディングしている箇所や、tailwind.config.jsの「colors:」を使用していない箇所、tailwind.cssのユーティリティカラークラスを使用している箇所があれば修正してください。カラーを使用する際は全てtailwind.config.jsのクラスを使用してください。クラスの記載順は「コンポーネント内に定義されたtailwindcss以外のクラス名 + モバイルファーストの原則に基づき、各プロパティカテゴリ（ポジション、ディスプレイ、フレックス、グリッド、幅、高さ、マージン、パディング、ボーダー、角丸、背景、テキスト、色、タイポグラフィ、間隔、効果、トランジション、アニメーション、ホバー状態、フォーカス、アクセシビリティ）ごとにグループ化し、各グループ内では基本スタイル（プレフィックスなし）を最小画面サイズ（モバイル）向けに定義してから、レスポンシブバリアント（sm:、md:、lg:、xl:、2xl:）を画面サイズの小さい順に並べる。」でお願いします。機能は絶対に変更しないでください。tailwind.config.jsは修正しないで下さい。


### 機能関連

#### アプリ骨格
@Notifications.vue @Navbar.vue @Footer.vue @auth.ts @App.vue @useNotification.ts @main.ts @index.html @tailwind.config.js @router.ts @storage.ts @supabase.ts アプリケーションの骨格です。どのようになっていますか？説明してください。

#### 認証ページ
@AuthPage.vue @useNotification.ts @auth.ts @router.ts @register-user-function.ts @login-with-account-function.ts @delete-user-function.ts @tailwind.config.js @storage.ts @supabase.ts これは認証ページです。どのようになっていますか？説明してください。

#### ダッシュボードページ
@DashboardPage.vue @useNotification.ts @auth.ts @DashboardPostsList.vue @DashboardDraftsList.vue @DashboardCommentsList.vue @DashboardLikesList.vue @DashboardStatistics.vue @router.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはダッシュボードページです。どのようになっていますか？説明してください。

#### ホームページ
@HomePage.vue @useNotification.ts @supabase.ts @PostCard.vue @router.ts  @tailwind.config.js @storage.ts @auth.ts これはホームページです。どのようになっていますか？説明してください。

#### NotFoundページ
@NotFoundPage.vue @useNotification.ts @router.ts @tailwind.config.js @storage.ts @supabase.ts @auth.ts これはNotFoundページです。どのようになっていますか？説明してください。

#### 投稿詳細ページ
@PostDetailPage.vue @PostCard.vue @useNotification.ts @supabase.ts @auth.ts @RichTextContent.vue @CommentSystem.vue @CommentItem.vue @storage.ts @router.ts @tailwind.config.js これは投稿詳細ページです。どのようになっていますか？説明してください。

#### 投稿作成、編集ページ
@PostEditorPage.vue @useNotification.ts @supabase.ts @auth.ts @RichTextEditor.vue @EditorToolbar.vue @EditorLinkMenu.vue @CategorySelector.vue @EyecatchUploader.vue @useImageUpload.ts @useImageCleanup.ts @storage.ts @router.ts @tailwind.config.js @storage.ts これは投稿作成、編集ページです。どのようになっていますか？説明してください。

#### 投稿一覧ページ
@PostsPage.vue @useNotification.ts @supabase.ts @PostCard.vue @router.ts @tailwind.config.js @storage.ts @auth.ts これは投稿一覧ページです。どのようになっていますか？説明してください。

#### プロフィール編集ページ
@ProfileEditPage.vue @useNotification.ts @supabase.ts @auth.ts @useImageUpload.ts @storage.ts @router.ts @tailwind.config.js これはプロフィール編集ページです。どのようになっていますか？説明してください。

#### プロフィールページ
@ProfilePage.vue @useNotification.ts @supabase.ts @auth.ts @storage.ts @PostCard.vue @tailwind.config.js @router.ts これはプロフィールページです。どのようになっていますか？説明してください。

#### 一時的
各ファイルでsupabase.tsとstorage.ts、auth.tsはどのように使用されていますか？