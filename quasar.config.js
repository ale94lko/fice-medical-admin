import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath } from 'node:url'

export default defineConfig((ctx) => {
  return {
    boot: [
      'i18n',
      'axios'
    ],
    css: [S
      'app.scss'
    ],
    extras: [
      'roboto-font',
      'material-icons',
    ],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20'
      },
      vueRouterMode: 'history',
      publicPath: 'fice-medical-admin',
      vitePlugins: [
        ['@intlify/unplugin-vue-i18n/vite', {
          ssr: ctx.modeName === 'ssr',
          include: [fileURLToPath(new URL('./src/i18n', import.meta.url))]
        }],
        ['vite-plugin-checker', {
          eslint: {
            lintCommand:
              'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true
          }
        }, { server: false }]
      ]
    },
    devServer: {
      port: 8090,
      open: true
    },
    framework: {
      config: {},
      lang: 'en-US',
      plugins: [
        'Notify',
      ]
    },
    animations: [],
    ssr: {
      prodPort: 3000,
      middlewares: [
        'render'
      ],
      pwa: false
    },
    pwa: {
      workboxMode: 'GenerateSW'
    },
    cordova: {},
    capacitor: {
      hideSplashscreen: true
    },
    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'fice-medical-admin'
      }
    },
    bex: {
      extraScripts: []
    }
  }
})
