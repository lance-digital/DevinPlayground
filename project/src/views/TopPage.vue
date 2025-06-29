<!-- トップページコンポーネント - ソーシャルブログのメインページ -->
<template>
  <div class="min-h-screen bg-background relative overflow-x-hidden">
    <!-- 背景グラデーション -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-surface-variant/20 pointer-events-none"></div>
    <div class="absolute top-0 left-0 w-full h-full bg-gradient-radial-1 pointer-events-none"></div>
    <div class="absolute top-0 left-0 w-full h-full bg-gradient-radial-2 pointer-events-none"></div>
    
    <div class="juna-container relative z-10">
      <!-- ヒーローセクション -->
      <section class="juna-hero">
        <div class="juna-hero-content">
          <h1 
            data-testid="トップページ-タイトル" 
            class="juna-hero-title"
          >
            <span>Juna</span> Supabase
          </h1>
          
          <p class="juna-hero-subtitle">
            アイデアを共有し、知識を深め、創造的なコミュニティとつながるためのプラットフォーム。
            あなたの声を世界に届ける新しい体験を始めましょう。
          </p>
          
          <!-- ログイン状態に応じたアクションボタン -->
          <div class="juna-hero-cta">
            <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4">
              <button 
                data-testid="トップページ-ログインボタン"
                @click="navigateToLogin"
                class="juna-btn juna-btn-primary"
              >
                ログイン
              </button>
              
              <button 
                data-testid="トップページ-登録ボタン"
                @click="navigateToRegister"
                class="juna-btn juna-btn-outline"
              >
                新規登録
              </button>
            </div>
            
            <div v-else class="flex flex-col sm:flex-row gap-4">
              <button 
                @click="navigateToCreatePost"
                class="juna-btn juna-btn-primary"
                data-testid="新規投稿ボタン"
              >
                新規投稿
              </button>
              <button 
                @click="navigateToPostList"
                class="juna-btn juna-btn-outline"
                data-testid="投稿一覧ボタン"
              >
                投稿一覧
              </button>
            </div>
          </div>
          
          <div v-if="isAuthenticated" class="mt-8">
            <div class="juna-welcome-card">
              <p class="text-heading text-xl font-medium">
                おかえりなさい、{{ profile?.nickname || 'ユーザー' }}さん
              </p>
            </div>
          </div>
        </div>
        
        <div class="juna-hero-image">
          <div class="juna-hero-blur"></div>
          <div class="juna-grid">
            <div class="juna-demo-card">
              <div class="juna-card-content">
                <p class="juna-card-text">
                  美しいリッチテキストエディターで記事を作成し、読者との深いつながりを築きましょう。
                </p>
                <div class="juna-tags">
                  <span class="juna-tag">ブログ</span>
                  <span class="juna-tag">創作</span>
                </div>
              </div>
            </div>
            
            <div class="juna-demo-card">
              <div class="juna-card-content">
                <p class="juna-card-text">
                  コミュニティとの活発な交流を通じて、新しいアイデアや視点を発見できます。
                </p>
                <div class="juna-tags">
                  <span class="juna-tag">コミュニティ</span>
                  <span class="juna-tag">交流</span>
                </div>
              </div>
            </div>
            
            <div class="juna-demo-card">
              <div class="juna-card-content">
                <p class="juna-card-text">
                  カテゴリとタグで記事を整理し、読者が求める情報へ簡単にアクセスできます。
                </p>
                <div class="juna-tags">
                  <span class="juna-tag">整理</span>
                  <span class="juna-tag">検索</span>
                </div>
              </div>
            </div>
            
            <div class="juna-demo-card">
              <div class="juna-card-content">
                <p class="juna-card-text">
                  レスポンシブデザインで、どのデバイスからでも快適に利用できます。
                </p>
                <div class="juna-tags">
                  <span class="juna-tag">モバイル</span>
                  <span class="juna-tag">レスポンシブ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 特徴セクション -->
      <section class="juna-features">
        <div class="juna-section-header">
          <h2 class="juna-section-title">Junaでできること</h2>
          <p class="juna-section-subtitle">
            アイデアを共有し、知識を深め、創造的なコミュニティとつながるためのプラットフォーム
          </p>
        </div>
        
        <div class="juna-features-grid">
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-pen"></div>
            </div>
            <h3 class="juna-feature-title">美しいブログ作成</h3>
            <p class="juna-feature-desc">
              リッチテキストエディターとカスタマイズ可能なテーマで、あなたのストーリーを美しく表現できます。
            </p>
          </div>
          
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-users"></div>
            </div>
            <h3 class="juna-feature-title">コミュニティ参加</h3>
            <p class="juna-feature-desc">
              興味のあるトピックのコミュニティに参加し、同じ志を持つ仲間と交流しましょう。
            </p>
          </div>
          
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-heart"></div>
            </div>
            <h3 class="juna-feature-title">エンゲージメント</h3>
            <p class="juna-feature-desc">
              いいね、コメント、シェア機能で、コンテンツへの反応を簡単に表現できます。
            </p>
          </div>
          
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-tag"></div>
            </div>
            <h3 class="juna-feature-title">タグディスカバリー</h3>
            <p class="juna-feature-desc">
              タグシステムで興味のあるトピックを簡単に発見し、フォローすることができます。
            </p>
          </div>
          
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-bell"></div>
            </div>
            <h3 class="juna-feature-title">パーソナライズ通知</h3>
            <p class="juna-feature-desc">
              フォローしているトピックや作者の最新情報を、カスタマイズ可能な通知で受け取れます。
            </p>
          </div>
          
          <div class="juna-feature-card">
            <div class="juna-feature-icon">
              <div class="juna-icon-mobile"></div>
            </div>
            <h3 class="juna-feature-title">マルチプラットフォーム</h3>
            <p class="juna-feature-desc">
              どこでもアクセス可能なレスポンシブデザイン。デスクトップでもモバイルでも快適に利用できます。
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isAuthenticated, profile, initAuth } = useAuth()

