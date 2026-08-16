<template>
  <q-toolbar class="app-dialog-toolbar">
    <q-toolbar-title class="app-dialog-toolbar__title">
      <div class="app-dialog-toolbar__title-row row items-center
        no-wrap">
        <div class="app-dialog-toolbar__title-text">
          <slot />
        </div>
        <q-btn
          v-if="info"
          flat
          round
          dense
          icon="help_outline"
          class="app-dialog-toolbar__info q-ml-xs"
          :data-testid="infoTestId"
          :aria-label="info">
          <q-tooltip
            class="app-dialog-info-tooltip"
            anchor="bottom middle"
            self="top middle"
            :offset="[0, 8]">
            {{ info }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-toolbar-title>
    <q-space />
    <slot name="before-close" />
    <q-btn
      flat
      round
      dense
      icon="close"
      class="app-dialog-toolbar__close"
      :data-testid="closeTestId"
      :disable="disableClose"
      :aria-label="closeLabel"
      :title="closeLabel"
      @click="emit('close')"
    />
  </q-toolbar>
</template>

<script setup>
defineProps({
  closeLabel: {
    type: String,
    default: 'Close',
  },
  disableClose: {
    type: Boolean,
    default: false,
  },
  closeTestId: {
    type: String,
    default: '',
  },
  info: {
    type: String,
    default: '',
  },
  infoTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])
</script>
