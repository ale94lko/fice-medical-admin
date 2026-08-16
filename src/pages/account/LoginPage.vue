<template>
  <div class="row justify-between login-container">
    <q-page :class="['login-card flex flex-center']">
      <q-img
        class="logo"
        src="logo.png"
        spinner-color="white"
      />
      <q-card class="my-card bg-grey-1">
        <form @submit.prevent.stop="handleSubmit">
          <q-card-section class="login-inputs">
            <template v-if="phase === 'password'">
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
            </template>
            <template v-else>
              <p class="text-body2 text-grey-7 q-mb-md">
                {{ t('loginMfaSubtitle') }}
              </p>
              <text-input
                v-model="mfaCode"
                icon-left="pin"
                test-id="input_mfa_code"
                :label="t('loginMfaCodeLabel')"
              />
            </template>
            <q-item-label v-if="loginError" class="login-error-msg">
              {{ loginError }}
            </q-item-label>
          </q-card-section>
          <q-card-actions>
            <q-btn
              color="primary"
              type="submit"
              class="full-width"
              :data-testid="phase === 'mfa'
                ? 'login-btn-mfa-verify'
                : 'login-btn-sign-in'"
              :label="phase === 'mfa'
                ? t('loginMfaVerify')
                : t('signIn')"
              :loading="loading">
            </q-btn>
            <div class="forgot-password-container">
              <q-item-label
                v-if="phase === 'password'"
                class="forgot-password"
                data-testid="login-link-forgot-password"
                @click="router.push('/reset-password')">
                {{ t('forgotPassword') }}
              </q-item-label>
              <q-item-label
                v-else
                class="forgot-password"
                data-testid="login-btn-mfa-back"
                @click="backToPassword">
                {{ t('loginMfaBack') }}
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
const mfaCode = ref('')
const mfaChallengeToken = ref('')
const phase = ref('password')

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

function backToPassword() {
  phase.value = 'password'
  mfaCode.value = ''
  mfaChallengeToken.value = ''
  loginError.value = ''
}

async function handleSubmit() {
  loginError.value = ''
  loading.value = true
  try {
    if (phase.value === 'mfa') {
      await handleMfa()
    } else {
      await handlePassword()
    }
  } finally {
    loading.value = false
  }
}

async function handlePassword() {
  isEmailInvalid.value = !!emailErrorMessage.value
  isPasswordInvalid.value = password.value.trim() === ''
  if (isEmailInvalid.value || isPasswordInvalid.value) {
    return
  }
  try {
    const result = await authStore.login(
      email.value.trim(),
      password.value,
      t,
    )
    if (result?.mfaRequired) {
      mfaChallengeToken.value = result.token
      mfaCode.value = ''
      phase.value = 'mfa'
      return
    }
    if (result) {
      loginError.value = ''
      await authStore.enterAppIfReady()
    }
  } catch (error) {
    loginError.value = error.message || t('networkError')
  }
}

async function handleMfa() {
  if (!mfaCode.value.trim()) {
    loginError.value = t('loginMfaCodeRequired')
    return
  }
  try {
    const ok = await authStore.completeMfaLogin(
      mfaChallengeToken.value,
      mfaCode.value,
      t,
    )
    if (ok) {
      loginError.value = ''
      await authStore.enterAppIfReady()
    }
  } catch (error) {
    loginError.value = error.message || t('networkError')
  }
}
</script>

<style scoped>
</style>
