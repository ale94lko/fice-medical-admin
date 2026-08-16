<template>
  <q-dialog
    :transition-show="quasarTransitions.scale"
    :transition-hide="quasarTransitions.scale"
    :model-value="modelValue"
    :persistent="persistent"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="modal-card insurance-dialog app-dialog-card"
      :style="cardStyle"
      :data-testid="dialogTestId">
      <AppDialogHeader
        :close-label="t('close')"
        :disable-close="saving"
        :close-test-id="tid('btn', 'close')"
        :info="subtitleText"
        :info-test-id="tid('btn', 'info')"
        @close="close">
        {{ titleText }}
      </AppDialogHeader>
      <q-form
        ref="formRef"
        class="q-gutter-none app-dialog-form"
        greedy
        novalidate
        autocomplete="off"
        @submit.prevent="onFormSubmit"
        @validation-error="onFormValidationError">
        <q-card-section
          class="app-dialog-card__body q-px-lg q-pt-md q-pb-md"
          :class="hasSections
            ? 'dialog-form-sections'
            : 'app-dialog-form-stack'"
          :style="bodySectionStyle">
          <DialogFormSection
            v-for="block in layoutBlocks"
            :key="block.id"
            :plain="!block.section"
            :model-value="sectionExpanded[block.id]"
            :title="sectionTitle(block.section)"
            :helper="sectionHelper(block.section)"
            :badge="sectionBadge(block.section)"
            :badge-tone="block.section?.badgeTone || ''"
            :test-id="block.section
              ? tid('section', block.id)
              : ''"
            :toggle-test-id="block.section
              ? tid('section', block.id, 'toggle')
              : ''"
            @update:model-value="v => setSectionExpanded(block.id, v)">
          <template
            v-for="field in block.fields"
            :key="field.key">
          <div
            v-if="showFieldRow(field)"
            class="dialog-field-row"
            :class="{
              'dialog-field-row--full':
                field.kind === fieldTypes.textarea
                || field.kind === fieldTypes.permissionTree
                || field.kind === fieldTypes.heading
                || field.kind === fieldTypes.checkbox
                || isOptionCardPickerField(field)
                || field.kind === fieldTypes.addressSuggest,
              'dialog-field-row--logo':
                field.kind === fieldTypes.logo,
            }"
            :style="logoRowStyle(field)">
              <div
                v-if="field.kind === fieldTypes.heading"
                class="dialog-section-heading">
                <div class="dialog-section-heading__row">
                  <span
                    v-if="field.icon"
                    class="dialog-section-heading__icon"
                    aria-hidden="true">
                    <q-icon
                      :name="field.icon"
                      size="20px"/>
                  </span>
                  <div class="dialog-section-heading__title">
                    {{ labelFor(field) }}
                  </div>
                </div>
                <p
                  v-if="hintFor(field)"
                  class="dialog-section-heading__hint text-body2
                    text-grey-7 q-mb-none">
                  {{ hintFor(field) }}
                </p>
              </div>
              <div
                v-else-if="field.kind === fieldTypes.logo"
                class="dialog-logo-field">
                <CompanyLogoField
                  :model-value="form[field.key]"
                  :disabled="isFieldReadonly(field)"
                  :test-id="resolveFieldTestId(field)"
                  @update:model-value="
                    v => onLogoFieldUpdate(field, v)
                  "
                />
              </div>
              <q-input
                v-else-if="showPhoneField(field)"
                :data-testid="resolveFieldTestId(field)"
                :model-value="form[field.key]"
                outlined
                dense
                :lazy-rules="lazyRulesFor(field)"
                :reactive-rules="hasRules(field)"
                :readonly="isFieldReadonly(field)"
                :type="passwordVisibility.resolvedInputType(
                  field.key,
                  field.inputType || htmlInputTypes.text,
                )"
                :name="field.inputName"
                :autocomplete="plainInputAutocomplete(field)"
                :label="labelFor(field)"
                :placeholder="placeholderFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                :maxlength="field.maxlength"
                @blur="onFieldBlur(field)"
                @keydown="ev => onPlainTextKeydown(field, ev)"
                @paste="ev => onPlainTextPaste(field, ev)"
                @update:model-value="v => onPlainInputField(field, v)">
                <template
                  v-if="field.prependIcon"
                  #prepend>
                  <q-icon :name="field.prependIcon"/>
                </template>
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
                :data-testid="resolveFieldTestId(field)"
                outlined
                dense
                :lazy-rules="lazyRulesFor(field)"
                :reactive-rules="hasRules(field)"
                :type="htmlInputTypes.text"
                :inputmode="htmlInputModes.tel"
                :autocomplete="htmlAutocomplete.telNational"
                :model-value="form[field.key]"
                :readonly="isFieldReadonly(field)"
                :maxlength="phoneDisplayMaxLength(field)"
                :label="labelFor(field)"
                :placeholder="placeholderFor(field)"
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
                  dense
                  :data-testid="resolveFieldTestId(field)"
                  :lazy-rules="lazyRulesFor(field)"
                  :reactive-rules="hasRules(field)"
                  :readonly="isFieldReadonly(field)"
                  :label="labelFor(field)"
                  :placeholder="placeholderFor(field)"
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
                    :data-testid="tid('field', field.key, 'suggestion', idx)"
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
                :data-testid="resolveFieldTestId(field)"
                outlined
                input-class="dialog-textarea-inner"
                :lazy-rules="lazyRulesFor(field)"
                :reactive-rules="hasRules(field)"
                :type="htmlInputTypes.textarea"
                :readonly="isFieldReadonly(field)"
                :rows="field.rows == null ? 3 : field.rows"
                :autogrow="field.autogrow !== false"
                :label="labelFor(field)"
                :placeholder="placeholderFor(field)"
                :hint="hintFor(field)"
                :rules="rulesFor(field)"
                @blur="onFieldBlur(field)"/>
              <div
                v-else-if="field.kind === fieldTypes.checkbox"
                class="dialog-checkbox-wrap">
                <q-checkbox
                  v-model="form[field.key]"
                  :data-testid="resolveFieldTestId(field)"
                  color="primary"
                  class="dialog-checkbox-field"
                  :disable="isFieldReadonly(field)"
                  :label="labelFor(field)"
                  @update:model-value="
                    v => onSelectModelValue(field, v)
                  "/>
                <div
                  v-if="captionFor(field)"
                  class="dialog-checkbox-caption text-body2
                    text-grey-7">
                  {{ captionFor(field) }}
                </div>
              </div>
              <div
                v-else-if="field.kind === fieldTypes.permissionTree"
                class="dialog-option-picker"
                :data-testid="resolveFieldTestId(field)">
                <div class="dialog-option-picker__label">
                  {{ labelFor(field) }}
                </div>
                <PermissionModulePicker
                  v-model="form[field.key]"
                  class="full-width"
                  :nodes="treeNodesFor(field)"
                  :readonly="
                    isFieldReadonly(field) || disableFor(field)
                  "
                  :loading="loadingFor(field)"
                  :test-id="tid('field', field.key, 'tree')"
                  :empty-label="
                    field.treeNoNodesLabelKey
                      ? t(field.treeNoNodesLabelKey)
                      : undefined
                  "
                />
                <q-field
                  v-if="hasRules(field)"
                  borderless
                  hide-bottom-space
                  class="dialog-option-picker__rules"
                  :model-value="form[field.key]"
                  :rules="rulesFor(field)"/>
              </div>
              <div
                v-else-if="isOptionCardPickerField(field)"
                class="dialog-option-picker"
                :data-testid="resolveFieldTestId(field)">
                <div class="dialog-option-picker__label">
                  {{ labelFor(field) }}
                </div>
                <RoleOptionPicker
                  v-model="form[field.key]"
                  class="full-width"
                  :options="optionsFor(field)"
                  :readonly="
                    isFieldReadonly(field) || disableFor(field)
                  "
                  :loading="loadingFor(field)"
                  :test-id="tid('field', field.key, 'picker')"
                  :empty-label="pickerEmptyLabel(field)"
                  :default-icon="
                    field.optionIcon
                      || (field.key === planFieldKeys.modules
                        ? 'view_module'
                        : '')
                  "
                  :item-key="pickerItemKey(field)"
                  @update:model-value="
                    v => onSelectModelValue(field, v)
                  "
                />
                <q-field
                  v-if="hasRules(field)"
                  borderless
                  hide-bottom-space
                  class="dialog-option-picker__rules"
                  :model-value="form[field.key]"
                  :rules="rulesFor(field)"/>
              </div>
              <q-select
                v-else-if="field.kind === fieldTypes.select"
                v-model="form[field.key]"
                :data-testid="resolveFieldTestId(field)"
                outlined
                dense
                emit-value
                map-options
                :lazy-rules="lazyRulesFor(field)"
                :reactive-rules="hasRules(field)"
                :multiple="field.multiple === true"
                :use-chips="field.multiple === true"
                :behavior="qSelectBehaviorInModal(field)"
                :options="selectOptionsDisplayed(field)"
                :option-label="field.optionLabel || qSelectOptionKeys.label"
                :option-value="field.optionValue || qSelectOptionKeys.value"
                :label="labelFor(field)"
                :placeholder="placeholderFor(field)"
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
                      :data-testid="tid('field', field.key, 'search')"
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
          </template>
          </DialogFormSection>
        </q-card-section>
        <q-card-actions
          :align="footerHintText ? 'between' : 'right'"
          class="app-dialog-card__actions"
          :class="{
            'app-dialog-card__actions--with-hint': footerHintText,
          }">
          <div
            v-if="footerHintText"
            class="dialog-form-footer-hint">
            <q-icon
              name="info"
              size="18px"
              color="info"/>
            <span>{{ footerHintText }}</span>
          </div>
          <div class="dialog-form-footer-actions">
            <q-btn
              no-caps
              outline
              color="primary"
              class="app-btn-outline"
              :data-testid="tid('btn', 'cancel')"
              :title="t(cancelKey)"
              :label="t(cancelKey)"
              :disable="saving"
              @click="close"
            />
            <q-btn
              no-caps
              unelevated
              class="primary-action"
              color="primary"
              :data-testid="tid('btn', 'save')"
              :type="htmlButtonTypes.submit"
              :title="t(submitKey)"
              :label="t(submitKey)"
              :loading="saving"
            />
          </div>
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
  dialogEmitEvents,
  dialogI18nKeys,
  fieldTypes,
  inputNormalizeKeys,
  htmlAutocomplete,
  htmlButtonTypes,
  htmlInputModes,
  htmlInputTypes,
  keyboardKeys,
  phoneInputNavKeys,
  planFieldKeys,
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
  sanitizeRoleNameInput,
  sanitizeTenantDomainInput,
} from './helpers.js'
import UsFlagIcon from './UsFlagIcon.vue'
import PasswordToggleIcon from './PasswordToggleIcon.vue'
import AppDialogHeader from './AppDialogHeader.vue'
import DialogFormSection from './DialogFormSection.vue'
import PermissionModulePicker from './PermissionModulePicker.vue'
import RoleOptionPicker from './RoleOptionPicker.vue'
import CompanyLogoField from './CompanyLogoField.vue'
import {
  searchTenantAddressSuggestions,
} from 'src/services/tenant-address-search.js'
import { sanitizeEinInput } from 'src/utils/ein.js'
import {
  isPasswordInputType,
  usePasswordVisibilityByKey,
} from 'src/composables/usePasswordVisibility.js'
import {
  fieldTestId as buildFieldTestId,
  testId as buildTestId,
} from 'src/utils/test-id.js'

