<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    :transition-show="quasarTransitions.scale"
    :transition-hide="quasarTransitions.scale"
    @update:model-value="emit('update:modelValue', $event)">
    <q-card
      class="modal-card app-dialog-card app-dialog-card--lg catalog-form-card"
      :style="cardStyle">
      <q-toolbar class="app-dialog-toolbar">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          :disable="saving"
          :title="t('close')"
          :aria-label="t('close')"
          @click="close"/>
      </q-toolbar>
      <q-form
        ref="formRef"
        greedy
        novalidate
        autocomplete="off"
        @submit.prevent="submit">
        <q-card-section
          class="app-dialog-body catalog-form-body"
          :style="bodyStyle">
          <div class="catalog-form-fields">
            <q-input
              v-model="form[ck.name]"
              outlined
              dense
              :label="t('catalogName')"
              :rules="[requiredRule]"/>
            <q-select
              v-model="form[ck.scope]"
              outlined
              dense
              emit-value
              map-options
              :options="scopeOptions"
              :label="t('catalogScope')"
              :behavior="selectBehaviors.menu"
              :rules="[requiredRule]"/>
            <q-select
              v-model="form[ck.status]"
              outlined
              dense
              emit-value
              map-options
              :options="statusOptions"
              :label="t('status')"
              :behavior="selectBehaviors.menu"
              :rules="[requiredRule]"/>
            <q-input
              v-model="form[ck.description]"
              outlined
              dense
              type="textarea"
              :rows="2"
              autogrow
              :label="t('description')"/>

            <div class="catalog-items-section">
              <div class="row items-center no-wrap">
                <div class="text-subtitle2">{{ t('catalogItemsTitle') }}</div>
                <q-space />
                <q-btn
                  no-caps
                  flat
                  color="primary"
                  icon="add"
                  :disable="saving"
                  :label="t('catalogAddItem')"
                  @click="addItem"/>
              </div>
              <p class="text-caption text-grey-7 q-mt-xs q-mb-sm">
                {{ t('catalogItemsHint') }}
              </p>
              <div
                v-if="form[ck.items].length === 0"
                class="text-body2 text-grey-7 q-py-md text-center
                  catalog-items-empty">
                {{ t('catalogItemsEmpty') }}
              </div>
              <div v-else class="catalog-items-scroll">
                <div
                  v-for="(item, index) in form[ck.items]"
                  class="catalog-item-block"
                  :key="item._localKey">
                  <div class="row items-center no-wrap catalog-item-header">
                    <span class="text-caption text-grey-7">
                      {{ t('catalogItemNumber', { n: index + 1 }) }}
                    </span>
                    <q-space />
                    <q-btn
                      flat
                      round
                      dense
                      icon="delete"
                      color="primary"
                      :disable="saving"
                      :title="t('catalogRemoveItem')"
                      :aria-label="t('catalogRemoveItem')"
                      @click="removeItem(index)"/>
                  </div>
                  <div class="catalog-item-row-label-code">
                    <q-input
                      v-model="item[ik.label]"
                      outlined
                      dense
                      :label="t('catalogItemLabel')"
                      :rules="[requiredRule]"/>
                    <q-input
                      v-model="item[ik.code]"
                      outlined
                      dense
                      :label="t('catalogItemCode')"
                      :rules="[requiredRule]"/>
                  </div>
                  <q-input
                    v-model="item[ik.description]"
                    outlined
                    dense
                    type="textarea"
                    :rows="2"
                    :autogrow="false"
                    input-class="catalog-item-description-inner"
                    class="catalog-item-description"
                    :label="t('description')"/>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="app-dialog-actions">
          <q-btn
            no-caps
            outline
            color="primary"
            class="app-btn-outline"
            :disable="saving"
            :title="t('cancel')"
            :label="t('cancel')"
            @click="close"/>
          <q-btn
            no-caps
            unelevated
            class="primary-action"
            color="primary"
            type="submit"
            :loading="saving"
            :title="t('save')"
            :label="t('save')"/>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  catalogFieldKeys,
  catalogFormDefaults,
  catalogItemFieldKeys,
  catalogScopes,
  quasarNotifyTypes,
  quasarTransitions,
  selectBehaviors,
} from 'components/constants.js'
import { mapCatalogItem } from 'components/helpers.js'

const ck = catalogFieldKeys
const ik = catalogItemFieldKeys

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  initialRow: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const { t } = useI18n()
const $q = useQuasar()
const formRef = ref(null)

const cardStyle = {
  width: 'min(520px, calc(100vw - 24px))',
  maxWidth: 'calc(100vw - 24px)',
}

