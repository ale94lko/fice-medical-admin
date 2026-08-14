<template>
  <header class="admin-list-page__header">
    <div
      class="admin-list-page__title-row row items-center
        justify-between">
      <div class="admin-list-page__heading">
        <h1 class="admin-list-page__title">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p
          v-if="subtitle || $slots.subtitle"
          class="admin-list-page__subtitle q-mb-none">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div
        v-if="$slots.center"
        class="admin-list-page__center col">
        <slot name="center" />
      </div>
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>
