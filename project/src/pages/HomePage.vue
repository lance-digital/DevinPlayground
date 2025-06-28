<template>
  <div>
    <!-- ヒーローセクション - より魅力的に -->
    <section class="glass-card relative mb-10 overflow-hidden rounded-2xl p-8 md:p-12">
      <!-- 装飾的な背景要素 -->
      <div class="pointer-events-none absolute top-0 right-0 h-full w-2/3 opacity-10">
        <svg class="h-full w-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" class="text-primary-light" d="M44.9,-76.2C58.3,-69.3,69.8,-58.3,78.1,-45C86.5,-31.7,91.8,-15.8,90.9,-0.5C90.1,14.8,83,29.7,74.4,43.4C65.8,57.2,55.6,69.9,42.2,77.8C28.8,85.7,14.4,88.7,-0.3,89.2C-15,89.7,-30.1,87.6,-41.9,79.5C-53.8,71.4,-62.4,57.1,-70.6,42.8C-78.8,28.5,-86.5,14.2,-88.5,-1.1C-90.5,-16.5,-86.8,-33,-78.2,-46.4C-69.5,-59.8,-55.9,-70.1,-41.6,-76.5C-27.3,-82.9,-13.6,-85.5,0.9,-87C15.4,-88.5,31.5,-89,44.9,-76.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <h1 class="mb-6 text-4xl font-bold text-primary-light md:text-6xl">見えない障害と共に生きる</h1>
        <p class="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-text md:text-xl">経験を共有し、互いに学び、支え合うコミュニティへようこそ</p>
        <div class="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <router-link 
            to="/editor"
            class="btn btn-primary rounded-full px-8"
          >
            <PhPlusCircle :size="20" class="mr-2" weight="bold" />
            <span class="inline-block align-middle">投稿を始める</span>
          </router-link>
          
          <router-link 
            to="/posts"
            class="btn btn-outline-primary rounded-full px-8"
          >
            <PhInfo :size="20" class="mr-2" weight="bold" />
            <span class="inline-block align-middle">投稿一覧</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Aboutセクション（新規追加） -->
    <section class="mb-16">
      <div class="mb-8">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          当サイトについて
        </h2>
      </div>
      
      <div class="glass-card p-6 md:p-8">
        <div class="mx-auto max-w-4xl">
          <p class="mb-6 text-lg leading-relaxed text-text">
            「見えない障害と共に生きる」は、身体的な症状が外見からはわかりにくい障害を持つ方々の経験を共有し、
            互いに支え合うためのコミュニティプラットフォームです。
          </p>
          
          <div class="my-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <!-- 特徴1 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhBookOpen :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">経験の共有</h3>
              <p class="text-text">日常生活での工夫や対処法、成功体験や困難を乗り越えた経験を共有できます。</p>
            </div>
            
            <!-- 特徴2 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhUsersThree :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">コミュニティ</h3>
              <p class="text-text">同じ障害や似た経験を持つ人とつながり、理解し合える関係を築けます。</p>
            </div>
            
            <!-- 特徴3 -->
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary bg-opacity-20">
                <PhShieldStar :size="32" weight="duotone" class="text-primary-light" />
              </div>
              <h3 class="mb-2 text-xl font-semibold text-heading">安心できる場所</h3>
              <p class="text-text">理解されにくい障害や症状について偏見なく話せる安全な環境を提供します。</p>
            </div>
          </div>
          
          <div class="mb-8 rounded-lg border border-primary border-opacity-20 bg-primary bg-opacity-10 p-6">
            <h3 class="mb-3 text-xl font-semibold text-primary-light">対象となる障害・症状</h3>
            <ul class="grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-3">
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>発達障害（ASD、ADHD、LD等）
              </li>
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>精神障害（うつ病、統合失調症等）
              </li>
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>慢性疲労症候群
              </li>
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>線維筋痛症
              </li>
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>内部障害
              </li>
              <li class="flex items-center text-text-white">
                <div class="mr-2 h-3 w-3 min-w-[0.75rem] min-h-[0.75rem] rounded-full bg-primary"></div>その他の見えない障害
              </li>
            </ul>
          </div>
          
          <div class="text-center">
            <p class="mb-6 text-text">あなたの経験は、誰かの助けになります。<br>このコミュニティに参加して、あなたの物語を共有しませんか？</p>
            <router-link 
              to="/editor" 
              class="btn btn-primary rounded-full px-6"
            >
              <PhPencilSimple :size="20" class="mr-2" weight="bold" />
              今すぐ投稿を始める
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 注目の投稿 -->
    <section class="mb-16">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          注目の投稿
        </h2>
        <router-link to="/posts?sort=views.desc" class="flex items-center text-primary-light hover:underline">
          すべて見る
          <PhArrowRight :size="20" class="ml-1" weight="bold" />
        </router-link>
      </div>
      
      <!-- ローディング状態 -->
      <div v-if="loading" class="flex justify-center py-8">
        <PhCircleNotch :size="40" class="animate-spin text-primary" weight="bold" />
      </div>
      
      <!-- 投稿の表示 -->
      <div v-else>
        <div v-if="featuredPosts.length > 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PostCard 
            v-for="post in featuredPosts" 
            :key="post.id" 
            :post="post"
          />
        </div>
        <div v-else class="glass-card p-6 text-center">
          <p class="text-text-muted">まだ投稿はありません。</p>
        </div>
      </div>
    </section>
    
    <!-- 最新の投稿 -->
    <section class="mb-10">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          最新の投稿
        </h2>
        <router-link to="/posts?sort=created_at.desc" class="flex items-center text-primary-light hover:underline">
          すべて見る
          <PhArrowRight :size="20" class="ml-1" weight="bold" />
        </router-link>
      </div>
      
      <div v-if="recentPosts.length > 0" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <PostCard 
          v-for="post in recentPosts" 
          :key="post.id" 
          :post="post"
        />
      </div>
      <div v-else class="glass-card p-6 text-center">
        <p class="text-text-muted">まだ投稿はありません。</p>
      </div>
    </section>

    <!-- テキストスタイルガイド（新規追加） -->
    <section class="mb-16">
      <div class="mb-8">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          テキストスタイルガイド
        </h2>
      </div>
      
      <div class="glass-card p-6 md:p-8">
        <div class="mx-auto">
          <!-- テキストカラー -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">テキストカラー</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div class="flex flex-col">
                <p class="text-text">通常テキスト</p>
                <span class="text-xs text-text-muted">.text-text</span>
              </div>
              <div class="flex flex-col">
                <p class="text-heading">見出しテキスト</p>
                <span class="text-xs text-text-muted">.text-heading</span>
              </div>
              <div class="flex flex-col">
                <p class="text-text-muted">軽減テキスト</p>
                <span class="text-xs text-text-muted">.text-text-muted</span>
              </div>
              <div class="flex flex-col rounded bg-primary bg-opacity-30 p-2">
                <p class="text-text-white">白テキスト</p>
                <span class="text-xs text-text-white text-opacity-70">.text-text-white</span>
              </div>
            </div>
          </div>
          
          <!-- カラーテキストサンプル（新規追加） -->
          <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-primary">プライマリテキスト</h4>
              <span class="mt-2 text-xs text-text-muted">.text-primary</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-primary-light">プライマリライト</h4>
              <span class="mt-2 text-xs text-text-muted">.text-primary-light</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-primary-dark">プライマリダーク</h4>
              <span class="mt-2 text-xs text-text-muted">.text-primary-dark</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-secondary">セカンダリ</h4>
              <span class="mt-2 text-xs text-text-muted">.text-secondary</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-error">エラー</h4>
              <span class="mt-2 text-xs text-text-muted">.text-error</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-success">成功</h4>
              <span class="mt-2 text-xs text-text-muted">.text-success</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-warning">警告</h4>
              <span class="mt-2 text-xs text-text-muted">.text-warning</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-info">情報</h4>
              <span class="mt-2 text-xs text-text-muted">.text-info</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-accent1">アクセント1</h4>
              <span class="mt-2 text-xs text-text-muted">.text-accent1</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-accent2">アクセント2</h4>
              <span class="mt-2 text-xs text-text-muted">.text-accent2</span>
            </div>
            
            <div class="glass-card p-4">
              <h4 class="mb-2 font-medium text-accent3">アクセント3</h4>
              <span class="mt-2 text-xs text-text-muted">.text-accent3</span>
            </div>
          </div>
          
          <!-- フォントサイズ -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">フォントサイズ</h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div class="glass-card p-4">
                <p class="text-xs text-primary">テキスト XS - 小さなサイズのテキストは説明や注釈に適しています。</p>
                <span class="mt-2 text-xs text-text-muted">.text-xs</span>
              </div>
              <div class="glass-card p-4">
                <p class="text-sm text-info">テキスト SM - やや小さめのテキストは補足情報の表示に使われます。</p>
                <span class="mt-2 text-xs text-text-muted">.text-sm</span>
              </div>
              <div class="glass-card p-4">
                <p class="text-base text-secondary">テキスト BASE - 標準サイズは本文の表示に最適です。</p>
                <span class="mt-2 text-xs text-text-muted">.text-base</span>
              </div>
              <div class="glass-card p-4">
                <p class="text-lg text-success">テキスト LG - 少し大きめのテキストで重要な情報を強調できます。</p>
                <span class="mt-2 text-xs text-text-muted">.text-lg</span>
              </div>
              <div class="glass-card p-4">
                <p class="text-xl text-warning">テキスト XL - 小見出しや重要な要素に使用します。</p>
                <span class="mt-2 text-xs text-text-muted">.text-xl</span>
              </div>
              <div class="glass-card p-4">
                <p class="text-2xl text-accent2">テキスト 2XL - 見出しや特に目立たせたい要素に適しています。</p>
                <span class="mt-2 text-xs text-text-muted">.text-2xl</span>
              </div>
            </div>
          </div>
          
          <!-- フォントウェイト -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">フォントウェイト</h3>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div class="glass-card p-4">
                <p class="font-light text-accent1">軽量フォント - 繊細な印象を与えるフォントウェイトです。</p>
                <span class="mt-2 text-xs text-text-muted">.font-light</span>
              </div>
              <div class="glass-card p-4">
                <p class="font-normal text-info">通常フォント - 標準的な太さで読みやすさを重視します。</p>
                <span class="mt-2 text-xs text-text-muted">.font-normal</span>
              </div>
              <div class="glass-card p-4">
                <p class="font-medium text-primary">中太フォント - 少し強調したい場合に使用します。</p>
                <span class="mt-2 text-xs text-text-muted">.font-medium</span>
              </div>
              <div class="glass-card p-4">
                <p class="font-semibold text-accent3">半太フォント - 見出しや重要な項目に適しています。</p>
                <span class="mt-2 text-xs text-text-muted">.font-semibold</span>
              </div>
              <div class="glass-card p-4">
                <p class="font-bold text-success">太字フォント - 最も強調したい要素に使用します。</p>
                <span class="mt-2 text-xs text-text-muted">.font-bold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ボタンデモセクション（新規追加） -->
    <section class="mb-16">
      <div class="mb-8">
        <h2 class="flex items-center text-2xl font-bold text-heading md:text-3xl">
          <span class="mr-3 inline-block h-6 w-2 rounded-full bg-primary"></span>
          ボタンスタイルガイド
        </h2>
      </div>
      
      <div class="glass-card p-6 md:p-8">
        <div class="mx-auto">
          <!-- 標準ボタン -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">標準ボタン</h3>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col items-center">
                <button class="btn btn-primary">Primary</button>
                <span class="mt-2 text-xs text-text-muted">.btn-primary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-secondary">Secondary</button>
                <span class="mt-2 text-xs text-text-muted">.btn-secondary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-error">Error</button>
                <span class="mt-2 text-xs text-text-muted">.btn-error</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-success">Success</button>
                <span class="mt-2 text-xs text-text-muted">.btn-success</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-warning">Warning</button>
                <span class="mt-2 text-xs text-text-muted">.btn-warning</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-info">Info</button>
                <span class="mt-2 text-xs text-text-muted">.btn-info</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-accent1">Accent1</button>
                <span class="mt-2 text-xs text-text-muted">.btn-accent1</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-accent2">Accent2</button>
                <span class="mt-2 text-xs text-text-muted">.btn-accent2</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-accent3">Accent3</button>
                <span class="mt-2 text-xs text-text-muted">.btn-accent3</span>
              </div>
            </div>
          </div>
          
          <!-- アウトラインボタン -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">アウトラインボタン</h3>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-primary">Primary</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-primary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-secondary">Secondary</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-secondary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-error">Error</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-error</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-success">Success</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-success</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-warning">Warning</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-warning</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-info">Info</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-info</span>
              </div>
              <!-- アクセント系のアウトラインボタン - 新規追加 -->
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-accent1">Accent1</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-accent1</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-accent2">Accent2</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-accent2</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-accent3">Accent3</button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline-accent3</span>
              </div>
            </div>
          </div>
          
          <!-- 特殊ボタン -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">特殊ボタン</h3>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col items-center">
                <button class="btn btn-ghost">ゴーストボタン</button>
                <span class="mt-2 text-xs text-text-muted">.btn-ghost</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-link">リンクボタン</button>
                <span class="mt-2 text-xs text-text-muted">.btn-link</span>
              </div>
            </div>
          </div>
          
          <!-- サイズバリエーション -->
          <div class="mb-12">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">サイズバリエーション</h3>
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex flex-col items-center">
                <button class="btn btn-primary btn-sm">小</button>
                <span class="mt-2 text-xs text-text-muted">.btn-sm</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-primary">標準</button>
                <span class="mt-2 text-xs text-text-muted">.btn</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-primary btn-lg">大</button>
                <span class="mt-2 text-xs text-text-muted">.btn-lg</span>
              </div>
            </div>
          </div>
          
          <!-- アイコンボタン -->
          <div class="mb-6">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">アイコンボタン</h3>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col items-center">
                <button class="btn-icon-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-primary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-secondary</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-text">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-text</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-error">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-error</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-success">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-success</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-warning</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-info">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-info</span>
              </div>
              <!-- アイコンボタン - アクセント系を追加 -->
              <div class="flex flex-col items-center">
                <button class="btn-icon-accent1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-accent1</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-accent2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-accent2</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-accent3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-accent3</span>
              </div>
            </div>
          </div>
          
          <!-- アイコンボタンサイズ -->
          <div class="mb-6">
            <h3 class="mb-4 text-xl font-semibold text-primary-light">アイコンボタンサイズ</h3>
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex flex-col items-center">
                <button class="btn-icon-primary btn-icon-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-sm</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn-icon-primary btn-icon-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-icon-lg</span>
              </div>
            </div>
          </div>
          
          <!-- ボタン + アイコン -->
          <div>
            <h3 class="mb-4 text-xl font-semibold text-primary-light">ボタン + アイコン</h3>
            <div class="flex flex-wrap gap-4">
              <div class="flex flex-col items-center">
                <button class="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  アイコン付きボタン
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn + アイコン</span>
              </div>
              <div class="flex flex-col items-center">
                <button class="btn btn-outline-primary">
                  <span>アイコンの位置</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <span class="mt-2 text-xs text-text-muted">.btn-outline + アイコン</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import PostCard from '../components/common/PostCard.vue';
