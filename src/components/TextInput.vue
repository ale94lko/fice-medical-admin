<template>
  <q-input
    outlined
    lazy-rules
    v-model="model"
    :data-testid="props.testId"
    :type="props.type"
    :label="props.label"
    :rules="props.rules || []">
    <template v-slot:prepend v-if="iconLeft">
      <q-icon :name="iconLeft" class="input-icon"/>
    </template>
  </q-input>
</template>

<script setup>
import { ref } from 'vue'

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
})

const model = ref('')
</script>

<style scoped>
  .q-input {
    min-width: 120px;
    margin-bottom: 10px;
  }

  .input-icon {
    color: #004D40;
  }
</style>
