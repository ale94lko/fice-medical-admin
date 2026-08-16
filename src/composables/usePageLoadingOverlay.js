import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'

function isActive(source) {
  return Boolean(unref(source))
}

export function usePageLoadingOverlay({
  loading,
  saving = false,
  preparing = false,
}) {
  const { t } = useI18n()

  const showing = computed(
    () => isActive(loading) || isActive(saving) || isActive(preparing),
  )

  const message = computed(() =>
    isActive(saving) ? t('appSaving') : '',
  )

  return {
    showing,
    message,
  }
}

export function createDialogPreparingHandlers(preparingRef, {
  onOpen = null,
  afterOpen = null,
} = {}) {
  const start = () => {
    preparingRef.value = true
  }
  const stop = () => {
    preparingRef.value = false
  }
  const hasAfterOpen = typeof afterOpen === 'function'

  return {
    onOpen: async() => {
      start()
      try {
        if (typeof onOpen === 'function') {
          await onOpen()
        }
        if (!hasAfterOpen) {
          stop()
        }
      } catch (error) {
        stop()
        throw error
      }
    },
    afterOpen: async(form) => {
      try {
        if (hasAfterOpen) {
          await afterOpen(form)
        }
      } finally {
        stop()
      }
    },
  }
}
