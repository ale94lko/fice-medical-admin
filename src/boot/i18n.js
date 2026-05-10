import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

let i18nSingleton = null

export function i18nGlobalT(key) {
  if (!i18nSingleton?.global?.t) {
    return key === 'sessionExpiredRelogin'
      ? 'La session expiró, por favor inicia session de nuevo'
      : String(key)
  }

  return String(i18nSingleton.global.t(key))
}

export default defineBoot(({ app }) => {
  const savedLocale = localStorage.getItem('locale')
  const browserLocale =
    navigator.language.slice(0, 2) === 'es' ? 'es-ES' : 'en-US'
  const locale = savedLocale || browserLocale

  const i18n = createI18n({
    locale: locale,
    globalInjection: true,
    messages
  })

  i18nSingleton = i18n
  app.use(i18n)
})
