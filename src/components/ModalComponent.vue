<template>
  <q-dialog
    v-model="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="modal-card app-dialog-card app-dialog-card--sm"
      :data-testid="dialogTestId">
      <q-toolbar class="app-dialog-toolbar">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="app-dialog-body flex flex-center">
        <div class="text-body1 text-grey-9">{{ message }}</div>
      </q-card-section>
      <q-card-actions align="right" class="app-dialog-actions">
        <q-btn
          no-caps
          v-if="cancelText"
          outline
          color="primary"
          class="app-btn-outline"
          :data-testid="tid('btn', 'cancel')"
          :title="cancelText"
          :label="cancelText"
          @click="onCancel"/>
        <q-btn
          no-caps
          unelevated
          class="primary-action"
          color="primary"
          :data-testid="tid('btn', 'confirm')"
          :title="confirmText"
          :label="confirmText"
          @click="onConfirm"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { testId as buildTestId } from 'src/utils/test-id.js'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Confirm' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' },
  testIdPrefix: { type: String, default: 'confirm-dialog' },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const modelValue = toRef(props, 'modelValue')

const dialogTestId = computed(() => buildTestId(props.testIdPrefix, 'dialog'))

function tid(...parts) {
  return buildTestId(props.testIdPrefix, ...parts)
}

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>
