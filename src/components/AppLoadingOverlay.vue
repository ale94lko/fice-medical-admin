<template>
  <Teleport v-if="scope === 'content'" to="body">
    <div
      v-show="showing"
      class="app-loading-overlay app-loading-overlay--content"
      :class="{ 'app-loading-overlay--translucent': isTranslucent }"
      :style="contentOverlayStyle"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      :aria-label="resolvedAriaLabel">
      <AppBrandLoading
        :message="message"
        :title="title"
        :show-title="showTitle"
        :show-message="showMessage"
      />
    </div>
  </Teleport>

  <q-inner-loading
    v-else
    :showing="showing"
    class="app-loading-overlay app-loading-overlay--local"
    :class="{ 'app-loading-overlay--translucent': isTranslucent }"
    :style="localOverlayStyle">
    <AppBrandLoading
      :compact="compact"
      :inline="inline"
      :title="title"
      :message="message"
      :show-title="showTitle"
      :show-message="showMessage"
    />
  </q-inner-loading>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import AppBrandLoading from 'components/AppBrandLoading.vue'

const APP_CONTENT_ROOT_ID = 'app-content-root'
const APP_FOOTER_SELECTOR = '.app-layout .app-footer'

const props = defineProps({
  showing: {
    type: Boolean,
    default: false,
  },
  scope: {
    type: String,
    default: 'local',
    validator: value => value === 'local' || value === 'content',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'FiCE Medical Admin',
  },
  message: {
    type: String,
    default: '',
  },
  showTitle: {
    type: Boolean,
    default: undefined,
  },
  showMessage: {
    type: Boolean,
    default: undefined,
  },
  surfaceOpacity: {
    type: Number,
    default: 0.5,
    validator: value => value >= 0 && value <= 1,
  },
})

const { t } = useI18n()

const contentBounds = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
})

let resizeObserver = null

const resolvedAriaLabel = computed(
  () => props.message || t('appLoading'),
)

const isTranslucent = computed(() => props.surfaceOpacity < 1)

const overlaySurfaceBackground = computed(
  () => `rgba(244, 246, 248, ${props.surfaceOpacity})`,
)

const localOverlayStyle = computed(() => ({
  background: overlaySurfaceBackground.value,
}))

const contentOverlayStyle = computed(() => ({
  top: `${contentBounds.value.top}px`,
  left: `${contentBounds.value.left}px`,
  width: `${contentBounds.value.width}px`,
  height: `${contentBounds.value.height}px`,
  background: overlaySurfaceBackground.value,
}))

function readContentBounds() {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.getElementById(APP_CONTENT_ROOT_ID)
  if (!root) {
    return
  }

  const rect = root.getBoundingClientRect()
  const top = Math.max(rect.top, 0)
  const left = Math.max(rect.left, 0)
  let height = Math.max(rect.height, 0)

  const footerEl = document.querySelector(APP_FOOTER_SELECTOR)
  if (footerEl) {
    const footerTop = footerEl.getBoundingClientRect().top
    height = Math.max(0, Math.min(height, footerTop - top))
  }

  contentBounds.value = {
    top,
    left,
    width: Math.max(rect.width, 0),
    height,
  }
}

function stopObservingContentRoot() {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', readContentBounds)
  window.removeEventListener('scroll', readContentBounds, true)
}

function observeElement(el) {
  if (!resizeObserver || !el) {
    return
  }

  resizeObserver.observe(el)
}

function startObservingContentRoot() {
  stopObservingContentRoot()

  const hasResizeObserver = typeof ResizeObserver !== 'undefined'
  if (typeof document === 'undefined' || !hasResizeObserver) {
    readContentBounds()
    window.addEventListener('resize', readContentBounds)
    window.addEventListener('scroll', readContentBounds, true)

    return
  }

  const root = document.getElementById(APP_CONTENT_ROOT_ID)
  if (!root) {
    return
  }

  readContentBounds()
  resizeObserver = new ResizeObserver(readContentBounds)
  observeElement(root)
  observeElement(document.querySelector(APP_FOOTER_SELECTOR))

  window.addEventListener('resize', readContentBounds)
  window.addEventListener('scroll', readContentBounds, true)
}

watch(
  () => [props.showing, props.scope],
  async([showing, scope]) => {
    if (!showing || scope !== 'content') {
      stopObservingContentRoot()

      return
    }

    await nextTick()
    startObservingContentRoot()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopObservingContentRoot()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

@mixin app-loading-overlay-translucent-surface {
  backdrop-filter: blur(4px);

  &.app-loading-overlay--translucent {
    :deep(.app-brand-loading--with-waves) {
      background: transparent !important;
    }
  }
}

.app-loading-overlay--content {
  position: fixed;
  z-index: 900;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  pointer-events: all;
  touch-action: none;
  box-sizing: border-box;
  overflow: hidden;
  padding: 0;
  @include app-loading-overlay-translucent-surface;
}

.app-loading-overlay--local {
  @include app-loading-overlay-translucent-surface;
}
</style>
