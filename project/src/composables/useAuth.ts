import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

const user = ref<User | null>(null)
const profile = ref<Profile | null>(null)
const loading = ref(false)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.is_admin || false)

  const register = async (email: string, password: string, nickname: string) => {
    loading.value = true
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email, password, nickname })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'ユーザー登録に失敗しました')
      }

      return result
    } catch (error) {
      console.error('Registration error:', error instanceof Error ? error.stack : error)
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('ネットワークエラーが発生しました。開発環境では登録機能をテストできません。')
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  const login = async (identifier: string, password: string) => {
    loading.value = true
    try {
      const emailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/login-with-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ identifier })
      })

      const emailResult = await emailResponse.json()
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || 'ユーザーが見つかりませんでした')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailResult.email,
        password
      })

      if (error) {
        throw new Error('パスワードが正しくありません')
      }

      user.value = data.user
      await loadProfile()
      
      return data
    } catch (error) {
      console.error('Login error:', error instanceof Error ? error.stack : error)
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('ネットワークエラーが発生しました。開発環境ではログイン機能をテストできません。')
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
      profile.value = null
    } catch (error) {
      console.error('Logout error:', error instanceof Error ? error.stack : error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadProfile = async () => {
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) throw error
      profile.value = data
    } catch (error) {
      console.error('Profile load error:', error instanceof Error ? error.stack : error)
    }
  }

  const initAuth = async () => {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        user.value = session.user
        await loadProfile()
      }

      supabase.auth.onAuthStateChange(async (_, session) => {
        user.value = session?.user || null
        if (session?.user) {
          await loadProfile()
        } else {
          profile.value = null
        }
      })
    } catch (error) {
      console.error('Auth init error:', error instanceof Error ? error.stack : error)
    } finally {
      loading.value = false
    }
  }

  return {
    user: computed(() => user.value),
    profile: computed(() => profile.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    loadProfile,
    initAuth
  }
}