defineOptions({ name: 'AppDialog' })

const PHONE_FLAG_BY_COUNTRY = {
  USA: UsFlagIcon,
}

const passwordVisibility = usePasswordVisibilityByKey()

const DIAL_PHONE_NAV_KEYS = new Set(phoneInputNavKeys)

const INPUT_NORMALIZER_CONFIG = {
  [inputNormalizeKeys.roleName]: {
    sanitize: sanitizeRoleNameInput,
    allowKey: key => /^[a-zA-Z_ ]$/.test(key),
  },
  [inputNormalizeKeys.tenantDomain]: {
    sanitize: sanitizeTenantDomainInput,
    allowKey: key => /^[a-zA-Z0-9_]$/.test(key),
  },
  [inputNormalizeKeys.ein]: {
    sanitize: sanitizeEinInput,
    allowKey: key => /^[0-9-]$/.test(key),
  },
}

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
  afterOpen: { type: Function, default: null },
  initialValues: { type: Object, default: null },
  persistent: { type: Boolean, default: true },
  minWidth: { type: String, default: 'min(720px, 100vw - 24px)' },
  maxWidth: { type: String, default: '920px' },
  bodyMaxHeight: { type: String, default: 'min(720px, 82vh)' },
  editableKeysWhenEdit: { type: Array, default: null },
  testIdPrefix: { type: String, default: 'form-dialog' },
  sections: { type: Array, default: null },
  subtitleKey: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  footerHintKey: { type: String, default: '' },
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
const sectionExpanded = reactive({})

