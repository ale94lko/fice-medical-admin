<template>
  <div class="admin-table-panel">
    <div
      v-if="$slots.toolbar"
      class="admin-table-panel__toolbar row items-center
        q-gutter-sm">
      <slot name="toolbar" />
    </div>
    <div class="admin-table-panel__table-wrap">
      <slot />
    </div>
  </div>
</template>
