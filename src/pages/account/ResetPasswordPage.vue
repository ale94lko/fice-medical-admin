<template>
  <div class="row justify-between login-container">
    <q-page class="login-card flex flex-center">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleSubmit">
          <q-card-section>
            <div class="text-h6">{{ t('resetPassword') }}</div>
          </q-card-section>
          <q-card-section class="login-inputs">
            <text-input
              v-model="email"
              icon-left="mail"
              test-id="input_email"
              maxlength="32"
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              type="submit"
              class="full-width"
              data-testid="reset-password-btn-continue"
              :label="t('continue')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                class="forgot-password"
                data-testid="reset-password-link-back-to-login"
                @click="router.push('/login')">
                {{ t('backToLogin') }}
              </q-item-label>
            </div>
          </q-card-actions>
        </form>
      </q-card>
    </q-page>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import TextInput from 'components/TextInput.vue'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()

const email = ref('')
const isEmailInvalid = ref(false)
const loading = ref(false)

const emailErrorMessage = computed(() => {
  const value = email.value.trim()
  const regex = /^[A-Za-z0-9_-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return value === ''
    ? 'Email is required'
    : value.length > 32
      ? 'Email must be at most 32 characters'
      : !regex.test(value)
        ? 'Please enter a valid email address'
        : ''
})

async function handleSubmit() {
  isEmailInvalid.value = !!emailErrorMessage.value

  if (isEmailInvalid.value) {
    return
  }

  loading.value = true

  try {
    await apiInstance.post(apiPaths.oauthResetPassword, {
      email: email.value.trim()
    })
  } catch {
    // Ignore errors to avoid leaking account existence
  }

  loading.value = false
  $q.notify({ type: 'positive', message: t('passwordResetEmailSent') })
  await router.push('/login')
}
</script>

<style scoped>
</style>
