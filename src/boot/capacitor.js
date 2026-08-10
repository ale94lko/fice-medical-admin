import { defineBoot } from '#q-app/wrappers'
import { Capacitor } from '@capacitor/core'

export default defineBoot(async({ router }) => {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack && window.history.length > 1) {
        router.back()

        return
      }
      App.exitApp()
    })
  } catch (error) {
    console.warn('Capacitor App plugin unavailable', error)
  }
})
