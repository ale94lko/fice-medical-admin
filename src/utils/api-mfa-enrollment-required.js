import { getActivePinia } from 'pinia'
import { useAuthStore } from 'stores/auth-store.js'

const MFA_ENROLLMENT_CODE = 1155

function collectPayloadCandidates(payload) {
  const body = payload?.response?.data ?? payload?.data ?? payload
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return []
  }

  const candidates = [body]
  const nested = body.data
  if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
    candidates.push(nested)
  }

  return candidates
}

export function isMfaEnrollmentRequiredPayload(payload) {
  const candidates = collectPayloadCandidates(payload)
  if (!candidates.length) {
    return false
  }

  for (const item of candidates) {
    const code = Number(item.error_code ?? item.errorCode)
    if (code === MFA_ENROLLMENT_CODE) {
      return true
    }
  }

  for (const item of candidates) {
    const errorToken = String(item.error ?? '').trim().toUpperCase()
    if (errorToken === 'MFA_ENROLLMENT_REQUIRED') {
      return true
    }
  }

  return false
}

export function markErrorAsMfaEnrollmentRequired(error) {
  if (error?.config) {
    error.config.__mfaEnrollmentRequired = true
  }
}

function applyMfaEnrollmentRequiredState() {
  const pinia = getActivePinia()
  if (!pinia) {
    return false
  }

  useAuthStore(pinia).requireMfaEnrollment()

  return true
}

export async function applyMfaEnrollmentRequiredFromApiError(error) {
  if (!isMfaEnrollmentRequiredPayload(error)) {
    return false
  }

  markErrorAsMfaEnrollmentRequired(error)
  applyMfaEnrollmentRequiredState()

  return true
}

export async function applyMfaEnrollmentRequiredFromApiResponse(response) {
  if (!isMfaEnrollmentRequiredPayload(response)) {
    return false
  }

  const error = {
    response,
    config: response?.config,
  }
  markErrorAsMfaEnrollmentRequired(error)
  applyMfaEnrollmentRequiredState()

  return true
}

export function createMfaEnrollmentRequiredRejection(response) {
  const error = new Error('MFA_ENROLLMENT_REQUIRED')
  error.response = response
  error.config = response?.config
  markErrorAsMfaEnrollmentRequired(error)

  return Promise.reject(error)
}
