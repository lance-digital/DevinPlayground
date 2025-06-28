<template>
  <div class="fixed bottom-4 right-4 z-50 max-w-md space-y-2">
    <transition-group 
      enter-active-class="transition duration-300 ease-out" 
      enter-from-class="opacity-0 translate-x-8" 
      leave-active-class="transition duration-300 ease-in" 
      leave-to-class="opacity-0 translate-x-8"
    >
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="flex rounded-lg p-4 backdrop-blur-md"
        :class="{
          'border border-success/60 bg-success/10 shadow-success/20': notification.type === 'success',
          'border border-error/60 bg-error/10 shadow-error/20': notification.type === 'error',
          'border border-info/60 bg-info/10 shadow-info/20': notification.type === 'info',
          'border border-warning/60 bg-warning/10 shadow-warning/20': notification.type === 'warning'
        }"
      >
        <!-- アイコン部分 -->
        <div class="mr-3">
          <!-- Phosphor アイコンを使用 -->
          <PhCheckCircle v-if="notification.type === 'success'" class="h-6 w-6 text-success" />
          <PhWarningCircle v-else-if="notification.type === 'error'" class="h-6 w-6 text-error" />
          <PhInfo v-else-if="notification.type === 'info'" class="h-6 w-6 text-info" />
          <PhWarning v-else class="h-6 w-6 text-warning" />
        </div>
        
        <!-- テキスト部分 -->
        <div class="flex-1">
          <h4 class="text-sm font-medium text-text">{{ notification.title }}</h4>
          <p class="text-sm text-text/90">{{ notification.message }}</p>
        </div>
        
        <!-- 閉じるボタン -->
        <button 
          @click="removeNotification(notification.id)" 
          class="btn-icon btn-icon-text btn-icon-sm ml-2"
        >
          <PhX class="h-4 w-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhCheckCircle, PhWarningCircle, PhInfo, PhWarning, PhX } from '@phosphor-icons/vue';

// 通知の型定義
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timeout?: number;
}

// 通知の表示時間（ミリ秒）
const DEFAULT_TIMEOUT = 5000;

// 通知リスト
const notifications = ref<Notification[]>([]);

// 通知の追加
function addNotification(notification: Omit<Notification, 'id'>) {
  const id = Date.now().toString();
  const newNotification = {
    id,
    ...notification,
    timeout: notification.timeout || DEFAULT_TIMEOUT
  };
  
  notifications.value.push(newNotification);
  
  // タイムアウト後に自動的に閉じる
  setTimeout(() => {
    removeNotification(id);
  }, newNotification.timeout);
}

// 通知の削除
function removeNotification(id: string) {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
}

// すべての通知をクリア
function clearAllNotifications() {
  notifications.value = [];
}

// コンポーネント外部から呼び出せるようにメソッドを公開
defineExpose({
  addNotification,
  removeNotification,
  clearAllNotifications,
  notifications
});
</script> 