const bodyStyle = {
  maxHeight: 'min(70vh, 600px)',
}

const form = reactive({
  [ck.name]: '',
  [ck.scope]: catalogFormDefaults.scope,
  [ck.description]: '',
  [ck.status]: catalogFormDefaults.statusActive,
  [ck.items]: [],
})

const scopeOptions = computed(() => [
  { label: t('catalogScopeGlobal'), value: catalogScopes.global },
  { label: t('catalogScopeTenant'), value: catalogScopes.tenant },
])

const statusOptions = computed(() => [
  { label: t('tenantStatusActive'), value: 1 },
  { label: t('tenantStatusInactive'), value: 0 },
])

const requiredRule = val =>
  (!!val && String(val).trim().length > 0) || t('fieldRequired')

function newItemRow(index) {
  return mapCatalogItem(
    { [ik.label]: '', [ik.code]: '', [ik.description]: '' },
    index,
  )
}

function resetForm() {
  const row = props.initialRow
  if (row) {
    form[ck.name] = row[ck.name] ?? ''
    form[ck.scope] = row[ck.scope] ?? catalogFormDefaults.scope
    form[ck.description] = row[ck.description] ?? ''
    form[ck.status] = row[ck.status] ?? catalogFormDefaults.statusActive
    form[ck.items] = Array.isArray(row[ck.items])
      ? row[ck.items].map((item, idx) => ({
        ...item,
        _localKey: item._localKey ?? `row-${idx}`,
      }))
      : []

    return
  }
  form[ck.name] = ''
  form[ck.scope] = catalogFormDefaults.scope
  form[ck.description] = ''
  form[ck.status] = catalogFormDefaults.statusActive
  form[ck.items] = []
}

function addItem() {
  const row = newItemRow(form[ck.items].length)
  if (row) {
    form[ck.items].push(row)
  }
}

function removeItem(index) {
  form[ck.items].splice(index, 1)
}

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    return
  }
  if (form[ck.items].length === 0) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('catalogItemsRequired'),
    })

    return
  }
  const hasInvalidItem = form[ck.items].some(
    item =>
      !String(item[ik.label] ?? '').trim()
      || !String(item[ik.code] ?? '').trim(),
  )
  if (hasInvalidItem) {
    $q.notify({
      type: quasarNotifyTypes.warning,
      message: t('catalogItemsRequired'),
    })

    return
  }

  emit('save', {
    [ck.name]: form[ck.name],
    [ck.scope]: form[ck.scope],
    [ck.description]: form[ck.description],
    [ck.status]: form[ck.status],
    [ck.items]: form[ck.items].map(item => ({ ...item })),
  })
}

watch(
  () => props.modelValue,
  open => {
    if (open) {
      resetForm()
    }
  },
)

watch(
  () => props.initialRow,
  () => {
    if (props.modelValue) {
      resetForm()
    }
  },
)
</script>

<style scoped>
  .catalog-form-card {
    box-sizing: border-box;
  }

  .catalog-form-body {
    box-sizing: border-box;
  }

  /* Evita flex de Quasar .column que comprime los hijos al hacer scroll */
  .catalog-form-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .catalog-form-fields > * {
    flex: 0 0 auto;
    min-height: 0;
  }

  .catalog-items-section {
    width: 100%;
    max-width: 100%;
    flex: 0 0 auto;
  }

  .catalog-items-scroll {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 100%;
    max-height: min(280px, 38vh);
    overflow-x: hidden;
    overflow-y: auto;
    padding-right: 4px;
    -webkit-overflow-scrolling: touch;
  }

  .catalog-item-block {
    box-sizing: border-box;
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    padding: 8px 10px 10px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.02);
  }

  .catalog-item-header {
    margin-bottom: 4px;
  }

  .catalog-item-row-label-code {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .catalog-item-row-label-code :deep(.q-field) {
    width: 100%;
    min-width: 0;
  }

  .catalog-item-description {
    margin-top: 6px;
  }

  .catalog-item-block :deep(.q-field) {
    width: 100%;
  }

  .catalog-item-block :deep(.q-field--dense) {
    margin-bottom: 0;
  }

  .catalog-item-block :deep(.q-field__bottom) {
    min-height: 18px;
    padding-top: 2px;
  }

  :deep(.catalog-item-description-inner) {
    min-height: 3.25rem;
    line-height: 1.35;
  }

  @media (max-width: 480px) {
    .catalog-item-row-label-code {
      grid-template-columns: 1fr;
    }
  }

  .catalog-items-empty {
    border: 1px dashed rgba(15, 23, 42, 0.15);
    border-radius: 8px;
  }
</style>
