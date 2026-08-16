<template>
  <div class="company-logo-field">
    <div class="company-logo-field__preview" aria-hidden="true">
      <img
        v-if="previewSrc"
        :src="previewSrc"
        alt=""
        class="company-logo-field__image"
      />
      <div
        v-else
        class="company-logo-field__placeholder">
        <q-icon name="apartment" size="48px" color="grey-6" />
      </div>
    </div>

    <div
      v-if="!disabled"
      class="company-logo-field__actions row q-gutter-sm
        items-center">
      <q-btn
        no-caps
        outline
        dense
        color="primary"
        class="app-btn-outline"
        icon="upload"
        :label="hasFile
          ? t('tenantLogoReplace')
          : t('tenantLogoUpload')"
        :data-testid="testId"
        @click="openPicker"
      />
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="company-logo-field__input"
      accept="image/jpeg,image/png,image/webp,image/gif"
      @change="onFileInput"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  quasarNotifyTypes,
  storedFileMaxBytes,
} from 'components/constants.js'

const LOGO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

const props = defineProps({
  modelValue: {
    type: [File, String],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: String,
    default: 'company-logo-upload',
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const $q = useQuasar()
const fileInputRef = ref(null)
const localPreviewSrc = ref('')

const hasFile = computed(() => {
  if (props.modelValue instanceof File) {
    return true
  }

  return String(props.modelValue ?? '').startsWith('blob:')
    || String(props.modelValue ?? '').startsWith('http')
    || String(props.modelValue ?? '').startsWith('data:')
})

const previewSrc = computed(() => {
  if (props.modelValue instanceof File) {
    return localPreviewSrc.value
  }
  const src = String(props.modelValue ?? '').trim()

  return src
})

watch(
  () => props.modelValue,
  value => {
    revokeLocalPreview()
    if (value instanceof File) {
      localPreviewSrc.value = URL.createObjectURL(value)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  revokeLocalPreview()
})

function revokeLocalPreview() {
  if (localPreviewSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(localPreviewSrc.value)
  }
  localPreviewSrc.value = ''
}

function openPicker() {
  if (props.disabled) {
    return
  }
  fileInputRef.value?.click()
}

function onFileInput(event) {
  const file = event.target?.files?.[0]
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  if (!file) {
    return
  }
  if (!LOGO_MIME_TYPES.includes(file.type)) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('tenantLogoInvalidType'),
      position: 'top',
    })

    return
  }
  if (file.size > storedFileMaxBytes) {
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('tenantLogoTooLarge'),
      position: 'top',
    })

    return
  }
  emit('update:modelValue', file)
}
</script>

<style lang="scss" scoped>
.company-logo-field {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 12px;
}

.company-logo-field__preview {
  position: relative;
  display: block;
  width: 100%;
  height: 160px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.company-logo-field__image {
  position: absolute;
  inset: 8px;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  object-fit: contain;
  object-position: center;
}

.company-logo-field__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.company-logo-field__input {
  display: none;
}
</style>
