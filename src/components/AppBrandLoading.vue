<template>
  <div
    class="app-brand-loading"
    :class="rootClass"
    role="status"
    aria-live="polite"
    aria-busy="true"
    :data-testid="appLoadingTestIds.root">
    <div
      v-if="showWaves"
      class="app-brand-loading__scene"
      aria-hidden="true">
      <svg
        class="app-brand-loading__wave-svg app-brand-loading__wave-svg--back"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="appBrandWaveGradBack"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#99f6e4" stop-opacity="0.15" />
            <stop offset="50%" stop-color="#5eead4" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.15" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathBack"
          fill="url(#appBrandWaveGradBack)"
        />
      </svg>

      <svg
        class="app-brand-loading__wave-svg app-brand-loading__wave-svg--mid"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="appBrandWaveGradMid"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#5eead4" stop-opacity="0.25" />
            <stop offset="50%" stop-color="#14b8a6" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#0d9488" stop-opacity="0.25" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathMid"
          fill="url(#appBrandWaveGradMid)"
        />
      </svg>

      <svg
        class="app-brand-loading__wave-svg app-brand-loading__wave-svg--front"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="appBrandWaveGradFront"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35" />
            <stop offset="50%" stop-color="#0f766e" stop-opacity="0.65" />
            <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.35" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathFront"
          fill="url(#appBrandWaveGradFront)"
        />
      </svg>

      <span
        v-for="particleIndex in particleCount"
        :key="particleIndex"
        class="app-brand-loading__particle"
        :style="{ '--particle-index': particleIndex - 1 }"
      />
    </div>

    <div class="app-brand-loading__content">
      <q-img
        v-if="showLogo"
        class="app-brand-loading__logo"
        src="logo.png"
        spinner-color="primary"
        :alt="title"
      />
      <p
        v-if="showTitle"
        class="app-brand-loading__title"
        :data-testid="appLoadingTestIds.title">
        {{ title }}
      </p>
      <p
        v-if="showMessage"
        class="app-brand-loading__message"
        :data-testid="appLoadingTestIds.message">
        {{ resolvedMessage }}
      </p>
      <div
        class="app-brand-loading__meteor-field"
        :style="beamStageStyle"
        aria-hidden="true">
        <div class="app-brand-loading__meteor-aura" />
        <div
          v-for="meteorIndex in meteorCount"
          :key="`meteor-${meteorIndex}`"
          class="app-brand-loading__meteor-comet"
          :style="meteorCometStyle(meteorIndex)">
          <span
            v-for="segmentIndex in trailSegmentCount"
            :key="`trail-${meteorIndex}-${segmentIndex}`"
            class="app-brand-loading__meteor-trail"
            :style="trailSegmentStyle(segmentIndex)"
          />
          <span class="app-brand-loading__meteor-head" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { appLoadingTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  title: {
    type: String,
    default: 'FiCE Medical Admin',
  },
  message: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  showLogo: {
    type: Boolean,
    default: false,
  },
  showTitle: {
    type: Boolean,
    default: undefined,
  },
  showMessage: {
    type: Boolean,
    default: undefined,
  },
})

const { t } = useI18n()

const meteorCount = 4
const trailSegmentCount = 12
const particleCount = 14

const wavePathBack = [
  'M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7',
  'C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,',
  '1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,',
  '1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,',
  '384,320,288,320C192,320,96,320,48,320L0,320Z',
].join('')

const wavePathMid = [
  'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3',
  'C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,',
  '171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320,',
  'C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,',
  '288,320C192,320,96,320,48,320L0,320Z',
].join('')

const wavePathFront = [
  'M0,256L48,250.7C96,245,192,235,288,229.3C384,224,480,224,576,218.7',
  'C672,213,768,203,864,197.3C960,192,1056,192,1152,186.7C1248,181,',
  '1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,',
  '1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,',
  '384,320,288,320C192,320,96,320,48,320L0,320Z',
].join('')

const showTitle = computed(() => {
  if (props.showTitle != null) {
    return props.showTitle
  }

  return !props.inline
})

const showMessage = computed(() => {
  if (props.showMessage != null) {
    return props.showMessage
  }

  return !props.inline
})

const showWaves = computed(
  () => !props.inline && !props.compact,
)

