<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center']">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleLogin">
          <q-card-section class="login-inputs">
            <text-input
              v-model="email"
              icon-left="mail"
              test-id="input_email"
              :label="t('email')"
              :error-message="emailErrorMessage"
              :error="isEmailInvalid"
            />
            <text-input
              v-model="password"
              icon-left="lock"
              type="password"
              test-id="input_password"
              :label="t('password')"
              :error-message="passwordErrorMessage"
              :error="isPasswordInvalid"
            />
            <q-item-label v-if="loginError" class="login-error-msg">
              {{ loginError }}
            </q-item-label>
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              type="submit"
              class="full-width"
              data-testid="login-btn-sign-in"
              :label="t('signIn')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                class="forgot-password"
                data-testid="login-link-forgot-password"
                @click="router.push('/reset-password')">
                {{ t('forgotPassword') }}
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
import { useI18n } from 'vue-i18n'
import { useAuthStore } from 'stores/auth-store'

import TextInput from 'components/TextInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const isEmailInvalid = ref(false)
const isPasswordInvalid = ref(false)
const loginError = ref('')
const loading = ref(false)

const emailErrorMessage = computed(() => {
  const valid = /.+@.+\..+/.test(email.value)
  return email.value.trim() === ''
    ? 'Email is required'
    : (!valid ? 'Please enter a valid email address' : '')
})

const passwordErrorMessage = computed(() => {
  return password.value.trim() === '' ? 'Password is required' : ''
})

const { t } = useI18n()

async function handleLogin() {
  isEmailInvalid.value = !!emailErrorMessage.value
  isPasswordInvalid.value = password.value.trim() === ''
  loading.value = true

  if (!isEmailInvalid.value && !isPasswordInvalid.value) {
    try {
      const result = await authStore.login(
        email.value.trim(),
        password.value,
        t
      )
      if (result) {
        loginError.value = ''
        await router.push('/dashboard')
      }
    } catch (error) {
      loginError.value = error.message || t('networkError')
    }
  }
  loading.value = false
}

</script>

<style scoped>
</style>
