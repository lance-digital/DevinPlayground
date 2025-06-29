import { ref, watch } from 'vue'

interface DraftData {
  [key: string]: any
}

export const useDraft = (draftKey: string, initialData: DraftData = {}) => {
  const draftData = ref<DraftData>({ ...initialData })
  const isDraftAvailable = ref(false)
  const lastSaved = ref<Date | null>(null)

  const STORAGE_KEY = `draft_${draftKey}`
  const AUTO_SAVE_INTERVAL = 3000

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        draftData.value = { ...initialData, ...parsed.data }
        lastSaved.value = new Date(parsed.timestamp)
        isDraftAvailable.value = true
        return true
      }
    } catch (error) {
      console.error('Draft load error:', error instanceof Error ? error.stack : error)
    }
    return false
  }

  const saveDraft = () => {
    try {
      const draftPayload = {
        data: draftData.value,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload))
      lastSaved.value = new Date()
    } catch (error) {
      console.error('Draft save error:', error instanceof Error ? error.stack : error)
    }
  }

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      isDraftAvailable.value = false
      lastSaved.value = null
    } catch (error) {
      console.error('Draft clear error:', error instanceof Error ? error.stack : error)
    }
  }

  const updateDraft = (key: string, value: any) => {
    draftData.value[key] = value
  }

  const restoreDraft = () => {
    return loadDraft()
  }

  let autoSaveTimer: ReturnType<typeof setInterval> | null = null

  const startAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }
    
    autoSaveTimer = setInterval(() => {
      saveDraft()
    }, AUTO_SAVE_INTERVAL)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  watch(draftData, () => {
    if (autoSaveTimer) {
      saveDraft()
    }
  }, { deep: true })

  loadDraft()

  return {
    draftData,
    isDraftAvailable,
    lastSaved,
    loadDraft,
    saveDraft,
    clearDraft,
    updateDraft,
    restoreDraft,
    startAutoSave,
    stopAutoSave
  }
}
