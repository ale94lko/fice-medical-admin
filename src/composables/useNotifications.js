import { useQuasar } from 'quasar'

export function useNotifications() {
  const $q = useQuasar()

  function notifyError(message) {
    $q.notify({
      color: 'negative',
      icon: 'error',
      message,
      position: 'top',
      timeout: 5000,
    })
  }

  function notifySuccess(message) {
    $q.notify({
      color: 'positive',
      icon: 'check_circle',
      message,
      position: 'top',
      timeout: 3000,
    })
  }

  function notifyWarning(message) {
    $q.notify({
      color: 'warning',
      icon: 'warning',
      message,
      position: 'top',
      timeout: 4000,
    })
  }

  return {
    notifyError,
    notifySuccess,
    notifyWarning,
  }
}
