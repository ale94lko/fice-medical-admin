<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="persistent"
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card class="modal-card" :style="cardStyle">
      <q-toolbar class="q-px-md bg-teal-10 text-white">
        <q-toolbar-title>{{ titleText }}</q-toolbar-title>
        <q-btn flat round dense icon="close" :disable="saving" @click="close" />
      </q-toolbar>
      <q-form ref="formRef" class="q-gutter-none" @submit.prevent="submit">
        <q-card-section
          class="q-px-xl q-py-md modal-body"
          :style="{ maxHeight: bodyMaxHeight, overflowY: 'auto' }">
          <div class="column q-gutter-sm">
            <div
              v-for="field in fields"
              :key="field.key"
              v-show="field.key !== 'status' || initialValues != null"
              class="dialog-field-row"
            >
              <q-input
                v-if="
                  field.kind === 'input' && !field.phoneDialFromCountryField
                "
                v-model="form[field.key]"
                outlined
                lazy-rules
                :readonly="isFieldReadonly(field)"
                :type="field.inputType || 'text'"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @blur="onFieldBlur(field)"
              />
              <q-input
                v-else-if="field.kind === 'input'"
                :model-value="form[field.key]"
                outlined
                lazy-rules
                type="text"
                :readonly="isFieldReadonly(field)"
                :maxlength="phoneDisplayMaxLength(field)"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                inputmode="tel"
                autocomplete="tel-national"
                @keydown="ev => onDialPrefixedPhoneKeydown(field, ev)"
                @paste="ev => onDialPrefixedPhonePaste(field, ev)"
                @update:model-value="v => onDialPrefixedPhoneInput(field, v)"
                @blur="onDialPrefixedPhoneBlur(field)"
              >
                <template #prepend>
                  <div class="row items-center no-wrap q-gutter-xs">
                    <component
                      :is="phoneFlagComponent(field)"
                      v-if="phoneFlagComponent(field)"
                    />
                    <span class="text-body2 text-grey-9">(+{{
                      dialMetaForField(field).dialDigits
                    }})</span>
                  </div>
                </template>
              </q-input>
              <div
                v-else-if="field.kind === 'addressSuggest'"
                class="column q-gutter-y-xs address-suggest-wrap"
              >
                <q-input
                  v-model="form[field.key]"
                  outlined
                  lazy-rules
                  :readonly="isFieldReadonly(field)"
                  :label="labelFor(field)"
                  :hint="addressSuggestHint(field)"
                  :rules="rulesFor(field)"
                  :loading="addressSuggestSlot(field).loading"
                  @update:model-value="v => onAddressSuggestInput(field, v)"
                  @blur="onFieldBlur(field)"
                />
                <q-list
                  v-if="
                    addressSuggestSlot(field).options.length > 0
                    && !isFieldReadonly(field)
                    && !isAddressSuggestWaitingForState(field)
                  "
                  bordered
                  separator
                  class="rounded-borders bg-white address-suggest-list"
                >
                  <q-item
                    v-for="(opt, idx) in addressSuggestSlot(field).options"
                    :key="idx"
                    v-ripple
                    clickable
                    dense
                    @mousedown.prevent="
                      pickAddressSuggestion(field, opt.value)
                    "
                  >
                    <q-item-section>{{ opt.label }}</q-item-section>
                  </q-item>
                </q-list>
              </div>
              <q-input
                v-else-if="field.kind === 'textarea'"
                v-model="form[field.key]"
                outlined
                type="textarea"
                :readonly="isFieldReadonly(field)"
                :rows="field.rows == null ? 3 : field.rows"
                :autogrow="field.autogrow !== false"
                input-class="dialog-textarea-inner"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @blur="onFieldBlur(field)"
              />
              <q-select
                v-else-if="field.kind === 'select'"
                v-model="form[field.key]"
                outlined
                emit-value
                map-options
                :behavior="field.selectBehavior || 'default'"
                lazy-rules
                :options="selectOptionsDisplayed(field)"
                :option-label="field.optionLabel || 'label'"
                :option-value="field.optionValue || 'value'"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                :loading="loadingFor(field)"
                :readonly="isFieldReadonly(field)"
                :disable="disableFor(field)"
                :use-input="field.useInput === true && !isFieldReadonly(field)"
                :hide-selected="field.useInput === true"
                :fill-input="field.useInput === true"
                input-debounce="0"
                @filter="(val, update) => onSelectFilter(val, update, field)"
                @blur="onFieldBlur(field)"
              />
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            color="secondary"
            class="text-teal-10"
            :label="t(cancelKey)"
            :disable="saving"
            @click="close"
          />
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            type="submit"
            :label="t(submitKey)"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  countryCodeUsa,
  formatNationalPhoneDisplay,
  getCountryDialMeta,
  getTenantCountryIso3166Alpha2,
  nationalPhoneDisplayMaxLength,
  parseNationalPhoneDigits,
} from 'components/constants.js'
import UsFlagIcon from 'components/UsFlagIcon.vue'
import {
  searchTenantAddressSuggestions,
} from 'src/services/tenant-address-search.js'

