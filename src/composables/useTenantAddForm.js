import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSiteStore } from 'stores/site-store.js'
import {
  countryCodeUsa,
  fieldTypes,
  inputNormalizeKeys,
  htmlInputTypes,
  localeCodes,
  quasarNotifyTypes,
  selectBehaviors,
  tenantFieldKeys,
  tenantFormDefaults,
  usStateOptions,
} from 'components/constants.js'
import {
  concatInternationalPhone,
  getOfficialUtcOffsetTimezoneOptions,
} from 'components/helpers.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const TENANT_EDITABLE_KEYS_ON_EDIT = [
  tenantFieldKeys.domain,
  tenantFieldKeys.planId,
  tenantFieldKeys.status,
  tenantFieldKeys.timezone,
  tenantFieldKeys.locale,
  tenantFieldKeys.state,
  tenantFieldKeys.contactEmail,
  tenantFieldKeys.contactPhone,
  tenantFieldKeys.contactAddress,
  tenantFieldKeys.notes,
]

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

  const localeOptions = computed(() => [
    { label: t('languageEnglish'), value: localeCodes.enUs },
    { label: t('languageSpanish'), value: localeCodes.esUs },
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

    const tk = tenantFieldKeys
    return [
      {
        key: tk.name,
        kind: fieldTypes.input,
        labelKey: tk.name,
        rules: [requiredRule, tenantNameLettersRule],
      },
      {
        key: tk.mainSubtenantName,
        kind: fieldTypes.input,
        labelKey: 'mainSubtenantName',
        createOnly: true,
        rules: [requiredRule, tenantNameLettersRule],
      },
      {
        key: tk.domain,
        kind: fieldTypes.input,
        labelKey: tk.domain,
        rules: [requiredRule],
        inputNormalizeKey: inputNormalizeKeys.tenantDomain,
      },
      {
        key: tk.planId,
        kind: fieldTypes.select,
        labelKey: 'planName',
        rules: [selectRequiredRule],
        options: () => siteStore.planSelectOptions,
        loading: plansLoading,
      },
      {
        key: tk.status,
        kind: fieldTypes.select,
        labelKey: tk.status,
        selectBehavior: selectBehaviors.menu,
        rules: [selectRequiredRule],
        options: () => [
          { label: t('tenantStatusActive'), value: 1 },
          { label: t('tenantStatusInactive'), value: 0 },
        ],
        defaultValue: tenantFormDefaults.statusActive,
      },
      {
        key: tk.timezone,
        kind: fieldTypes.select,
        labelKey: tk.timezone,
        rules: [selectRequiredRule],
        options: timezoneOptions,
        defaultValue: tenantFormDefaults.timezonePicker,
      },
      {
        key: tk.locale,
        kind: fieldTypes.select,
        labelKey: 'language',
        rules: [selectRequiredRule],
        options: localeOptions,
        defaultValue: localeCodes.enUs,
      },
      {
        key: tk.country,
        kind: fieldTypes.select,
        labelKey: tk.country,
        rules: [selectRequiredRule],
        options: countryOptions,
        defaultValue: countryCodeUsa,
      },
      {
        key: tk.state,
        kind: fieldTypes.select,
        labelKey: tk.state,
        rules: [selectRequiredRule],
        options: stateOptions,
        disable: form => !form[tk.country],
      },
      {
        key: tk.contactEmail,
        kind: fieldTypes.input,
        labelKey: tk.contactEmail,
        inputType: htmlInputTypes.email,
        rules: [requiredRule, emailRule],
      },
      {
        key: tk.contactPhone,
        kind: fieldTypes.input,
        labelKey: tk.contactPhone,
        phoneDialFromCountryField: tk.country,
        rules: [requiredRule],
      },
      {
        key: tk.contactAddress,
        kind: fieldTypes.addressSuggest,
        labelKey: tk.contactAddress,
        hintKey: 'contactAddressHint',
        addressCountryField: tk.country,
        addressStateField: tk.state,
        rules: [requiredRule],
      },
      {
        key: tk.notes,
        kind: fieldTypes.textarea,
        labelKey: tk.notes,
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
        type: quasarNotifyTypes.negative,
        message: t('plansLoadError'),
      })
    } finally {
      plansLoading.value = false
    }
  }

  function formatTenantPayload(form) {
    const tk = tenantFieldKeys
    return {
      [tk.name]: form[tk.name].trim(),
      [tk.mainSubtenantName]: form[tk.mainSubtenantName].trim(),
      [tk.domain]: form[tk.domain].trim(),
      [tk.planId]: Number(form[tk.planId]),
      [tk.schemaName]: deriveSchemaNameFromTenantName(form[tk.name]),
      [tk.timezone]: String(form[tk.timezone] ?? '').trim(),
      [tk.locale]: String(form[tk.locale] ?? '').trim(),
      [tk.contactEmail]: form[tk.contactEmail].trim(),
      [tk.contactPhone]: concatInternationalPhone(
        form[tk.country],
        form[tk.contactPhone].trim(),
      ),
      [tk.contactAddress]: form[tk.contactAddress].trim(),
      [tk.notes]: form[tk.notes].trim(),
      [tk.state]: String(form[tk.state] ?? '').trim(),
      [tk.country]: String(form[tk.country] ?? '').trim(),
    }
  }

  function formatTenantUpdatePayload(form) {
    const tk = tenantFieldKeys
    const shaped = {
      [tk.domain]: form[tk.domain].trim(),
      [tk.timezone]: String(form[tk.timezone] ?? '').trim(),
      [tk.locale]: String(form[tk.locale] ?? '').trim(),
      [tk.contactEmail]: form[tk.contactEmail].trim(),
      [tk.contactPhone]: concatInternationalPhone(
        form[tk.country],
        form[tk.contactPhone].trim(),
      ),
      [tk.contactAddress]: form[tk.contactAddress].trim(),
      [tk.notes]: form[tk.notes].trim(),
      [tk.state]: String(form[tk.state] ?? '').trim(),
    }
    const out = {}
    for (const key of TENANT_EDITABLE_KEYS_ON_EDIT) {
      if (key === tk.status) {
        const s = form[tk.status]
        if (s === 0 || s === 1) {
          out[tk.status] = Number(s)
        }
        continue
      }
      if (key === tk.planId) {
        const v = Number(form[tk.planId])
        if (Number.isFinite(v)) {
          out[tk.planId] = v
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
