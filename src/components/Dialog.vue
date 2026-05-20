<template>
  <q-dialog
    :transition-show="quasarTransitions.scale"
    :transition-hide="quasarTransitions.scale"
    :model-value="modelValue"
    :persistent="persistent"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card class="modal-card" :style="cardStyle">
      <q-toolbar class="q-px-md app-dialog-toolbar">
        <q-toolbar-title>{{ titleText }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          :disable="saving"
          :title="t('close')"
          :aria-label="t('close')"
          @click="close"
        />
      </q-toolbar>
      <q-form
        ref="formRef"
        class="q-gutter-none"
        greedy
        autocomplete="off"
        @submit.prevent="submit"
        @validation-error="onFormValidationError">
        <q-card-section
          class="q-px-xl q-py-md modal-body"
          :style="{ maxHeight: bodyMaxHeight, overflowY: cssOverflow.auto }">
          <div class="column no-wrap q-gutter-md">
            <div
              v-for="field in fields"
              v-show="showFieldRow(field)"
              class="dialog-field-row"
              :key="field.key">
              <q-input
                v-if="showPhoneField(field)"
                :model-value="form[field.key]"
                outlined
                :lazy-rules="'ondemand'"
                :readonly="isFieldReadonly(field)"
                :type="passwordVisibility.resolvedInputType(
                  field.key,
                  field.inputType || htmlInputTypes.text,
                )"
                :name="field.inputName"
                :autocomplete="plainInputAutocomplete(field)"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @blur="onFieldBlur(field)"
                @update:model-value="v => onPlainInputField(field, v)">
                <template
                  v-if="isPasswordInputType(field.inputType)
                    && !isFieldReadonly(field)"
                  #append>
                  <PasswordToggleIcon
                    :show-plain="passwordVisibility.isPlainVisible(field.key)"
                    @toggle="passwordVisibility.toggle(field.key)"
                  />
                </template>
              </q-input>
              <q-input
                v-else-if="isDialPrefixedPhoneField(field)"
                outlined
                :lazy-rules="'ondemand'"
                :type="htmlInputTypes.text"
                :inputmode="htmlInputModes.tel"
                :autocomplete="htmlAutocomplete.telNational"
                :model-value="form[field.key]"
                :readonly="isFieldReadonly(field)"
                :maxlength="phoneDisplayMaxLength(field)"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @keydown="ev => onDialPrefixedPhoneKeydown(field, ev)"
                @paste="ev => onDialPrefixedPhonePaste(field, ev)"
                @blur="onDialPrefixedPhoneBlur(field)"
                @update:model-value="v => onDialPrefixedPhoneInput(field, v)">
                <template #prepend>
                  <div class="row items-center no-wrap q-gutter-xs">
                    <component
                      :is="phoneFlagComponent(field)"
                      v-if="phoneFlagComponent(field)"/>
                    <span class="text-body2 text-grey-9">
                      (+{{dialMetaForField(field).dialDigits}})
                    </span>
                  </div>
                </template>
              </q-input>
              <div
                v-else-if="field.kind === fieldTypes.addressSuggest"
                class="column q-gutter-y-xs address-suggest-wrap">
                <q-input
                  v-model="form[field.key]"
                  outlined
                  :lazy-rules="'ondemand'"
                  :readonly="isFieldReadonly(field)"
                  :label="labelFor(field)"
                  :hint="addressSuggestHint(field)"
                  :rules="rulesFor(field)"
                  :loading="addressSuggestSlot(field).loading"
                  @blur="onFieldBlur(field)"
                  @update:model-value="v => onAddressSuggestInput(field, v)"/>
                <q-list
                  v-if="showAddressSuggestSlot(field)"
                  bordered
                  separator
                  class="rounded-borders bg-white address-suggest-list">
                  <q-item
                    v-for="(opt, idx) in addressSuggestSlot(field).options"
                    v-ripple
                    clickable
                    dense
                    :key="idx"
                    @mousedown.prevent="pickAddressSuggestion(
                      field, opt.value
                    )">
                    <q-item-section>{{ opt.label }}</q-item-section>
                  </q-item>
                </q-list>
              </div>
              <q-input
                v-else-if="field.kind === fieldTypes.textarea"
                v-model="form[field.key]"
                outlined
                input-class="dialog-textarea-inner"
                :lazy-rules="'ondemand'"
                :type="htmlInputTypes.textarea"
                :readonly="isFieldReadonly(field)"
                :rows="field.rows == null ? 3 : field.rows"
                :autogrow="field.autogrow !== false"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @blur="onFieldBlur(field)"/>
              <q-checkbox
                v-else-if="field.kind === fieldTypes.checkbox"
                v-model="form[field.key]"
                color="primary"
                class="dialog-checkbox-field"
                :disable="isFieldReadonly(field)"
                :label="labelFor(field)"/>
              <q-field
                v-else-if="field.kind === fieldTypes.permissionTree"
                outlined
                stack-label
                class="full-width permission-tree-qfield"
                :lazy-rules="'ondemand'"
                :model-value="form[field.key]"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                :readonly="isFieldReadonly(field)">
                <template #control>
                  <div
                    class="relative-position full-width permission-tree-scroll"
                    :class="{
                      'permission-tree-readonly': isFieldReadonly(field),
                    }">
                    <q-inner-loading
                      :showing="loadingFor(field)"
                      color="primary"/>
                    <q-tree
                      :nodes="treeNodesFor(field)"
                      node-key="nodeKey"
                      label-key="label"
                      children-key="children"
                      tick-strategy="leaf"
                      dense
                      no-connectors
                      default-expand-all
                      class="full-width q-pt-sm text-body2"
                      v-model:ticked="form[field.key]"
                      :no-nodes-label="
                        field.treeNoNodesLabelKey
                          ? t(field.treeNoNodesLabelKey)
                          : undefined
                      "/>
                  </div>
                </template>
              </q-field>
              <q-select
                v-else-if="field.kind === fieldTypes.select"
                v-model="form[field.key]"
                outlined
                emit-value
                map-options
                :lazy-rules="'ondemand'"
                :multiple="field.multiple === true"
                :use-chips="field.multiple === true"
                :behavior="qSelectBehaviorInModal(field)"
                :options="selectOptionsDisplayed(field)"
                :option-label="field.optionLabel || qSelectOptionKeys.label"
                :option-value="field.optionValue || qSelectOptionKeys.value"
                :label="labelFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                :loading="loadingFor(field)"
                :readonly="isFieldReadonly(field)"
                :disable="disableFor(field)"
                :clearable="field.clearable === true"
                @popup-show="() => onSelectPopupShow(field)"
                @update:model-value="v => onSelectModelValue(field, v)"
                @blur="onFieldBlur(field)">
                <template
                  v-if="!isFieldReadonly(field)"
                  #before-options>
                  <div class="select-options-search-wrap q-pa-sm bg-white">
                    <q-input
                      dense
                      outlined
                      clearable
                      :model-value="
                        String(selectFilterQueries[field.key] ?? '')
                      "
                      :placeholder="t('selectOptionsSearchPlaceholder')"
                      @update:model-value="
                        v => onSelectSearchInput(field, v)
                      "/>
                  </div>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            no-caps
            padding="7px 30px"
            outline
            color="primary"
            class="app-btn-outline"
            :title="t(cancelKey)"
            :label="t(cancelKey)"
            :disable="saving"
            @click="close"
          />
          <q-btn
            no-caps
            class="primary-action"
            color="primary"
            :type="htmlButtonTypes.submit"
            :title="t(submitKey)"
            :label="t(submitKey)"
            :loading="saving"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed, unref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clipboardMimeTypes,
  countryCodeUsa,
  cssOverflow,
  dialogEmitEvents,
  dialogI18nKeys,
  fieldTypes,
  htmlAutocomplete,
  htmlButtonTypes,
  htmlInputModes,
  htmlInputTypes,
  keyboardKeys,
  phoneInputNavKeys,
  qSelectOptionKeys,
  quasarNotifyTypes,
  quasarTransitions,
  selectBehaviors,
  tenantFieldKeys,
  typeNames,
} from './constants.js'
import {
  formatNationalPhoneDisplay,
  getCountryDialMeta,
  getTenantCountryIso3166Alpha2,
  nationalPhoneDisplayMaxLength,
  parseNationalPhoneDigits,
} from './helpers.js'
import UsFlagIcon from './UsFlagIcon.vue'
import PasswordToggleIcon from './PasswordToggleIcon.vue'
import {
  searchTenantAddressSuggestions,
} from 'src/services/tenant-address-search.js'
import {
  isPasswordInputType,
  usePasswordVisibilityByKey,
} from 'src/composables/usePasswordVisibility.js'

