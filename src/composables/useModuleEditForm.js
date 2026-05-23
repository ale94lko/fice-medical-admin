import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  fieldTypes,
  htmlInputTypes,
  moduleFieldKeys,
} from 'components/constants.js'
import { buildModulePatchBody } from 'components/helpers.js'

const mk = moduleFieldKeys

export function useModuleEditForm() {
  const { t } = useI18n()

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')

    return [
      {
        key: mk.name,
        kind: fieldTypes.input,
        labelKey: mk.name,
        inputType: htmlInputTypes.text,
        rules: [requiredRule],
      },
      {
        key: mk.description,
        kind: fieldTypes.textarea,
        labelKey: mk.description,
        rows: 4,
        autogrow: false,
        rules: [requiredRule],
      },
    ]
  })

  function formatModuleUpdatePayload(form) {
    return buildModulePatchBody(form)
  }

  return {
    fields,
    formatModuleUpdatePayload,
  }
}
