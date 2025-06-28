<template>
  <div class="text-center py-16">
    <PhWarning class="mx-auto h-24 w-24 mb-4 text-warning" />
    <h1 class="mb-4 text-8xl text-primary">404</h1>
    <p class="mb-8 text-2xl text-text-muted">ページが見つかりませんでした</p>
    <router-link 
      to="/" 
      class="btn btn-primary btn-lg inline-flex items-center mx-auto px-8"
    >
      <PhHouse class="mr-2 h-5 w-5" />
      ホームに戻る
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { PhWarning, PhHouse } from '@phosphor-icons/vue';
</script>