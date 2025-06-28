import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'

// 存在するCSSファイルのみをインポート
import './assets/main.css'       // Tailwindとカスタムスタイルはすでにこのファイルに含まれています

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app') 