defineOptions({ name: 'AppDialog' })

const PHONE_FLAG_BY_COUNTRY = {
  USA: UsFlagIcon,
}

/** Allow; block other printable keys so only digits reach the NANP field. */
const DIAL_PHONE_NAV_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End',
])

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  saving: { type: Boolean, default: false },
  /** i18n key for toolbar title (used if `title` is empty). */
  titleKey: { type: String, default: '' },
  /** Raw title when not using i18n. */
  title: { type: String, default: '' },
  /**
   * Field definitions: key, kind, labelKey, hintKey, inputType, rules,
   * options, defaultValue, disable, loading, onBlur, useInput (filterable
   * select), phoneDialFromCountryField (prepend flag + +NN),
   * textarea: optional `rows`, `autogrow` (default true),
   * addressSuggest: `addressCountryField`, `addressStateField` (suggestions
   * only after state is chosen; Google if VITE_GOOGLE_MAPS_API_KEY), …
   */
  fields: { type: Array, required: true },
  cancelKey: { type: String, default: 'cancel' },
  submitKey: { type: String, default: 'save' },
  /**
   * (form) => payload. If omitted, emits a shallow snapshot of form keys
   * listed in fields.
   */
  formatPayload: { type: Function, default: null },
  /** Called when the dialog opens (after form reset). */
  onOpen: { type: Function, default: null },
  /**
   * Partial values merged onto the form after reset (e.g. edit mode).
   * Only keys that exist in `fields` are applied.
   */
  initialValues: { type: Object, default: null },
  persistent: { type: Boolean, default: true },
  /** CSS value, e.g. `min(520px, 100vw - 24px)` */
  minWidth: { type: String, default: 'min(520px, 100vw - 24px)' },
  maxWidth: { type: String, default: '520px' },
  /** Scroll area max-height, e.g. `min(520px, 70vh)` */
  bodyMaxHeight: { type: String, default: 'min(520px, 70vh)' },
  /**
   * When non-empty, every field whose `key` is not in this list is
   * `readonly` (e.g. tenant edit: name and country locked).
   */
  editableKeysWhenEdit: { type: Array, default: null },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const $q = useQuasar()

const formRef = ref(null)
const form = reactive({})
/** IANA search text per field when `field.useInput` is true. */
const selectFilterQueries = reactive({})
/** Photon suggestions per `addressSuggest` field key. */
const addressSuggestByKey = reactive({})
const addressSuggestTimers = {}

const titleText = computed(() => {
  if (props.title) {
    return props.title
  }
  if (props.titleKey) {
    return t(props.titleKey)
  }
  return ''
})

const cardStyle = computed(() => ({
  width: props.minWidth,
  maxWidth: props.maxWidth,
}))

function isFieldReadonly(field) {
  const allowed = props.editableKeysWhenEdit
  if (!allowed?.length) {
    return false
  }
  return !allowed.includes(field.key)
}

function blankForKind(kind) {
  switch (kind) {
    case 'select':
      return null
    case 'textarea':
    case 'input':
    case 'addressSuggest':
    default:
      return ''
  }
}

function clearSelectFilterQueries() {
  for (const k of Object.keys(selectFilterQueries)) {
    delete selectFilterQueries[k]
  }
}

function addressSuggestSlot(field) {
  const k = field.key
  if (!addressSuggestByKey[k]) {
    addressSuggestByKey[k] = { options: [], loading: false }
  }
  return addressSuggestByKey[k]
}

function isAddressSuggestWaitingForState(field) {
  const stKey = field.addressStateField || 'state'
  const st = form[stKey]
  return st == null || String(st).trim() === ''
}

function addressSuggestHint(field) {
  if (isAddressSuggestWaitingForState(field)) {
    return t('contactAddressSelectStateHint')
  }
  return hintFor(field)
}

function clearAddressSuggestState() {
  for (const k of Object.keys(addressSuggestTimers)) {
    clearTimeout(addressSuggestTimers[k])
    delete addressSuggestTimers[k]
  }
  for (const k of Object.keys(addressSuggestByKey)) {
    addressSuggestByKey[k].options = []
    addressSuggestByKey[k].loading = false
  }
}

