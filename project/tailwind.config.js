/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif']
      },
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-variant': 'rgb(var(--color-surface-variant) / <alpha-value>)',
        'surface-accent': 'rgb(var(--color-surface-accent) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        heading: 'rgb(var(--color-heading) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-white': 'rgb(var(--color-text-white) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-light': 'rgb(var(--color-secondary-light) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        'error-dark': 'rgb(var(--color-error-dark) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        'success-dark': 'rgb(var(--color-success-dark) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        accent1: 'rgb(var(--color-accent1) / <alpha-value>)',
        accent2: 'rgb(var(--color-accent2) / <alpha-value>)',
        accent3: 'rgb(var(--color-accent3) / <alpha-value>)',
      }
    }
  },
  plugins: [
    function({ addBase, addComponents }) {
      addBase({
        ':root': {
          /* プライマリカラー - アプリのメインカラー（バイオレット/パープル） */
          '--color-primary': '139 92 246',
          /* プライマリカラーの暗い色合い - ホバー状態などに使用 */
          '--color-primary-dark': '124 58 237',
          /* プライマリカラーの明るい色合い - 補助的な要素に使用 */
          '--color-primary-light': '167 139 250',
          
          /* 背景色 - アプリの基本背景色（バイオレット系の深い色） */
          '--color-background': '18 15 30',
          /* サーフェスカラー - カード、パネルなどの背景色 */
          '--color-surface': '25 20 40',
          /* サーフェスバリアントカラー - サーフェスの代替色 */
          '--color-surface-variant': '30 25 50',
          /* サーフェスアクセントカラー - 強調されたサーフェス要素 */
          '--color-surface-accent': '40 30 65',
          
          /* テキストカラー - 標準テキストの色 */
          '--color-text': '230 220 245',
          /* 見出しカラー - 見出しテキストの色 */
          '--color-heading': '255 245 255',
          /* 控えめなテキストカラー - 二次的なテキスト情報 */
          '--color-text-muted': '160 150 190',
          /* 白テキストカラー - 暗い背景上のテキスト */
          '--color-text-white': '255 255 255',
          
          /* ボーダーカラー - 標準的な境界線の色 */
          '--color-border': '55 45 85',
          /* 明るいボーダーカラー - より軽い境界線の色 */
          '--color-border-light': '75 65 110',
          
          /* セカンダリカラー - 二次的な要素の色（青紫） */
          '--color-secondary': '140 130 220',
          /* 明るいセカンダリカラー - 明るい二次的要素 */
          '--color-secondary-light': '185 180 230',
          
          /* エラーカラー - エラーメッセージや警告表示に使用 */
          '--color-error': '245 95 90',
          /* 暗いエラーカラー - エラーボタンやアクションに使用 */
          '--color-error-dark': '220 60 50',
          
          /* 成功カラー - 成功メッセージや確認表示に使用 */
          '--color-success': '75 210 115',
          /* 暗い成功カラー - 成功ボタンやアクションに使用 */
          '--color-success-dark': '35 180 80',
          
          /* 警告カラー - 注意や警告の表示に使用 */
          '--color-warning': '255 190 60',
          
          /* 情報カラー - 情報メッセージに使用 */
          '--color-info': '65 145 255',
          
          /* アクセントカラー1 - 補足的な強調色1（鮮やかなバイオレット） */
          '--color-accent1': '190 100 210',
          /* アクセントカラー2 - 補足的な強調色2（オレンジ系） */
          '--color-accent2': '255 145 90',
          /* アクセントカラー3 - 補足的な強調色3（明るい青） */
          '--color-accent3': '90 205 220',
        }
      });
      
      addComponents({
        '.glass-card': {
          '@apply rounded-lg border border-border-light/60 shadow p-3 bg-surface/80 backdrop-blur-md shadow-background/30': {},
        },
        
        '.btn': {
          '@apply rounded font-medium transition-all px-3 py-1.5 text-sm min-h-[44px] flex items-center justify-center gap-2': {},
        },
        
        '.btn-primary': {
          '@apply bg-primary/80 text-text-white shadow-primary-dark/20 border border-primary-dark/20 hover:bg-primary hover:shadow-lg hover:shadow-primary-dark/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-secondary': {
          '@apply bg-secondary/70 text-text-white shadow-secondary/20 border border-secondary/20 hover:bg-secondary hover:shadow-lg hover:shadow-secondary/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-error': {
          '@apply bg-error/80 text-text-white shadow-error-dark/20 border border-error-dark/20 hover:bg-error hover:shadow-lg hover:shadow-error-dark/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-success': {
          '@apply bg-success/80 text-text-white shadow-success-dark/20 border border-success-dark/20 hover:bg-success hover:shadow-lg hover:shadow-success-dark/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-warning': {
          '@apply bg-warning/80 text-text-white shadow-warning/20 border border-warning/20 hover:bg-warning hover:shadow-lg hover:shadow-warning/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-info': {
          '@apply bg-info/80 text-text-white shadow-info/20 border border-info/20 hover:bg-info hover:shadow-lg hover:shadow-info/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-accent1': {
          '@apply bg-accent1/80 text-text-white shadow-accent1/20 border border-accent1/20 hover:bg-accent1 hover:shadow-lg hover:shadow-accent1/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-accent2': {
          '@apply bg-accent2/80 text-text-white shadow-accent2/20 border border-accent2/20 hover:bg-accent2 hover:shadow-lg hover:shadow-accent2/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-accent3': {
          '@apply bg-accent3/80 text-text-white shadow-accent3/20 border border-accent3/20 hover:bg-accent3 hover:shadow-lg hover:shadow-accent3/30 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-outline-primary': {
          '@apply bg-transparent border border-primary/70 text-primary/90 hover:bg-primary/20 hover:border-primary hover:text-primary disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-outline-secondary': {
          '@apply bg-transparent border border-secondary/70 text-secondary/90 hover:bg-secondary/20 hover:border-secondary hover:text-secondary disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-outline-error': {
          '@apply bg-transparent border border-error/70 text-error/90 hover:bg-error/20 hover:border-error hover:text-error disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-outline-success': {
          '@apply bg-transparent border border-success/70 text-success/90 hover:bg-success/20 hover:border-success hover:text-success disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-outline-warning': {
          '@apply bg-transparent border border-warning/70 text-warning/90 hover:bg-warning/20 hover:border-warning hover:text-warning disabled:opacity-70 disabled:cursor-not-allowed': {},
        },

        '.btn-outline-info': {
          '@apply bg-transparent border border-info/70 text-info/90 hover:bg-info/20 hover:border-info hover:text-info disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-outline-accent1': {
          '@apply bg-transparent border border-accent1/70 text-accent1/90 hover:bg-accent1/20 hover:border-accent1 hover:text-accent1 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-outline-accent2': {
          '@apply bg-transparent border border-accent2/70 text-accent2/90 hover:bg-accent2/20 hover:border-accent2 hover:text-accent2 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-outline-accent3': {
          '@apply bg-transparent border border-accent3/70 text-accent3/90 hover:bg-accent3/20 hover:border-accent3 hover:text-accent3 disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-ghost': {
          '@apply bg-transparent text-text-white hover:bg-primary/20 hover:text-text-white disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-link': {
          '@apply bg-transparent text-primary/90 hover:text-primary p-0 min-h-0 h-auto disabled:opacity-70 disabled:cursor-not-allowed': {},
        },
        
        '.btn-sm': {
          '@apply px-2 py-1 text-xs min-h-[32px]': {},
        },
        
        '.btn-lg': {
          '@apply px-4 py-2 text-base min-h-[52px]': {},
        },
        
        '.btn-icon': {
          '@apply p-2 aspect-square flex items-center justify-center': {},
        },
        
        '.btn-icon-primary': {
          '@apply btn-icon text-primary/90 hover:bg-primary/20 hover:text-primary rounded': {},
        },
        
        '.btn-icon-secondary': {
          '@apply btn-icon text-secondary/90 hover:bg-secondary/20 hover:text-secondary rounded': {},
        },
        
        '.btn-icon-text': {
          '@apply btn-icon text-text/90 hover:bg-surface-accent/40 hover:text-text rounded': {},
        },
        
        '.btn-icon-error': {
          '@apply btn-icon text-error/90 hover:bg-error/20 hover:text-error rounded': {},
        },
        
        '.btn-icon-success': {
          '@apply btn-icon text-success/90 hover:bg-success/20 hover:text-success rounded': {},
        },
        
        '.btn-icon-warning': {
          '@apply btn-icon text-warning/90 hover:bg-warning/20 hover:text-warning rounded': {},
        },
        
        '.btn-icon-info': {
          '@apply btn-icon text-info/90 hover:bg-info/20 hover:text-info rounded': {},
        },
        
        '.btn-icon-sm': {
          '@apply p-1.5 text-sm': {},
        },
        
        '.btn-icon-lg': {
          '@apply p-2.5 text-lg': {},
        },
        
        '.btn-icon-accent1': {
          '@apply btn-icon text-accent1/90 hover:bg-accent1/20 hover:text-accent1 rounded': {},
        },
        
        '.btn-icon-accent2': {
          '@apply btn-icon text-accent2/90 hover:bg-accent2/20 hover:text-accent2 rounded': {},
        },
        
        '.btn-icon-accent3': {
          '@apply btn-icon text-accent3/90 hover:bg-accent3/20 hover:text-accent3 rounded': {},
        },
      });
    }
  ]
}