const titleText = computed(() => {
  if (props.title) {
    return props.title
  }
  if (props.titleKey) {
    return t(props.titleKey)
  }

  return ''
})

const subtitleText = computed(() => {
  if (props.subtitle) {
    return props.subtitle
  }
  if (props.subtitleKey) {
    return t(props.subtitleKey)
  }

  return ''
})

const footerHintText = computed(() => {
  if (!props.footerHintKey) {
    return ''
  }

  return t(props.footerHintKey)
})

const hasSections = computed(() =>
  Array.isArray(props.sections) && props.sections.length > 0,
)

const bodySectionStyle = computed(() => {
  if (hasSections.value) {
    return undefined
  }

  return { maxHeight: props.bodyMaxHeight }
})

const layoutBlocks = computed(() => {
  if (!hasSections.value) {
    return [{ id: 'all', section: null, fields: props.fields }]
  }

  return props.sections.map(section => ({
    id: section.id,
    section,
    fields: props.fields.filter(f => f.sectionId === section.id),
  }))
})

const dialogTestId = computed(() => buildTestId(props.testIdPrefix, 'dialog'))

function tid(...parts) {
  return buildTestId(props.testIdPrefix, ...parts)
}

function resolveFieldTestId(field) {
  return buildFieldTestId(props.testIdPrefix, field.key, field.testId)
}

