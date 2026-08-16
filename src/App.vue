<template>
  <div class="fit">
    <router-view />
    <ForcedMfaEnrollDialog v-if="mustEnrollMfa" forced />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from 'stores/auth-store.js'
import ForcedMfaEnrollDialog from
  'components/ForcedMfaEnrollDialog.vue'

const authStore = useAuthStore()
const { mustEnrollMfa } = storeToRefs(authStore)
</script>