function onAddressSuggestInput(field, val) {
  form[field.key] = val
  if (isFieldReadonly(field)) {
    return
  }
  const slot = addressSuggestSlot(field)
  const countryField = field.addressCountryField || 'country'
  const stateField = field.addressStateField || 'state'
  const iso = getTenantCountryIso3166Alpha2(form[countryField])
  const stateVal = form[stateField]
  const q = String(val ?? '').trim()
  if (addressSuggestTimers[field.key]) {
    clearTimeout(addressSuggestTimers[field.key])
    delete addressSuggestTimers[field.key]
  }
  if (isAddressSuggestWaitingForState(field)) {
    slot.options = []
    return
  }
  if (q.length < 3) {
    slot.options = []
    return
  }
  addressSuggestTimers[field.key] = setTimeout(async() => {
    delete addressSuggestTimers[field.key]
    const cur = String(form[field.key] ?? '').trim()
    if (cur.length < 3 || isAddressSuggestWaitingForState(field)) {
      slot.options = []
      return
    }
    slot.loading = true
    try {
      slot.options = await searchTenantAddressSuggestions(
        cur,
        iso,
        stateVal,
      )
    } catch {
      slot.options = []
      $q.notify({
        type: 'warning',
        message: t('addressSearchFailed'),
      })
    } finally {
      slot.loading = false
    }
  }, 400)
}

function pickAddressSuggestion(field, line) {
  form[field.key] = line
  addressSuggestSlot(field).options = []
  if (addressSuggestTimers[field.key]) {
    clearTimeout(addressSuggestTimers[field.key])
    delete addressSuggestTimers[field.key]
  }
}

function resetForm() {
  clearSelectFilterQueries()
  for (const field of props.fields) {
    if (!field?.key) {
      continue
    }
    const v = field.defaultValue !== undefined
      ? field.defaultValue
      : blankForKind(field.kind)
    form[field.key] = v
  }
}

function applyInitialValues() {
  const seed = props.initialValues
  if (seed && typeof seed === 'object') {
    const keys = new Set(props.fields.map(f => f?.key).filter(Boolean))
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(seed, key)) {
        continue
      }
      const val = seed[key]
      if (val !== undefined) {
        form[key] = val
      }
    }
  }
  normalizeDialPrefixedPhoneFields()
}

function normalizeDialPrefixedPhoneFields() {
  for (const field of props.fields) {
    if (!field.phoneDialFromCountryField || !field.key) {
      continue
    }
    const cc = form[field.phoneDialFromCountryField]
    form[field.key] = formatNationalPhoneDisplay(cc, form[field.key])
  }
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) {
      clearAddressSuggestState()
      return
    }
    resetForm()
    applyInitialValues()
    if (typeof props.onOpen === 'function') {
      await props.onOpen()
    }
  },
)

watch(
  () => ({
    open: props.modelValue,
    country: form.country,
    state: form.state,
  }),
  (cur, prev) => {
    if (!cur.open || !prev?.open) {
      return
    }
    const countryChanged = cur.country !== prev.country
    const stateChanged = cur.state !== prev.state
    if (!countryChanged && !stateChanged) {
      return
    }
    for (const f of props.fields) {
      if (
        f.phoneDialFromCountryField === 'country'
        && f.key
        && countryChanged
      ) {
        form[f.key] = formatNationalPhoneDisplay(cur.country, form[f.key])
      }
      if (f.kind === 'addressSuggest' && f.key) {
        addressSuggestSlot(f).options = []
        if (addressSuggestTimers[f.key]) {
          clearTimeout(addressSuggestTimers[f.key])
          delete addressSuggestTimers[f.key]
        }
      }
    }
  },
)

function phoneFlagComponent(field) {
  if (!field.phoneDialFromCountryField) {
    return null
  }
  const cc = form[field.phoneDialFromCountryField] || countryCodeUsa
  return PHONE_FLAG_BY_COUNTRY[cc] ?? PHONE_FLAG_BY_COUNTRY[countryCodeUsa]
}

function phoneDisplayMaxLength(field) {
  if (!field.phoneDialFromCountryField) {
    return undefined
  }
  const cc = form[field.phoneDialFromCountryField] || countryCodeUsa
  return nationalPhoneDisplayMaxLength(cc)
}

