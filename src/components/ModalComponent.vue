<template>
  <q-dialog
    v-model="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="modal-card">
      <q-toolbar class="q-px-md bg-teal-10 text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-px-xl q-py-md modal-body flex flex-center">
        <div class="text-body1">{{ message }}</div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="center" class="q-pa-md">
        <q-btn
          no-caps
          padding="7px 30px"
          v-if="cancelText"
          color="secondary"
          class="text-teal-10"
          :label="cancelText"
          @click="onCancel"
        />
        <q-btn
          no-caps
          class="primary-action"
          color="primary"
          :label="confirmText"
          @click="onConfirm"
        />
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

<style scoped>
  .modal-card {
    min-width: 400px;
    max-width: 500px;

    .text-body1 {
      margin: 10px auto;
    }

    .primary-action {
      margin-left: 25px;
      padding: 7px 30px;
    }
  }
</style>