defineOptions({ name: 'AppDialog' })

const PHONE_FLAG_BY_COUNTRY = {
  USA: UsFlagIcon,
}

const passwordVisibility = usePasswordVisibilityByKey()

const DIAL_PHONE_NAV_KEYS = new Set(phoneInputNavKeys)

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  saving: { type: Boolean, default: false },
  titleKey: { type: String, default: '' },
  title: { type: String, default: '' },
  fields: { type: Array, required: true },
  cancelKey: { type: String, default: dialogI18nKeys.cancel },
  submitKey: { type: String, default: dialogI18nKeys.save },
  formatPayload: { type: Function, default: null },
  onOpen: { type: Function, default: null },
  initialValues: { type: Object, default: null },
  persistent: { type: Boolean, default: true },
  minWidth: { type: String, default: 'min(520px, 100vw - 24px)' },
  maxWidth: { type: String, default: '520px' },
  bodyMaxHeight: { type: String, default: 'min(520px, 70vh)' },
  editableKeysWhenEdit: { type: Array, default: null },
})

const emit = defineEmits([
  dialogEmitEvents.updateModelValue,
  dialogEmitEvents.save,
])

const { t } = useI18n()
const $q = useQuasar()

const formRef = ref(null)
const form = reactive({})
const selectFilterQueries = reactive({})
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

