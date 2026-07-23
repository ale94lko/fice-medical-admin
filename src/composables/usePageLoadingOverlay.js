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

  return {
    onOpen: async() => {
      start()
      try {
        if (typeof onOpen === 'function') {
          await onOpen()
        }
      } catch (error) {
        stop()
        throw error
      }
    },
    afterOpen: async(form) => {
      try {
        if (typeof afterOpen === 'function') {
          await afterOpen(form)
        }
      } finally {
        stop()
      }
    },
  }
}
