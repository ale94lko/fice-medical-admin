import { apiInstance } from 'boot/axios'
import { apiPaths } from 'components/constants.js'
import { unwrapApiData } from 'components/helpers.js'

export async function completeMfaChallenge({
  mfaChallengeToken,
  code,
}) {
  const response = await apiInstance.post(apiPaths.oauthMfaChallenge, {
    mfaChallengeToken: String(mfaChallengeToken ?? '').trim(),
    code: String(code ?? '').trim(),
  })

  return response.data
}

export async function setupMfa() {
  const response = await apiInstance.post(apiPaths.oauthMfaSetup)

  return unwrapApiData(response.data)
}

export async function verifyMfaSetup(code) {
  const response = await apiInstance.post(apiPaths.oauthMfaVerifySetup, {
    code: String(code ?? '').trim(),
  })

  return unwrapApiData(response.data)
}
