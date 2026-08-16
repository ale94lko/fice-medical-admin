<template>
  <q-dialog
    :model-value="true"
    :persistent="forced"
    :no-esc-dismiss="forced"
    :no-backdrop-dismiss="forced"
    transition-show="scale"
    transition-hide="scale"
    class="forced-mfa-enroll-dialog"
    data-testid="forced-mfa-enroll-dialog"
    @update:model-value="onDialogModel">
    <q-card class="forced-mfa-enroll-dialog__card app-dialog-card">
      <q-card-section class="forced-mfa-enroll-dialog__header">
        <div
          class="forced-mfa-enroll-dialog__icon-wrap"
          aria-hidden="true">
          <q-icon name="verified_user" size="26px" />
        </div>
        <h2 class="forced-mfa-enroll-dialog__title q-mb-none">
          {{ t('forcedMfaEnrollTitle') }}
        </h2>
      </q-card-section>

      <q-card-section class="forced-mfa-enroll-dialog__body">
        <p class="text-body2 text-grey-7 q-mb-md">
          {{ step === 'recovery'
            ? t('forcedMfaRecoverySubtitle')
            : t('forcedMfaEnrollSubtitle') }}
        </p>

        <div v-if="setupLoading" class="flex flex-center q-py-lg">
          <q-spinner color="primary" size="32px" />
        </div>

        <q-form
          v-else-if="step === 'setup'"
          greedy
          class="forced-mfa-enroll-dialog__form"
          @submit.prevent="onVerify">
          <img
            v-if="qrPng"
            class="forced-mfa-enroll-dialog__qr"
            :src="qrPng"
            :alt="t('forcedMfaQrAlt')"
          />
          <p
            v-if="secret"
            class="forced-mfa-enroll-dialog__secret">
            {{ secret }}
          </p>
          <text-input
            v-model="code"
            icon-left="pin"
            test-id="forced-mfa-enroll-input-code"
            :label="t('loginMfaCodeLabel')"
          />
          <p
            v-if="submitError"
            class="forced-mfa-enroll-dialog__error">
            {{ submitError }}
          </p>
          <q-btn
            no-caps
            unelevated
            color="primary"
            type="submit"
            class="full-width app-btn-primary"
            :loading="verifying"
            data-testid="forced-mfa-enroll-btn-submit"
            :label="t('loginMfaVerify')"
          />
          <q-btn
            v-if="!forced"
            no-caps
            flat
            class="full-width"
            data-testid="forced-mfa-enroll-btn-cancel"
            :label="t('cancel')"
            @click="emit('close')"
          />
        </q-form>

        <div v-else class="forced-mfa-enroll-dialog__form">
          <ul class="forced-mfa-enroll-dialog__codes">
            <li
              v-for="item in recoveryCodes"
              :key="item">
              {{ item }}
            </li>
          </ul>
          <q-btn
            no-caps
            unelevated
            color="primary"
            class="full-width app-btn-primary"
            data-testid="forced-mfa-enroll-btn-continue"
            :label="t('continue')"
            @click="onContinue"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import TextInput from 'components/TextInput.vue'
import { quasarNotifyTypes } from 'components/constants.js'
import { useAuthStore } from 'stores/auth-store.js'
import { setupMfa, verifyMfaSetup } from 'src/utils/mfa-api.js'

const props = defineProps({
  forced: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const $q = useQuasar()
const authStore = useAuthStore()

const setupLoading = ref(true)
const verifying = ref(false)
const step = ref('setup')
const qrPng = ref('')
const secret = ref('')
const code = ref('')
const recoveryCodes = ref([])
const submitError = ref('')

onMounted(async() => {
  try {
    const data = await setupMfa()
    qrPng.value = data?.qr_png_data_url || data?.qrPngDataUrl || ''
    secret.value = data?.secret || ''
  } catch {
    submitError.value = t('forcedMfaSetupFailed')
  } finally {
    setupLoading.value = false
  }
})

function onDialogModel(open) {
  if (!open && !props.forced) {
    emit('close')
  }
}

async function onVerify() {
  submitError.value = ''
  if (!code.value.trim()) {
    submitError.value = t('loginMfaCodeRequired')
    return
  }
  verifying.value = true
  try {
    const data = await verifyMfaSetup(code.value)
    const codes = data?.recovery_codes || data?.recoveryCodes || []
    recoveryCodes.value = Array.isArray(codes) ? codes : []
    step.value = 'recovery'
  } catch {
    submitError.value = t('loginMfaInvalidCode')
  } finally {
    verifying.value = false
  }
}

function onContinue() {
  authStore.completeMfaEnrollment()
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t('forcedMfaEnrollSuccess'),
  })
  emit('close')
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.forced-mfa-enroll-dialog {
  &__card {
    width: 100%;
    max-width: 440px;
    min-width: 280px;
  }

  &__header {
    padding: 24px 24px 8px;
    text-align: center;
  }

  &__icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 12px;
    border-radius: 50%;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    color: $text-strong;
  }

  &__body {
    padding: 8px 24px 24px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__qr {
    display: block;
    width: 200px;
    height: 200px;
    margin: 0 auto;
  }

  &__secret {
    margin: 0;
    font-family: monospace;
    font-size: 0.875rem;
    text-align: center;
    word-break: break-all;
    color: $text-strong;
  }

  &__codes {
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: monospace;
    font-size: 0.9375rem;
    text-align: center;
    line-height: 1.8;
  }

  &__error {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.4;
    color: $negative;
  }
}
</style>
