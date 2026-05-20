<template>
  <q-icon
    :name="iconName"
    class="cursor-pointer"
    :title="titleText"
    :aria-label="titleText"
    @click="emit('toggle')"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { passwordToggleIconName }
  from 'src/composables/usePasswordVisibility.js'

const props = defineProps({
  showPlain: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle'])

const { t } = useI18n()

const iconName = computed(() => passwordToggleIconName(props.showPlain))

const titleText = computed(() =>
  props.showPlain ? t('hidePassword') : t('showPassword'),
)
</script>