const cardStyle = computed(() => ({
  width: props.minWidth,
  maxWidth: props.maxWidth,
}))

function isFieldReadonly(field) {
  if (field.readonly === true) {
    return true
  }
  const allowed = props.editableKeysWhenEdit
  if (!allowed?.length) {
    return false
  }

  return !allowed.includes(field.key)
}

function shouldValidateField(field) {
  if (field.createOnly && props.editableKeysWhenEdit?.length) {
    return false
  }
  if (isFieldReadonly(field)) {
    return false
  }

  return true
}

function showPhoneField(field) {
  return field.kind === fieldTypes.input
    && !field.phoneDialFromCountryField
}

function showFieldRow(field) {
  if (field.createOnly && props.editableKeysWhenEdit?.length) {
    return false
  }
  if (field.alwaysShow === true) {
    return true
  }
  return field.key !== tenantFieldKeys.status
    || props.initialValues != null
}

function logoRowStyle(field) {
  if (field.kind !== fieldTypes.logo) {
    return undefined
  }
  const idx = props.fields.findIndex(f => f.key === field.key)
  if (idx < 0) {
    return undefined
  }
  let span = 0
  for (const next of props.fields.slice(idx + 1)) {
    if (next.layoutAside !== true) {
      break
    }
    if (showFieldRow(next)) {
      span += 1
    }
  }

  return {
    '--dialog-logo-row-span': String(Math.max(span, 1)),
  }
}

function isOptionCardPickerField(field) {
  return field.kind === fieldTypes.rolePicker
    || field.kind === fieldTypes.modulePicker
    || field.key === planFieldKeys.modules
}

function pickerEmptyLabel(field) {
  if (field.emptyLabelKey) {
    return t(field.emptyLabelKey)
  }
  if (isOptionCardPickerField(field)
    && field.kind !== fieldTypes.rolePicker) {
    return t('modulePickerEmpty')
  }

  return undefined
}

