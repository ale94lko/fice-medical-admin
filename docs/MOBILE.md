# FiCE Medical Admin — móvil (Capacitor)

La app web Quasar se empaqueta con **Capacitor 7** para Android e iOS.

## Requisitos

- Node.js (ver `package.json` → `engines`)
- API HTTPS accesible desde el dispositivo (`VITE_API_BASE_URL`)
- **Android:** Android Studio + SDK
- **iOS:** macOS + Xcode (no se puede firmar/compilar iOS en Windows)

## Configuración

1. Copia el entorno:

```bash
cp .env.example .env
```

2. Edita `VITE_API_BASE_URL` con tu API de producción/staging (sin `/` final).

3. El modo Capacitor usa:
   - `publicPath: /`
   - `vueRouterMode: hash` (navegación fiable en WebView)
   - App id: `com.fice.medical.admin` (`src-capacitor/capacitor.config.json`)

El build web de GitHub Pages (`quasar build`) sigue usando `publicPath: fice-medical-admin`.

## Desarrollo

```bash
# Android (abre Android Studio / emulador)
npm run dev:android

# iOS (solo macOS)
npm run dev:ios
```

La primera vez Quasar instala la plataforma (`@capacitor/android` / `@capacitor/ios`) bajo `src-capacitor/`.

## Build de release

```bash
npm run build:android
npm run build:ios
```

Luego abre el proyecto nativo:

- Android: `src-capacitor/android` en Android Studio → Generate Signed Bundle / APK
- iOS: `src-capacitor/ios` en Xcode → Archive → App Store Connect

## Notas

- No uses `localhost` como API en el dispositivo físico; usa HTTPS público o la IP de tu máquina en LAN (y CORS en el backend).
- El botón atrás de Android vuelve en el router o cierra la app (`src/boot/capacitor.js`).
- Iconos / splash: edítalos en Android Studio / Xcode (o con `@capacitor/assets` más adelante).