// ナビゲーション関数
const navigateToLogin = () => {
  router.push('/login')
}

const navigateToRegister = () => {
  router.push('/register')
}

const navigateToCreatePost = () => {
  router.push('/posts/create')
}

const navigateToPostList = () => {
  router.push('/posts')
}

onMounted(async () => {
  await initAuth()
})
</script>

<style scoped>
/* Junaスタイル - 提供されたデザインを基に実装 */
.juna-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* 背景グラデーション */
.bg-gradient-radial-1 {
  background: radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 30%);
}

.bg-gradient-radial-2 {
  background: radial-gradient(circle at 90% 80%, rgba(190, 100, 210, 0.1) 0%, transparent 40%);
}

/* ヒーローセクション */
.juna-hero {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 5rem 0;
}

.juna-hero-content {
  flex: 1;
}

.juna-hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: rgb(var(--color-heading));
}

.juna-hero-title span {
  background: linear-gradient(90deg, rgb(var(--color-primary)), rgba(190, 100, 210, 1));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.juna-hero-subtitle {
  font-size: 1.25rem;
  color: rgb(var(--color-text-muted));
  margin-bottom: 2rem;
  line-height: 1.6;
  max-width: 600px;
}

.juna-hero-cta {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.juna-hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  position: relative;
}

.juna-hero-blur {
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--color-primary), 0.2) 0%, transparent 70%);
  filter: blur(60px);
  z-index: -1;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.juna-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 500px;
}

.juna-demo-card {
  background: rgba(var(--color-surface), 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--color-border), 0.3);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.juna-demo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(var(--color-primary), 0.4);
}

.juna-card-content {
  padding: 1.5rem;
}

.juna-card-text {
  color: rgb(var(--color-text));
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.juna-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.juna-tag {
  background: rgba(var(--color-surface-variant), 1);
  color: rgb(var(--color-primary-light));
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.juna-welcome-card {
  background: rgba(var(--color-surface), 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--color-border), 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  max-width: 400px;
}

/* ボタンスタイル */
.juna-btn {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.juna-btn-primary {
  background: linear-gradient(135deg, rgb(var(--color-primary)), rgba(124, 58, 237, 1));
  color: white;
  box-shadow: 0 4px 15px rgba(var(--color-primary), 0.3);
}

.juna-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(var(--color-primary), 0.4);
}

.juna-btn-outline {
  background: transparent;
  color: rgb(var(--color-primary));
  border: 2px solid rgb(var(--color-primary));
}

.juna-btn-outline:hover {
  background: rgba(var(--color-primary), 0.1);
  transform: translateY(-2px);
}

/* 特徴セクション */
.juna-features {
  padding: 6rem 0;
}

.juna-section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
}

.juna-section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(var(--color-heading));
  margin-bottom: 1rem;
}

.juna-section-subtitle {
  font-size: 1.25rem;
  color: rgb(var(--color-text-muted));
  line-height: 1.6;
}

.juna-features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.juna-feature-card {
  background: rgba(var(--color-surface), 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--color-border), 0.3);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.juna-feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border-color: rgba(var(--color-primary), 0.4);
}

.juna-feature-icon {
  width: 80px;
  height: 80px;
  background: rgba(var(--color-surface-variant), 1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  position: relative;
}

.juna-feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(var(--color-heading));
  margin-bottom: 1rem;
}

.juna-feature-desc {
  color: rgb(var(--color-text-muted));
  line-height: 1.6;
}

/* アイコンスタイル */
.juna-icon-pen,
.juna-icon-users,
.juna-icon-heart,
.juna-icon-tag,
.juna-icon-bell,
.juna-icon-mobile {
  width: 40px;
  height: 40px;
  background: rgb(var(--color-primary));
  border-radius: 8px;
}

/* レスポンシブデザイン */
@media (max-width: 992px) {
  .juna-hero {
    flex-direction: column;
    text-align: center;
  }
  
  .juna-hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .juna-features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .juna-hero-title {
    font-size: 2.5rem;
  }
  
  .juna-grid {
    grid-template-columns: 1fr;
  }
  
  .juna-features-grid {
    grid-template-columns: 1fr;
  }
  
  .juna-hero-cta .flex {
    flex-direction: column;
  }
}
</style>
