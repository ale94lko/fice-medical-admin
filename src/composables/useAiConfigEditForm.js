import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  aiConfigFieldKeys,
  fieldTypes,
  htmlInputTypes,
} from 'components/constants.js'
import { buildAiConfigPatchBody } from 'components/helpers.js'

const ck = aiConfigFieldKeys

export function useAiConfigEditForm() {
  const { t } = useI18n()

  const fields = computed(() => {
    const versionRule = val => {
      const n = Number(val)

      return (Number.isFinite(n) && n >= 1)
        || t('aiConfigPromptVersionInvalid')
    }

    const bodyRule = val =>
      (!!val && String(val).trim().length > 0)
      || t('aiConfigPromptBodyRequired')

    return [
      {
        key: ck.feature,
        kind: fieldTypes.input,
        labelKey: 'aiConfigFeature',
        inputType: htmlInputTypes.text,
        readonly: true,
        hintKey: 'aiConfigFeatureReadOnly',
      },
      {
        key: ck.enabled,
        kind: fieldTypes.checkbox,
        labelKey: 'aiConfigEnabled',
      },
      {
        key: ck.promptVersion,
        kind: fieldTypes.input,
        labelKey: 'aiConfigPromptVersion',
        inputType: htmlInputTypes.number,
        rules: [versionRule],
      },
      {
        key: ck.promptBody,
        kind: fieldTypes.textarea,
        labelKey: 'aiConfigPromptBody',
        hintKey: 'aiConfigPromptBodyHint',
        rows: 14,
        autogrow: false,
        rules: [bodyRule],
      },
    ]
  })

  function formatAiConfigUpdatePayload(form) {
    return buildAiConfigPatchBody(form)
  }

  return {
    fields,
    formatAiConfigUpdatePayload,
  }
}