const resolvedMessage = computed(
  () => props.message || t('appLoading'),
)

const rootClass = computed(() => ({
  'app-brand-loading--compact': props.compact,
  'app-brand-loading--inline': props.inline,
  'app-brand-loading--with-logo': props.showLogo,
  'app-brand-loading--with-waves': showWaves.value,
}))

const beamWidthPx = computed(() => {
  if (props.inline) {
    return 72
  }
  if (props.compact) {
    return 104
  }

  return 148
})

const meteorHeadSize = computed(() => {
  if (props.inline) {
    return '7px'
  }
  if (props.compact) {
    return '8px'
  }

  return '10px'
})

const beamStageStyle = computed(() => ({
  '--beam-width': `${beamWidthPx.value}px`,
  '--meteor-head-size': meteorHeadSize.value,
}))

function meteorCometStyle(meteorIndex) {
  const scale = 0.36 + (meteorIndex - 1) * 0.19
  const rx = beamWidthPx.value * scale * 0.49
  const ry = rx * 0.34

  return {
    '--orbit-rx': `${rx.toFixed(1)}px`,
    '--orbit-ry': `${ry.toFixed(1)}px`,
    '--orbit-duration': `${2.65 + meteorIndex * 0.24}s`,
    '--orbit-start-delay': `${(meteorIndex - 1) * -0.62}s`,
  }
}

function trailSegmentStyle(segmentIndex) {
  const lagSeconds = segmentIndex * 0.042
  const opacity = Math.max(0.05, 0.9 - segmentIndex * 0.075)
  const size = Math.max(2.2, 8.5 - segmentIndex * 0.55)

  return {
    '--piece-delay': `calc(var(--orbit-start-delay) + ${lagSeconds}s)`,
    '--piece-opacity': opacity.toFixed(2),
    '--piece-size': `${size.toFixed(1)}px`,
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.app-brand-loading {
  --beam-width: 148px;
  --meteor-head-size: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  user-select: none;
  overflow: hidden;
}

.app-brand-loading__scene {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.app-brand-loading__wave-svg {
  position: absolute;
  left: -8%;
  width: 116%;
  height: 58%;
  bottom: -4%;
  opacity: 0.92;
  will-change: transform;
}

.app-brand-loading__wave-svg--back {
  animation: app-brand-wave-drift 14s ease-in-out infinite;
}

.app-brand-loading__wave-svg--mid {
  height: 52%;
  bottom: -2%;
  animation: app-brand-wave-drift 10s ease-in-out infinite reverse;
}

.app-brand-loading__wave-svg--front {
  height: 46%;
  bottom: 0;
  animation: app-brand-wave-drift 8s ease-in-out infinite;
}

.app-brand-loading__particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba($white, 0.95);
  box-shadow: 0 0 8px rgba($white, 0.85);
  bottom: calc(8% + (var(--particle-index) * 2.4%));
  left: calc(6% + (var(--particle-index) * 6.5%));
  opacity: 0;
  animation: app-brand-particle 3.2s ease-in-out infinite;
  animation-delay: calc(var(--particle-index) * -0.22s);
}

.app-brand-loading__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-brand-loading__logo {
  width: 96px;
  max-width: 96px;
  margin-bottom: 20px;
}

.app-brand-loading__title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #0f4f4a;
}

.app-brand-loading__message {
  margin: 10px 0 0;
  font-size: clamp(0.9375rem, 2vw, 1.0625rem);
  font-weight: 500;
  line-height: 1.35;
  color: #5b8a86;
}

.app-brand-loading__meteor-field {
  position: relative;
  width: var(--beam-width);
  height: calc(var(--beam-width) * 0.46);
  margin-top: 28px;
}

.app-brand-loading__meteor-aura {
  position: absolute;
  top: 58%;
  left: 50%;
  width: calc(var(--beam-width) * 0.78);
  height: calc(var(--beam-width) * 0.24);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    rgba($accent, 0.28) 0%,
    rgba($primary, 0.12) 42%,
    transparent 72%
  );
  filter: blur(10px);
  opacity: 0.85;
  animation: app-brand-meteor-aura 3.2s ease-in-out infinite;
}

