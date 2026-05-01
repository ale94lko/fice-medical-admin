import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSiteStore } from 'stores/site-store.js'
import {
  concatInternationalPhone,
  countryCodeUsa,
  getOfficialUtcOffsetTimezoneOptions,
  usStateOptions,
} from 'components/constants.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Tenant edit dialog: only these `field.key` values stay editable. */
export const TENANT_EDITABLE_KEYS_ON_EDIT = [
  'domain',
  'planId',
  'status',
  'timezone',
  'locale',
  'state',
  'contactEmail',
  'contactPhone',
  'contactAddress',
  'notes',
]

/** Letters-only segments → lowercase → underscores (tenant schema_name). */
function deriveSchemaNameFromTenantName(name) {
  const s = String(name ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  const runs = s.match(/\p{L}+/gu)
  if (!runs?.length) {
    return ''
  }
  return runs
    .map(r => r.toLowerCase())
    .join('_')
    .slice(0, 20)
}

export function useTenantAddForm() {
  const { t } = useI18n()
  const $q = useQuasar()
  const siteStore = useSiteStore()
  const plansLoading = ref(false)

  const countryOptions = computed(() => [
    { label: t('countryUnitedStates'), value: countryCodeUsa },
  ])

  const stateOptions = computed(() =>
    [...usStateOptions].sort((a, b) => a.label.localeCompare(b.label)),
  )

  /** Visible labels; values are API locale codes (e.g. en_US). */
  const localeOptions = computed(() => [
    { label: t('languageEnglish'), value: 'en_US' },
    { label: t('languageSpanish'), value: 'es_US' },
  ])

  const timezoneOptions = computed(() => getOfficialUtcOffsetTimezoneOptions())

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')
    const selectRequiredRule = val =>
      (val != null && String(val).trim().length > 0) || t('fieldRequired')
    const emailRule = val => {
      const v = String(val ?? '').trim()
      if (!v) {
        return t('fieldRequired')
      }
      return EMAIL_RE.test(v) || t('invalidEmail')
    }
    const tenantNameLettersRule = val =>
      deriveSchemaNameFromTenantName(val) !== ''
      || t('tenantNameLettersRequired')

    return [
      {
        key: 'name',
        kind: 'input',
        labelKey: 'name',
        rules: [requiredRule, tenantNameLettersRule],
      },
      {
        key: 'domain',
        kind: 'input',
        labelKey: 'domain',
        rules: [requiredRule],
      },
      {
        key: 'planId',
        kind: 'select',
        labelKey: 'planName',
        rules: [selectRequiredRule],
        options: () => siteStore.planSelectOptions,
        loading: plansLoading,
      },
      {
        key: 'status',
        kind: 'select',
        labelKey: 'status',
        selectBehavior: 'menu',
        rules: [selectRequiredRule],
        options: () => [
          { label: t('tenantStatusActive'), value: 1 },
          { label: t('tenantStatusInactive'), value: 0 },
        ],
        defaultValue: 1,
      },
      {
        key: 'timezone',
        kind: 'select',
        labelKey: 'timezone',
        rules: [selectRequiredRule],
        options: timezoneOptions,
        defaultValue: 'UTC-08:00',
        useInput: true,
      },
      {
        key: 'locale',
        kind: 'select',
        labelKey: 'language',
        rules: [selectRequiredRule],
        options: localeOptions,
        defaultValue: 'en_US',
      },
      {
        key: 'country',
        kind: 'select',
        labelKey: 'country',
        rules: [selectRequiredRule],
        options: countryOptions,
        defaultValue: countryCodeUsa,
      },
      {
        key: 'state',
        kind: 'select',
        labelKey: 'state',
        rules: [selectRequiredRule],
        options: stateOptions,
        disable: form => !form.country,
      },
      {
        key: 'contactEmail',
        kind: 'input',
        labelKey: 'contactEmail',
        inputType: 'email',
        rules: [requiredRule, emailRule],
      },
      {
        key: 'contactPhone',
        kind: 'input',
        labelKey: 'contactPhone',
        phoneDialFromCountryField: 'country',
        rules: [requiredRule],
      },
      {
        key: 'contactAddress',
        kind: 'addressSuggest',
        labelKey: 'contactAddress',
        hintKey: 'contactAddressHint',
        addressCountryField: 'country',
        addressStateField: 'state',
        rules: [requiredRule],
      },
      {
        key: 'notes',
        kind: 'textarea',
        labelKey: 'notes',
        rows: 4,
        autogrow: false,
      },
    ]
  })

  async function onDialogOpen() {
    plansLoading.value = true
    try {
      await siteStore.getPlans()
    } catch {
      $q.notify({
        type: 'negative',
        message: t('plansLoadError'),
      })
    } finally {
      plansLoading.value = false
    }
  }

  function formatTenantPayload(form) {
    return {
      name: form.name.trim(),
      domain: form.domain.trim(),
      planId: Number(form.planId),
      schemaName: deriveSchemaNameFromTenantName(form.name),
      timezone: String(form.timezone ?? '').trim(),
      locale: String(form.locale ?? '').trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: concatInternationalPhone(
        form.country,
        form.contactPhone.trim(),
      ),
      contactAddress: form.contactAddress.trim(),
      notes: form.notes.trim(),
      state: String(form.state ?? '').trim(),
      country: String(form.country ?? '').trim(),
    }
  }

  function formatTenantUpdatePayload(form) {
    const shaped = {
      domain: form.domain.trim(),
      timezone: String(form.timezone ?? '').trim(),
      locale: String(form.locale ?? '').trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: concatInternationalPhone(
        form.country,
        form.contactPhone.trim(),
      ),
      contactAddress: form.contactAddress.trim(),
      notes: form.notes.trim(),
      state: String(form.state ?? '').trim(),
    }
    const out = {}
    for (const key of TENANT_EDITABLE_KEYS_ON_EDIT) {
      if (key === 'status') {
        const s = form.status
        if (s === 0 || s === 1) {
          out.status = Number(s)
        }
        continue
      }
      if (key === 'planId') {
        const v = Number(form.planId)
        if (Number.isFinite(v)) {
          out.planId = v
        }
        continue
      }
      if (Object.prototype.hasOwnProperty.call(shaped, key)) {
        out[key] = shaped[key]
      }
    }
    return out
  }

  return {
    fields,
    onDialogOpen,
    formatTenantPayload,
    formatTenantUpdatePayload,
  }
}