function pickerItemKey(field) {
  if (field.key === planFieldKeys.modules
    || field.kind === fieldTypes.modulePicker) {
    return 'module'
  }

  return 'role'
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
  if (field.kind === fieldTypes.logo) {
    return null
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
  if (isOptionCardPickerField(field)) {
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

function resolveInputNormalizerConfig(field) {
  const key = field?.inputNormalizeKey
  if (key && INPUT_NORMALIZER_CONFIG[key]) {
    return INPUT_NORMALIZER_CONFIG[key]
  }
  if (typeof field?.normalizeInput === 'function') {
    return {
      sanitize: field.normalizeInput,
      allowKey: () => true,
    }
  }

  return null
}

function onPlainInputField(field, val) {
  const cfg = resolveInputNormalizerConfig(field)
  if (cfg) {
    form[field.key] = cfg.sanitize(val ?? '')

    return
  }
  form[field.key] = val
}

function onPlainTextKeydown(field, ev) {
  const cfg = resolveInputNormalizerConfig(field)
  if (!cfg) {
    return
  }
  if (ev.ctrlKey || ev.metaKey || ev.altKey) {
    return
  }
  if (ev.key.length !== 1) {
    return
  }
  if (!cfg.allowKey(ev.key)) {
    ev.preventDefault()
  }
}

function onPlainTextPaste(field, ev) {
  const cfg = resolveInputNormalizerConfig(field)
  if (!cfg) {
    return
  }
  ev.preventDefault()
  const pasted = ev.clipboardData?.getData('text') ?? ''
  const current = String(form[field.key] ?? '')
  const el = ev.target
  let merged = current + pasted
  if (el instanceof HTMLInputElement) {
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    merged = current.slice(0, start) + pasted + current.slice(end)
  }
  form[field.key] = cfg.sanitize(merged)
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
    const cfg = resolveInputNormalizerConfig(field)
    if (!field?.key || !cfg) {
      continue
    }
    form[field.key] = cfg.sanitize(form[field.key] ?? '')
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
    resetSectionExpanded()
    if (typeof props.onOpen === typeNames.function) {
      await props.onOpen()
    }
    applyInitialValues()
    if (typeof props.afterOpen === typeNames.function) {
      await props.afterOpen(form)
    }
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
  const base = field.labelKey ? t(field.labelKey) : (field.label || '')
  if (field.required) {
    return `${base} *`
  }

  return base
}

function placeholderFor(field) {
  return field.placeholderKey ? t(field.placeholderKey) : undefined
}

function captionFor(field) {
  return field.captionKey ? t(field.captionKey) : ''
}

function sectionTitle(section) {
  if (!section) {
    return ''
  }

  return section.titleKey ? t(section.titleKey) : (section.title || '')
}

function sectionHelper(section) {
  if (!section?.helperKey) {
    return ''
  }

  return t(section.helperKey)
}

function sectionBadge(section) {
  if (!section?.badgeKey) {
    return ''
  }

  return t(section.badgeKey)
}

function setSectionExpanded(id, value) {
  if (!id) {
    return
  }
  sectionExpanded[id] = value
}

function resetSectionExpanded() {
  for (const key of Object.keys(sectionExpanded)) {
    delete sectionExpanded[key]
  }
  for (const section of props.sections || []) {
    sectionExpanded[section.id] = section.defaultExpanded !== false
  }
}

function expandAllSections() {
  for (const section of props.sections || []) {
    sectionExpanded[section.id] = true
  }
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

function hasRules(field) {
  if (!shouldValidateField(field)) {
    return false
  }

  return Boolean(rulesFor(field)?.length)
}

function lazyRulesFor(field) {
  if (field.lazyRules === false) {
    return false
  }
  if (field.inputType === htmlInputTypes.email) {
    return false
  }

  return 'ondemand'
}

/** Reserves q-field bottom slot height (matches validated fields). */
function validationSpacerRule() {
  return true
}

function rulesFor(field) {
  if (!shouldValidateField(field)) {
    return undefined
  }
  const list = []
  if (field.rules?.length) {
    list.push(...field.rules)
  }
  if (field.phoneDialFromCountryField) {
    list.push(val => {
      const cc = form[field.phoneDialFromCountryField]
      const digits = parseNationalPhoneDigits(cc, val)
      const country = cc || countryCodeUsa
      if (!digits.length && field.optional) {
        return true
      }
      if (country === countryCodeUsa) {
        return digits.length === 10 || t('invalidPhone')
      }

      return true
    })
  }
  if (
    !list.length
    && field.kind !== fieldTypes.checkbox
    && field.kind !== fieldTypes.logo
    && field.kind !== fieldTypes.heading
    && field.reserveValidationSpace !== false
  ) {
    list.push(validationSpacerRule)
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

function onLogoFieldUpdate(field, value) {
  form[field.key] = value
}

function close() {
  emit(dialogEmitEvents.updateModelValue, false)
}

function snapshotForm() {
  const out = {}
  for (const field of props.fields) {
    if (field?.key && field.omitFromPayload !== true) {
      out[field.key] = form[field.key]
    }
  }

  return out
}

function onFormValidationError() {
  expandAllSections()
  $q.notify({
    type: quasarNotifyTypes.negative,
    icon: 'error',
    message: t('formValidationFixAllErrors'),
    position: 'top',
    timeout: 5000,
  })
}

async function onFormSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    onFormValidationError()
    return
  }
  const payload = typeof props.formatPayload === typeNames.function
    ? props.formatPayload(form)
    : snapshotForm()
  emit(dialogEmitEvents.save, payload)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';
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

  .dialog-field-row--logo {
    align-self: start;
    width: 100%;
    min-width: 0;
    grid-row: span var(--dialog-logo-row-span, 1);
  }

  .dialog-logo-field {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .dialog-logo-field :deep(.company-logo-field) {
    width: 100%;
  }

  .dialog-logo-field :deep(.company-logo-field__preview) {
    width: 100%;
    height: 160px;
  }

  .dialog-logo-field :deep(.company-logo-field__actions) {
    width: 100%;
  }

  .dialog-logo-field :deep(.company-logo-field__actions .q-btn) {
    width: 100%;
  }

  @media (max-width: 599px) {
    .dialog-field-row--logo {
      width: 100%;
      max-width: none;
      grid-column: 1 / -1;
      grid-row: auto;
    }
  }

  .dialog-field-row :deep(.q-field--outlined .q-field__bottom) {
    min-height: 20px;
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

  .dialog-option-picker {
    width: 100%;
    min-width: 0;
  }

  .dialog-option-picker__label {
    margin: 0 0 8px;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.2;
    color: $text-muted;
  }

  .dialog-option-picker__rules {
    min-height: 0;
  }

  .dialog-form-sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    min-height: 0;
  }

  .app-dialog-card__actions--with-hint {
    justify-content: space-between;
  }

  .dialog-form-footer-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 0 auto;
    min-width: 0;
    margin-right: auto;
    margin-left: 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: #e0f2fe;
    color: $text-strong;
    font-size: 0.8125rem;
    line-height: 1.4;
    white-space: nowrap;
  }

  .dialog-form-footer-actions {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;
    gap: 12px;

    > .q-btn {
      margin: 0;
    }
  }

  .dialog-checkbox-caption {
    margin: -4px 0 0 28px;
  }

  .dialog-section-heading {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    min-width: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid $border-subtle;
  }

  .dialog-field-row:not(:first-child) .dialog-section-heading {
    margin-top: 8px;
  }

  .dialog-section-heading__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dialog-section-heading__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  .dialog-section-heading__title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.3;
    color: $text-strong;
  }

  .dialog-section-heading__hint {
    margin: 0;
  }

  .dialog-field-row :deep(
    .q-field--outlined:not(.q-textarea) .q-field__control
  ) {
    min-height: 40px;
    height: 40px;
  }

  .dialog-field-row :deep(
    .q-field--outlined:not(.q-textarea) .q-field__marginal
  ) {
    height: 40px;
  }
</style>
