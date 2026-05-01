<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 60 30"
    class="phone-flag-icon"
    shape-rendering="geometricPrecision"
    aria-hidden="true">
    <rect width="60" height="30" rx="2" fill="#b22234" />
    <rect y="4.3" width="60" height="2.14" fill="#fff" />
    <rect y="10.72" width="60" height="2.14" fill="#fff" />
    <rect y="17.14" width="60" height="2.14" fill="#fff" />
    <rect y="23.56" width="60" height="2.14" fill="#fff" />
    <path fill="#3c3b6e" d="M0 0h26v17H0z" />
    <rect
      width="60"
      height="30"
      rx="2"
      fill="none"
      stroke="rgba(0,0,0,0.14)"
      stroke-width="0.5"
    />
  </svg>
</template>

<script setup>
defineOptions({ name: 'UsFlagIcon' })
</script>

<style scoped>
.phone-flag-icon {
  width: 28px;
  height: 14px;
  display: block;
  flex-shrink: 0;
}
</style>