// Phosphor Iconsのインポート（修正版）
import { 
  PhPlusCircle, 
  PhInfo, 
  PhBookOpen, 
  PhUsersThree, 
  PhShieldStar, 
  PhPencilSimple, 
  PhArrowRight,
  PhCircleNotch
} from '@phosphor-icons/vue';

// 投稿の型定義を修正
interface Post {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  created_at: string;
  views?: number;
  profiles?: {
    nickname?: string | null;
    avatar_data?: string | null;
  };
  author_id?: string;
  like_count?: number;
  comment_count?: number;
}

// カテゴリの型定義
interface Category {
  id: number;
  name: string;
  description?: string | null;
}

// 状態変数
const featuredPosts = ref<Post[]>([]);
const recentPosts = ref<Post[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(true);
const error = ref('');

// 初期化
onMounted(async () => {
  try {
    // 並行してデータを取得する
    await Promise.all([
      fetchFeaturedPosts(),
      fetchRecentPosts(),
      fetchCategories()
    ]);
  } catch (err: any) {
    console.error('データ取得エラー:', err);
  } finally {
    loading.value = false;
  }
});

// 投稿の完全なデータを取得する共通関数 - パラメーターに型を追加
async function fetchCompletePostData(baseQuery: any) {
  const { data, error } = await baseQuery;
  
  if (error) throw error;
  
  // いいね数とコメント数を並行して取得して投稿データに追加
  return await Promise.all((data || []).map(async (post: any) => {
    // いいね数、コメント数、カテゴリを並行取得
    const [{ count: likeCount }, { count: commentCount }, { data: categoryData }] = await Promise.all([
      supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('post_categories').select('categories(id, name)').eq('post_id', post.id)
    ]);
    
    // カテゴリデータの整形 - 配列チェックを追加
    const categories = (categoryData || [])
      .filter(item => item.categories)
      .map(item => {
        // 配列かオブジェクトかをチェック
        const cat = Array.isArray(item.categories) 
          ? (item.categories.length > 0 ? item.categories[0] : { id: 0, name: '' })
          : item.categories;
          
        return {
          id: Number(cat.id),
          name: String(cat.name)
        };
      });
    
    return {
      ...post,
      like_count: likeCount || 0,
      comment_count: commentCount || 0,
      categories
    };
  }));
}

// 注目の投稿を取得（共通関数を使用）
async function fetchFeaturedPosts() {
  loading.value = true;
  
  try {
    const query = supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id(
          nickname, 
          avatar_data
        )
      `)
      .eq('published', true)
      .order('views', { ascending: false })
      .limit(6);
    
    featuredPosts.value = await fetchCompletePostData(query);
  } catch (err) {
    console.error('注目投稿取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

// 最新の投稿を取得（共通関数を使用）
async function fetchRecentPosts() {
  try {
    const query = supabase
      .from('posts')
      .select(`
        *,
        profiles:author_id(
          nickname, 
          avatar_data
        )
      `)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    recentPosts.value = await fetchCompletePostData(query);
  } catch (err) {
    console.error('最新投稿取得エラー:', err);
  }
}

// カテゴリを取得
async function fetchCategories() {
  try {
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (fetchError) throw fetchError;
    categories.value = data || [];
  } catch (err: any) {
    // すでにエラー状態の場合は上書きしない
    if (!error.value) {
      error.value = 'カテゴリの読み込みに失敗しました';
    }
  }
}
</script>