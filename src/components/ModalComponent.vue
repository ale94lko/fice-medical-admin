<template>
  <q-dialog
    v-model="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card class="modal-card app-dialog-card app-dialog-card--sm">
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
          :title="cancelText"
          :label="cancelText"
          @click="onCancel"/>
        <q-btn
          no-caps
          unelevated
          class="primary-action"
          color="primary"
          :title="confirmText"
          :label="confirmText"
          @click="onConfirm"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { toRef } from 'vue'

const props = defineProps({
  modelValue: Boolean, // v-model
  title: { type: String, default: 'Confirm' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'OK' },
  cancelText: { type: String, default: 'Cancel' }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const modelValue = toRef(props, 'modelValue')

const onConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

