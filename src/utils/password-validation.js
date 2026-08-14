export const PASSWORD_MIN_LENGTH = 8

const POLICY_MESSAGE_KEYS = {
  required: 'passwordRequired',
  minLength: 'passwordMinLength',
  uppercase: 'passwordRequiresUppercase',
  lowercase: 'passwordRequiresLowercase',
  number: 'passwordRequiresNumber',
  special: 'passwordRequiresSpecial',
}

export function getPasswordPolicyViolation(password) {
  const value = String(password ?? '')
  if (!value) {
    return 'required'
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return 'minLength'
  }
  if (!/[A-Z]/.test(value)) {
    return 'uppercase'
  }
  if (!/[a-z]/.test(value)) {
    return 'lowercase'
  }
  if (!/[0-9]/.test(value)) {
    return 'number'
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'special'
  }

  return null
}

export function passwordPolicyMessageKey(violation) {
  return POLICY_MESSAGE_KEYS[violation] ?? 'passwordPolicyInvalid'
}

export function passwordsMatch(password, confirmPassword) {
  return String(password ?? '') === String(confirmPassword ?? '')
}

export function resolvePasswordConfirmMessage(
  password,
  confirmPassword,
  t,
) {
  if (!String(confirmPassword ?? '').trim()) {
    return t('passwordRequired')
  }
  if (!passwordsMatch(password, confirmPassword)) {
    return t('passwordsDoNotMatch')
  }

  return ''
}

export function createPasswordPolicyRule(t) {
  return val => {
    const violation = getPasswordPolicyViolation(val)
    if (!violation) {
      return true
    }

    return t(passwordPolicyMessageKey(violation))
  }
}

export function createPasswordMatchRule(t, getPassword) {
  return val => resolvePasswordConfirmMessage(getPassword(), val, t)
    || true
}

export function buildNewPasswordRules(t, { required = true } = {}) {
  const rules = []
  if (required) {
    rules.push(
      val => String(val ?? '').trim().length > 0
        || t('passwordRequired'),
    )
  }
  rules.push(createPasswordPolicyRule(t))

  return rules
}
