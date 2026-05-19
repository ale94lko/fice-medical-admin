import { reactive } from 'vue'
import { htmlInputTypes } from 'components/constants.js'

export function isPasswordInputType(inputType) {
  return inputType === htmlInputTypes.password
}

export function passwordFieldInputType(showPlain) {
  return showPlain ? htmlInputTypes.text : htmlInputTypes.password
}

export function passwordToggleIconName(showPlain) {
  return showPlain ? 'visibility' : 'visibility_off'
}

export function usePasswordVisibilityByKey() {
  const showPlainByKey = reactive({})

  function isPlainVisible(key) {
    return Boolean(showPlainByKey[key])
  }

  function resolvedInputType(key, inputType) {
    if (!isPasswordInputType(inputType)) {
      return inputType || htmlInputTypes.text
    }

    return passwordFieldInputType(isPlainVisible(key))
  }

  function toggle(key) {
    showPlainByKey[key] = !isPlainVisible(key)
  }

  function clear() {
    for (const k of Object.keys(showPlainByKey)) {
      delete showPlainByKey[k]
    }
  }

  return {
    isPlainVisible,
    resolvedInputType,
    toggle,
    toggleIconName: key => passwordToggleIconName(isPlainVisible(key)),
    clear,
  }
}
