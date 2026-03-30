import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

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

  // Set i18n instance on app
  app.use(i18n)
})
