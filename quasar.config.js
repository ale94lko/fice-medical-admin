import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath } from 'node:url'

export default defineConfig((ctx) => {
  const isCapacitor = ctx.modeName === 'capacitor'

  return {
    boot: [
      'i18n',
      'axios',
      ...(ctx.mode.capacitor ? ['capacitor'] : []),
    ],
    css: [
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
      // Capacitor serves from app root; GitHub Pages uses project path.
      vueRouterMode: isCapacitor ? 'hash' : 'history',
      publicPath: isCapacitor ? '/' : 'fice-medical-admin',
      env: {
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || '',
      },
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
      open: !isCapacitor
    },
    framework: {
      config: {
        notify: {
          position: 'top',
        },
        btn: {
          unelevated: true,
          rounded: true,
        },
        card: {
          flat: false,
        },
      },
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
      hideSplashscreen: true,
      // Capacitor 7 / Quasar: appId & appName live in
      // src-capacitor/capacitor.config.json
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