function onDialPrefixedPhoneKeydown(field, ev) {
  if (isFieldReadonly(field)) {
    return
  }
  if (ev.isComposing) {
    return
  }
  if (DIAL_PHONE_NAV_KEYS.has(ev.key)) {
    return
  }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) {
    return
  }
  if (ev.key === 'Unidentified' || ev.key === '') {
    return
  }
  if (/^[0-9]$/.test(ev.key)) {
    return
  }
  ev.preventDefault()
}

function onDialPrefixedPhonePaste(field, ev) {
  if (isFieldReadonly(field)) {
    return
  }
  ev.preventDefault()
  const clip = ev.clipboardData?.getData('text/plain') ?? ''
  const cc = form[field.phoneDialFromCountryField]
  const cur = String(form[field.key] ?? '')
  const el = ev.target
  if (
    el
    && typeof el.selectionStart === 'number'
    && typeof el.selectionEnd === 'number'
  ) {
    const { selectionStart: start, selectionEnd: end } = el
    const merged = cur.slice(0, start) + clip + cur.slice(end)
    form[field.key] = formatNationalPhoneDisplay(cc, merged)
    return
  }
  form[field.key] = formatNationalPhoneDisplay(cc, clip)
}

function onDialPrefixedPhoneInput(field, val) {
  if (isFieldReadonly(field)) {
    return
  }
  const cc = form[field.phoneDialFromCountryField]
  form[field.key] = formatNationalPhoneDisplay(cc, val ?? '')
}

function onDialPrefixedPhoneBlur(field) {
  if (!isFieldReadonly(field)) {
    const cc = form[field.phoneDialFromCountryField]
    form[field.key] = formatNationalPhoneDisplay(cc, form[field.key] ?? '')
  }
  onFieldBlur(field)
}

function dialMetaForField(field) {
  const refKey = field.phoneDialFromCountryField
  const cc = refKey ? form[refKey] : null
  return getCountryDialMeta(cc)
}

function labelFor(field) {
  return field.labelKey ? t(field.labelKey) : (field.label || '')
}

function hintFor(field) {
  return field.hintKey ? t(field.hintKey) : (field.hint || undefined)
}

function rulesFor(field) {
  const list = []
  if (field.rules?.length) {
    list.push(...field.rules)
  }
  if (field.phoneDialFromCountryField) {
    list.push(val => {
      const cc = form[field.phoneDialFromCountryField]
      const digits = parseNationalPhoneDigits(cc, val)
      const country = cc || countryCodeUsa
      if (country === countryCodeUsa) {
        return digits.length === 10 || t('invalidPhone')
      }
      return true
    })
  }
  return list.length ? list : undefined
}

function optionsFor(field) {
  const o = field.options
  if (typeof o === 'function') {
    return o() ?? []
  }
  return unref(o) ?? []
}

function selectOptionsDisplayed(field) {
  const all = optionsFor(field)
  if (!field.useInput) {
    return all
  }
  const labelKey = field.optionLabel || 'label'
  const valueKey = field.optionValue || 'value'
  const q = String(selectFilterQueries[field.key] ?? '').toLowerCase().trim()
  if (!q) {
    return all
  }
  return all.filter(opt => {
    const lab = String(opt[labelKey] ?? '').toLowerCase()
    const val = String(opt[valueKey] ?? '').toLowerCase()
    return lab.includes(q) || val.includes(q)
  })
}

function onSelectFilter(val, update, field) {
  if (!field.useInput) {
    update(() => {})
    return
  }
  update(() => {
    selectFilterQueries[field.key] = val
  })
}

function loadingFor(field) {
  if (field.loading == null) {
    return false
  }
  return unref(field.loading)
}

function disableFor(field) {
  if (typeof field.disable === 'function') {
    return field.disable(form)
  }
  if (field.disable != null) {
    return unref(field.disable)
  }
  return false
}

function onFieldBlur(field) {
  if (typeof field.onBlur === 'function') {
    field.onBlur(form)
  }
}

function close() {
  emit('update:modelValue', false)
}

function snapshotForm() {
  const out = {}
  for (const field of props.fields) {
    if (field?.key) {
      out[field.key] = form[field.key]
    }
  }
  return out
}

async function submit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  const payload = typeof props.formatPayload === 'function'
    ? props.formatPayload(form)
    : snapshotForm()
  emit('save', payload)
}
</script>

<style scoped>
.primary-action {
  margin-left: 25px;
  padding: 7px 30px;
}

/* q-input forwards input-class to the native control (textarea). */
:deep(.dialog-textarea-inner) {
  min-height: 6.5rem;
  resize: vertical;
}

.address-suggest-list {
  max-height: 220px;
  overflow-y: auto;
}

.dialog-field-row {
  width: 100%;
  min-width: 0;
}
</style>
