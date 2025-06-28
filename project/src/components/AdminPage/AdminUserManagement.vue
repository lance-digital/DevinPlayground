<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-heading">ユーザー管理</h2>
      <button 
        @click="fetchUsers"
        class="btn btn-outline-primary btn-sm flex items-center gap-1"
        :disabled="loading"
      >
        <PhArrowClockwise 
          class="h-4 w-4"
          :class="{ 'animate-spin': loading }"
        />
        更新
      </button>
    </div>
    
    <!-- 検索・フィルター -->
    <div class="glass-card mb-6 p-4">
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ユーザー名、アカウントID、メールアドレスで検索..."
            class="input w-full"
            @input="debouncedSearch"
          />
        </div>
        <div class="flex gap-2">
          <select v-model="filterRole" class="select">
            <option value="">すべてのユーザー</option>
            <option value="admin">管理者のみ</option>
            <option value="user">一般ユーザーのみ</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- ローディング状態 -->
    <div v-if="loading" class="flex justify-center p-8">
      <PhSpinner class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <!-- ユーザー一覧 -->
    <div v-else class="glass-card">
      <div v-if="filteredUsers.length === 0" class="p-6 text-center">
        <p class="text-text-muted">ユーザーが見つかりません。</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="p-4 text-left text-sm font-medium text-text-muted">ユーザー</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">アカウントID</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">権限</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">登録日</th>
              <th class="p-4 text-left text-sm font-medium text-text-muted">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr 
              v-for="user in filteredUsers" 
              :key="user.id"
              class="hover:bg-surface-variant/30"
            >
              <td class="p-4">
                <div class="flex items-center space-x-3">
                  <div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <PhUser class="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div class="font-medium text-text">{{ user.nickname || '名前未設定' }}</div>
                    <div class="text-sm text-text-muted">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="font-mono text-sm text-text">{{ user.account_id }}</span>
              </td>
              <td class="p-4">
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="user.is_admin ? 'bg-error/20 text-error' : 'bg-success/20 text-success'"
                >
                  {{ user.is_admin ? '管理者' : '一般ユーザー' }}
                </span>
              </td>
              <td class="p-4">
                <span class="text-sm text-text-muted">{{ formatDate(user.created_at) }}</span>
              </td>
              <td class="p-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="toggleAdminRole(user)"
                    class="btn btn-sm"
                    :class="user.is_admin ? 'btn-outline-error' : 'btn-outline-primary'"
                    :disabled="user.id === authStore.user?.id"
                  >
                    {{ user.is_admin ? '管理者解除' : '管理者にする' }}
                  </button>
                  <button
                    @click="deleteUser(user)"
                    class="btn btn-sm btn-outline-error"
                    :disabled="user.id === authStore.user?.id"
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
// Simple debounce implementation to avoid external dependency
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
import { 
  PhSpinner, 
  PhUser,
  PhArrowClockwise
} from '@phosphor-icons/vue';

interface User {
  id: string;
  email: string;
  account_id: string;
  nickname: string | null;
  is_admin: boolean;
  created_at: string;
}

const authStore = useAuthStore();

const loading = ref(true);
const users = ref<User[]>([]);
const searchQuery = ref('');
const filterRole = ref('');

const filteredUsers = computed(() => {
  let filtered = users.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.nickname?.toLowerCase().includes(query) ||
      user.account_id.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }
  
  if (filterRole.value === 'admin') {
    filtered = filtered.filter(user => user.is_admin);
  } else if (filterRole.value === 'user') {
    filtered = filtered.filter(user => !user.is_admin);
  }
  
  return filtered;
});

const debouncedSearch = debounce(() => {
  // 検索は computed で自動的に実行される
}, 300);

onMounted(() => {
  fetchUsers();
});

watch(filterRole, () => {
  // フィルターは computed で自動的に実行される
});

async function fetchUsers() {
  loading.value = true;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        account_id,
        nickname,
        is_admin,
        created_at
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;
    
    users.value = data?.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || '',
        is_admin: profile.is_admin || false
      };
    }) || [];
    
  } catch (err) {
    console.error('ユーザー取得エラー:', err);
  } finally {
    loading.value = false;
  }
}

async function toggleAdminRole(user: User) {
  if (user.id === authStore.user?.id) {
    alert('自分の権限は変更できません。');
    return;
  }
  
  const newAdminStatus = !user.is_admin;
  const confirmMessage = newAdminStatus 
    ? `${user.nickname || user.account_id}を管理者にしますか？`
    : `${user.nickname || user.account_id}の管理者権限を解除しますか？`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: newAdminStatus })
      .eq('id', user.id);
    
    if (error) throw error;
    
    user.is_admin = newAdminStatus;
    
    alert(newAdminStatus ? '管理者権限を付与しました。' : '管理者権限を解除しました。');
    
  } catch (err) {
    console.error('権限変更エラー:', err);
    alert('権限の変更に失敗しました。');
  }
}

async function deleteUser(user: User) {
  if (user.id === authStore.user?.id) {
    alert('自分のアカウントは削除できません。');
    return;
  }
  
  const confirmMessage = `${user.nickname || user.account_id}を完全に削除しますか？この操作は取り消せません。`;
  
  if (!confirm(confirmMessage)) return;
  
  try {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) throw error;
    
    users.value = users.value.filter(u => u.id !== user.id);
    
    alert('ユーザーを削除しました。');
    
  } catch (err) {
    console.error('ユーザー削除エラー:', err);
    alert('ユーザーの削除に失敗しました。');
  }
}

function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateString;
  }
}
</script>
