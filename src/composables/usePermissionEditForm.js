import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  fieldTypes,
  htmlInputTypes,
  permissionFieldKeys,
} from 'components/constants.js'
import { buildPermissionUpdateBody } from 'components/helpers.js'

export function usePermissionEditForm() {
  const { t } = useI18n()
  const pk = permissionFieldKeys

  const fields = computed(() => {
    const requiredRule = val =>
      (!!val && String(val).trim().length > 0) || t('fieldRequired')

    return [
      {
        key: pk.name,
        kind: fieldTypes.input,
        labelKey: pk.name,
        inputType: htmlInputTypes.text,
        rules: [requiredRule],
      },
      {
        key: pk.description,
        kind: fieldTypes.textarea,
        labelKey: pk.description,
        rows: 4,
        autogrow: false,
      },
    ]
  })

  function formatPermissionUpdatePayload(form) {
    return buildPermissionUpdateBody(form)
  }

  return {
    fields,
    formatPermissionUpdatePayload,
  }
}
