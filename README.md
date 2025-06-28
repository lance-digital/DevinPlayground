# セットアップ

## デプロイ情報
- [Netlify管理パネル](https://app.netlify.com/sites/juna-supabase/overview)
- [デプロイされたサイト](https://juna-supabase2.netlify.app/)

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
