import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useSiteStore } from 'stores/site-store.js'
import {
  countryCodeUsa,
  fieldTypes,
  inputNormalizeKeys,
  htmlAutocomplete,
  htmlInputTypes,
  localeCodes,
  quasarNotifyTypes,
  selectBehaviors,
  tenantFieldKeys,
  tenantFormDefaults,
  tenantFormSectionIds,
  clinicTypeValues,
  usStateOptions,
} from 'components/constants.js'
import {
  concatInternationalPhone,
  getOfficialUtcOffsetTimezoneOptions,
} from 'components/helpers.js'
import {
  isValidEin,
  normalizeEinDigits,
} from 'src/utils/ein.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const sid = tenantFormSectionIds

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
  tenantFieldKeys.legalBusinessName,
  tenantFieldKeys.taxId,
  tenantFieldKeys.billingEmail,
  tenantFieldKeys.billingPhone,
  tenantFieldKeys.billingAddress,
  tenantFieldKeys.sameAsContactAddress,
  tenantFieldKeys.logoFile,
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

function optionalTrimmed(value) {
  const v = String(value ?? '').trim()

  return v || ''
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

  const clinicTypeOptions = computed(() => [
    {
      label: t('clinicTypePrimaryCare'),
      value: clinicTypeValues.primaryCare,
    },
    {
      label: t('clinicTypeSpecialty'),
      value: clinicTypeValues.specialty,
    },
    {
      label: t('clinicTypeBehavioralHealth'),
      value: clinicTypeValues.behavioralHealth,
    },
    {
      label: t('clinicTypeUrgentCare'),
      value: clinicTypeValues.urgentCare,
    },
    {
      label: t('clinicTypeTelehealth'),
      value: clinicTypeValues.telehealth,
    },
    {
      label: t('clinicTypeMultiSpecialty'),
      value: clinicTypeValues.multiSpecialty,
    },
  ])

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
    const optionalEmailRule = val => {
      const v = String(val ?? '').trim()
      if (!v) {
        return true
      }
      return EMAIL_RE.test(v) || t('invalidEmail')
    }
    const tenantNameLettersRule = val =>
      deriveSchemaNameFromTenantName(val) !== ''
      || t('tenantNameLettersRequired')
    const taxIdRule = val =>
      isValidEin(val) || t('taxIdEinInvalid')

    const tk = tenantFieldKeys
    return [
      {
        key: '_headingBasic',
        kind: fieldTypes.heading,
        icon: 'business',
        labelKey: 'tenantSectionBasic',
        omitFromPayload: true,
        alwaysShow: true,
        reserveValidationSpace: false,
      },
      {
        key: tk.logoFile,
        kind: fieldTypes.logo,
        sectionId: sid.basic,
        alwaysShow: true,
        reserveValidationSpace: false,
      },
      {
        key: tk.name,
        kind: fieldTypes.input,
        sectionId: sid.basic,
        labelKey: tk.name,
        placeholderKey: 'tenantNamePlaceholder',
        required: true,
        layoutAside: true,
        rules: [requiredRule, tenantNameLettersRule],
      },
      {
        key: tk.mainSubtenantName,
        kind: fieldTypes.input,
        sectionId: sid.basic,
        labelKey: 'mainSubtenantName',
        placeholderKey: 'mainSubtenantNamePlaceholder',
        createOnly: true,
        required: true,
        layoutAside: true,
        rules: [requiredRule, tenantNameLettersRule],
      },
      {
        key: tk.clinicType,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: 'clinicType',
        createOnly: true,
        required: true,
        layoutAside: true,
        rules: [selectRequiredRule],
        options: clinicTypeOptions,
        defaultValue: tenantFormDefaults.clinicType,
      },
      {
        key: tk.domain,
        kind: fieldTypes.input,
        sectionId: sid.basic,
        labelKey: tk.domain,
        placeholderKey: 'tenantDomainPlaceholder',
        required: true,
        rules: [requiredRule],
        inputNormalizeKey: inputNormalizeKeys.tenantDomain,
      },
      {
        key: tk.planId,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: 'planName',
        placeholderKey: 'tenantPlanPlaceholder',
        required: true,
        rules: [selectRequiredRule],
        options: () => siteStore.planSelectOptions,
        loading: plansLoading,
      },
      {
        key: tk.status,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: tk.status,
        selectBehavior: selectBehaviors.menu,
        required: true,
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
        sectionId: sid.basic,
        labelKey: tk.timezone,
        placeholderKey: 'tenantTimezonePlaceholder',
        required: true,
        rules: [selectRequiredRule],
        options: timezoneOptions,
        defaultValue: tenantFormDefaults.timezonePicker,
      },
      {
        key: tk.locale,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: 'language',
        placeholderKey: 'tenantLanguagePlaceholder',
        required: true,
        rules: [selectRequiredRule],
        options: localeOptions,
        defaultValue: localeCodes.enUs,
      },
      {
        key: tk.country,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: tk.country,
        placeholderKey: 'tenantCountryPlaceholder',
        required: true,
        rules: [selectRequiredRule],
        options: countryOptions,
        defaultValue: countryCodeUsa,
      },
      {
        key: tk.state,
        kind: fieldTypes.select,
        sectionId: sid.basic,
        labelKey: tk.state,
        placeholderKey: 'tenantStatePlaceholder',
        required: true,
        rules: [selectRequiredRule],
        options: stateOptions,
        disable: form => !form[tk.country],
      },
      {
        key: '_headingContact',
        kind: fieldTypes.heading,
        icon: 'contact_mail',
        labelKey: 'tenantSectionContact',
        omitFromPayload: true,
        alwaysShow: true,
        reserveValidationSpace: false,
      },
      {
        key: tk.contactEmail,
        kind: fieldTypes.input,
        sectionId: sid.contact,
        labelKey: tk.contactEmail,
        placeholderKey: 'contactEmailPlaceholder',
        inputType: htmlInputTypes.email,
        prependIcon: 'email',
        autocomplete: htmlAutocomplete.email,
        required: true,
        rules: [requiredRule, emailRule],
      },
      {
        key: tk.contactPhone,
        kind: fieldTypes.input,
        sectionId: sid.contact,
        labelKey: tk.contactPhone,
        placeholderKey: 'contactPhonePlaceholder',
        phoneDialFromCountryField: tk.country,
        required: true,
        rules: [requiredRule],
      },
      {
        key: tk.contactAddress,
        kind: fieldTypes.addressSuggest,
        sectionId: sid.contact,
        labelKey: tk.contactAddress,
        placeholderKey: 'contactAddressPlaceholder',
        hintKey: 'contactAddressHint',
        addressCountryField: tk.country,
        addressStateField: tk.state,
        required: true,
        rules: [requiredRule],
      },
      {
        key: tk.notes,
        kind: fieldTypes.textarea,
        sectionId: sid.contact,
        labelKey: 'notesOptional',
        placeholderKey: 'tenantNotesPlaceholder',
        rows: 4,
        autogrow: false,
      },
      {
        key: '_headingLegal',
        kind: fieldTypes.heading,
        icon: 'account_balance',
        labelKey: 'tenantSectionLegal',
        hintKey: 'tenantSectionLegalHelper',
        omitFromPayload: true,
        alwaysShow: true,
        reserveValidationSpace: false,
      },
      {
        key: tk.legalBusinessName,
        kind: fieldTypes.input,
        sectionId: sid.legal,
        labelKey: 'legalBusinessName',
        placeholderKey: 'legalBusinessNamePlaceholder',
      },
      {
        key: tk.taxId,
        kind: fieldTypes.input,
        sectionId: sid.legal,
        labelKey: 'taxIdEin',
        placeholderKey: 'taxIdEinPlaceholder',
        hintKey: 'taxIdEinHint',
        inputNormalizeKey: inputNormalizeKeys.ein,
        maxlength: 10,
        required: true,
        rules: [requiredRule, taxIdRule],
      },
      {
        key: tk.billingEmail,
        kind: fieldTypes.input,
        sectionId: sid.legal,
        labelKey: 'billingEmail',
        placeholderKey: 'billingEmailPlaceholder',
        inputType: htmlInputTypes.email,
        prependIcon: 'email',
        autocomplete: htmlAutocomplete.email,
        rules: [optionalEmailRule],
      },
      {
        key: tk.billingPhone,
        kind: fieldTypes.input,
        sectionId: sid.legal,
        labelKey: 'billingPhone',
        placeholderKey: 'contactPhonePlaceholder',
        phoneDialFromCountryField: tk.country,
        optional: true,
      },
      {
        key: tk.billingAddress,
        kind: fieldTypes.addressSuggest,
        sectionId: sid.legal,
        labelKey: 'billingAddress',
        placeholderKey: 'billingAddressPlaceholder',
        hintKey: 'contactAddressHint',
        addressCountryField: tk.country,
        addressStateField: tk.state,
      },
      {
        key: tk.sameAsContactAddress,
        kind: fieldTypes.checkbox,
        sectionId: sid.legal,
        labelKey: 'sameAsContactAddress',
        captionKey: 'sameAsContactAddressHint',
        omitFromPayload: true,
        afterModelUpdate: (form, value) => {
          if (value) {
            form[tk.billingAddress] = form[tk.contactAddress] || ''
          }
        },
      },
      {
        key: '_headingCredentials',
        kind: fieldTypes.heading,
        icon: 'badge',
        labelKey: 'tenantSectionCredentials',
        hintKey: 'tenantSectionCredentialsHelper',
        omitFromPayload: true,
        alwaysShow: true,
        reserveValidationSpace: false,
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

  function formatLegalBilling(form, tk) {
    const phone = optionalTrimmed(form[tk.billingPhone])

    return {
      [tk.legalBusinessName]: optionalTrimmed(form[tk.legalBusinessName]),
      [tk.taxId]: normalizeEinDigits(form[tk.taxId]),
      [tk.billingEmail]: optionalTrimmed(form[tk.billingEmail]),
      [tk.billingPhone]: phone
        ? concatInternationalPhone(form[tk.country], phone)
        : '',
      [tk.billingAddress]: optionalTrimmed(form[tk.billingAddress]),
    }
  }

  function formatTenantPayload(form) {
    const tk = tenantFieldKeys
    return {
      [tk.name]: form[tk.name].trim(),
      [tk.mainSubtenantName]: String(
        form[tk.mainSubtenantName] ?? '',
      ).trim() || form[tk.name].trim(),
      [tk.clinicType]: String(form[tk.clinicType] ?? '').trim(),
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
      ...formatLegalBilling(form, tk),
      [tk.logoFile]: form[tk.logoFile] instanceof File
        ? form[tk.logoFile]
        : null,
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
      ...formatLegalBilling(form, tk),
    }
    const out = {}
    for (const key of TENANT_EDITABLE_KEYS_ON_EDIT) {
      if (key === tk.sameAsContactAddress) {
        continue
      }
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
    if (form[tk.logoFile] instanceof File) {
      out[tk.logoFile] = form[tk.logoFile]
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
