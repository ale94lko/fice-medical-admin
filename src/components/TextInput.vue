<template>
  <q-input
    ref="fieldRef"
    outlined
    v-model="model"
    :lazy-rules="'ondemand'"
    :class="{
      'text-input--float-on-value': floatLabelOnValue,
    }"
    :autofocus="autofocus"
    :autocomplete="autocomplete || undefined"
    :data-testid="props.testId"
    :type="resolvedType"
    :label="resolvedLabel"
    :placeholder="resolvedPlaceholder"
    :rules="props.rules || []">
    <template v-slot:prepend v-if="iconLeft">
      <q-icon :name="iconLeft" class="input-icon"/>
    </template>
    <template v-if="isPasswordField" #append>
      <PasswordToggleIcon
        :show-plain="showPlainPassword"
        @toggle="showPlainPassword = !showPlainPassword"
      />
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'
import PasswordToggleIcon from './PasswordToggleIcon.vue'
import {
  isPasswordInputType,
  passwordFieldInputType,
} from 'src/composables/usePasswordVisibility.js'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: 'text',
  },
  iconLeft: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: 'input',
  },
  rules: {
    type: Array,
    default: () => [],
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  floatLabelOnValue: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel({ type: String, default: '' })

const fieldRef = ref(null)
const showPlainPassword = ref(false)

const hasValue = computed(() => String(model.value ?? '').length > 0)

const resolvedLabel = computed(() => {
  if (props.floatLabelOnValue && !hasValue.value) {
    return undefined
  }
  return props.label
})

const resolvedPlaceholder = computed(() => {
  if (props.placeholder) {
    return props.placeholder
  }
  if (props.floatLabelOnValue && !hasValue.value) {
    return props.label || undefined
  }
  return undefined
})

function focus() {
  fieldRef.value?.focus()
}

defineExpose({ focus })

const isPasswordField = computed(() => isPasswordInputType(props.type))

const resolvedType = computed(() =>
  isPasswordField.value
    ? passwordFieldInputType(showPlainPassword.value)
    : props.type,
)
</script>

<style scoped>
  .q-input {
    min-width: 120px;
    margin-bottom: 10px;
  }

  .input-icon {
    color: #004D40;
  }

  .text-input--float-on-value :deep(.q-field__native::placeholder) {
    color: #64748b;
    opacity: 1;
  }
</style>