.app-brand-loading__meteor-comet {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.app-brand-loading__meteor-trail,
.app-brand-loading__meteor-head {
  position: absolute;
  top: 0;
  left: 0;
  offset-path: ellipse(
    var(--orbit-rx) var(--orbit-ry) at 50% 54%
  );
  offset-rotate: auto;
  animation: app-brand-meteor-path var(--orbit-duration, 2.8s)
    linear infinite;
  animation-delay: var(--piece-delay, var(--orbit-start-delay, 0s));
}

.app-brand-loading__meteor-trail {
  width: var(--piece-size);
  height: var(--piece-size);
  border-radius: 50%;
  opacity: var(--piece-opacity);
  background: radial-gradient(
    circle,
    rgba(236, 253, 245, 0.95) 0%,
    rgba($accent, 0.75) 45%,
    rgba($primary, 0.08) 100%
  );
  box-shadow: 0 0 10px rgba($accent, 0.35);
  filter: blur(0.35px);
}

.app-brand-loading__meteor-head {
  width: var(--meteor-head-size);
  height: var(--meteor-head-size);
  border-radius: 50%;
  animation-delay: var(--orbit-start-delay, 0s);
  background: radial-gradient(
    circle,
    #ffffff 0%,
    #ccfbf1 24%,
    $accent 58%,
    rgba($primary, 0.45) 100%
  );
  box-shadow:
    0 0 8px rgba($white, 0.98),
    0 0 16px rgba($accent, 0.92),
    0 0 28px rgba($primary, 0.42);

  &::before {
    content: '';
    position: absolute;
    inset: -70%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba($accent, 0.35) 0%,
      transparent 68%
    );
    filter: blur(2px);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 180%;
    height: 55%;
    transform: translate(-12%, -50%);
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba($accent, 0) 0%,
      rgba($accent, 0.18) 35%,
      rgba(236, 253, 245, 0.55) 100%
    );
    filter: blur(1.5px);
    opacity: 0.75;
    pointer-events: none;
  }
}

.app-brand-loading--with-waves {
  width: 100%;
  height: 100%;
  min-height: 100%;
  flex: 1 1 auto;
  align-self: stretch;
  padding: 0;
  background: radial-gradient(
    ellipse at 50% 28%,
    #f8fafb 0%,
    #eef2f4 42%,
    #e4eaec 100%
  );
}

.app-brand-loading--with-waves .app-brand-loading__content {
  flex: 1;
  justify-content: center;
  min-height: 0;
}

.app-brand-loading--with-waves .app-brand-loading__wave-svg {
  height: 62%;
  bottom: -6%;
}

.app-brand-loading--with-waves .app-brand-loading__wave-svg--mid {
  height: 56%;
  bottom: -3%;
}

.app-brand-loading--with-waves .app-brand-loading__wave-svg--front {
  height: 50%;
  bottom: 0;
}

.app-brand-loading--compact {
  padding: 16px;

  .app-brand-loading__title {
    font-size: 1.125rem;
  }

  .app-brand-loading__message {
    font-size: 0.875rem;
  }

  .app-brand-loading__meteor-field {
    margin-top: 20px;
  }
}

.app-brand-loading--inline {
  padding: 0;

  .app-brand-loading__meteor-field {
    margin-top: 0;
  }
}

.app-brand-loading--with-logo {
  .app-brand-loading__title {
    font-size: 1.5rem;
  }
}

@keyframes app-brand-wave-drift {
  0%,
  100% {
    transform: translateX(-3%) scaleY(1);
  }

  50% {
    transform: translateX(3%) scaleY(1.04);
  }
}

@keyframes app-brand-particle {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0.6);
  }

  35%,
  65% {
    opacity: 1;
    transform: translateY(-6px) scale(1);
  }
}

@keyframes app-brand-meteor-path {
  from {
    offset-distance: 100%;
  }

  to {
    offset-distance: 0%;
  }
}

@keyframes app-brand-meteor-aura {
  0%,
  100% {
    opacity: 0.68;
    transform: translate(-50%, -50%) scale(0.96);
  }

  50% {
    opacity: 0.95;
    transform: translate(-50%, -50%) scale(1.04);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-brand-loading__wave-svg,
  .app-brand-loading__particle,
  .app-brand-loading__meteor-trail,
  .app-brand-loading__meteor-head,
  .app-brand-loading__meteor-aura {
    animation: none;
  }
}
</style>