function showPhoneField(field) {
  return field.kind === fieldTypes.input
    && !field.phoneDialFromCountryField
}

function showFieldRow(field) {
  if (field.alwaysShow === true) {
    return true
  }
  return field.key !== tenantFieldKeys.status
    || props.initialValues != null
}

function qSelectBehaviorInModal(field) {
  return field.selectBehavior || selectBehaviors.menu
}

function isDialPrefixedPhoneField(field) {
  return field.kind === fieldTypes.input
    && Boolean(field.phoneDialFromCountryField)
}

function blankForKind(field) {
  if (!field) {
    return ''
  }
  if (field.kind === fieldTypes.checkbox) {
    return false
  }
  if (field.kind === fieldTypes.select) {
    if (field.multiple === true) {
      return []
    }

    return null
  }
  if (field.kind === fieldTypes.permissionTree) {
    return []
  }
  switch (field.kind) {
    case fieldTypes.textarea:
    case fieldTypes.input:
    case fieldTypes.addressSuggest:
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

function showAddressSuggestSlot(field) {
  return addressSuggestSlot(field).options.length > 0
    && !isFieldReadonly(field)
    && !isAddressSuggestWaitingForState(field)
}

function isAddressSuggestWaitingForState(field) {
  const stKey = field.addressStateField || tenantFieldKeys.state
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

function onPlainInputField(field, val) {
  if (typeof field.normalizeInput === 'function') {
    form[field.key] = field.normalizeInput(val ?? '')

    return
  }
  form[field.key] = val
}

function onAddressSuggestInput(field, val) {
  form[field.key] = val
  if (isFieldReadonly(field)) {
    return
  }
  const slot = addressSuggestSlot(field)
  const countryField = field.addressCountryField || tenantFieldKeys.country
  const stateField = field.addressStateField || tenantFieldKeys.state
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
        type: quasarNotifyTypes.warning,
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
    form[field.key] = field.defaultValue !== undefined
      ? field.defaultValue
      : blankForKind(field)
  }
}

function applyInitialValues() {
  const seed = props.initialValues
  if (seed && typeof seed === typeNames.object) {
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
  normalizePlainInputFields()
}

function normalizePlainInputFields() {
  for (const field of props.fields) {
    if (!field?.key || typeof field.normalizeInput !== 'function') {
      continue
    }
    form[field.key] = field.normalizeInput(form[field.key] ?? '')
  }
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
      passwordVisibility.clear()
      return
    }
    resetForm()
    if (typeof props.onOpen === typeNames.function) {
      await props.onOpen()
    }
    applyInitialValues()
    await nextTick()
    formRef.value?.resetValidation()
  },
)

watch(
  () => ({
    open: props.modelValue,
    country: form[tenantFieldKeys.country],
    state: form[tenantFieldKeys.state],
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
        f.phoneDialFromCountryField === tenantFieldKeys.country
        && f.key
        && countryChanged
      ) {
        form[f.key] = formatNationalPhoneDisplay(
          cur.country,
          form[f.key],
        )
      }
      if (f.kind === fieldTypes.addressSuggest && f.key) {
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
  if (ev.key === keyboardKeys.unidentified || ev.key === keyboardKeys.empty) {
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
  const clip = ev.clipboardData?.getData(clipboardMimeTypes.textPlain) ?? ''
  const cc = form[field.phoneDialFromCountryField]
  const cur = String(form[field.key] ?? '')
  const el = ev.target
  if (el
    && typeof el.selectionStart === typeNames.number
    && typeof el.selectionEnd === typeNames.number
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

function plainInputAutocomplete(field) {
  if (field && typeof field.autocomplete === typeNames.string) {
    return field.autocomplete
  }

  return undefined
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
  if (typeof o === typeNames.function) {
    return o() ?? []
  }

  return unref(o) ?? []
}

function treeNodesFor(field) {
  const n = field.treeNodes
  if (typeof n === typeNames.function) {
    return n() ?? []
  }

  return unref(n) ?? []
}

function selectOptionsDisplayed(field) {
  const all = optionsFor(field)
  if (isFieldReadonly(field)) {
    return all
  }
  const labelKey = field.optionLabel || qSelectOptionKeys.label
  const valueKey = field.optionValue || qSelectOptionKeys.value
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

function onSelectPopupShow(field) {
  if (isFieldReadonly(field)) {
    return
  }
  selectFilterQueries[field.key] = ''
}

function onSelectSearchInput(field, val) {
  if (isFieldReadonly(field)) {
    return
  }
  selectFilterQueries[field.key] = val ?? ''
}

function onSelectModelValue(field, value) {
  if (typeof field.afterModelUpdate !== 'function') {
    return
  }
  void field.afterModelUpdate(form, value, field)
}

function loadingFor(field) {
  if (field.loading == null) {
    return false
  }

  return unref(field.loading)
}

function disableFor(field) {
  if (typeof field.disable === typeNames.function) {
    return field.disable(form)
  }
  if (field.disable != null) {
    return unref(field.disable)
  }

  return false
}

function onFieldBlur(field) {
  if (typeof field.onBlur === typeNames.function) {
    field.onBlur(form)
  }
}

function close() {
  emit(dialogEmitEvents.updateModelValue, false)
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

function onFormValidationError() {
  $q.notify({
    type: quasarNotifyTypes.negative,
    icon: 'error',
    message: t('formValidationFixAllErrors'),
    position: 'top',
    timeout: 5000,
  })
}

function submit() {
  const payload = typeof props.formatPayload === typeNames.function
    ? props.formatPayload(form)
    : snapshotForm()
  emit(dialogEmitEvents.save, payload)
}
</script>

<style scoped>
  .primary-action {
    margin-left: 25px;
    padding: 7px 30px;
  }

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

  .select-options-search-wrap {
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .dialog-checkbox-field.q-checkbox.row.inline {
    display: flex !important;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .dialog-checkbox-field :deep(.q-checkbox__inner) {
    margin-left: -0.25em;
  }

  .permission-tree-scroll {
    max-height: 320px;
    overflow-y: auto;
  }

  .permission-tree-readonly {
    pointer-events: none;
    opacity: 0.72;
  }

  .permission-tree-qfield :deep(.q-field__control) {
    padding-top: 6px;
  }
</style>
