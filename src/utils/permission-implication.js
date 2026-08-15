const SPECIAL_IMPLIED_VIEW = {
  ADD_CLIENT: 'VIEW_CLIENT',
  EDIT_BASIC_INFO_CLIENT: 'VIEW_CLIENT',
  CHANGE_STATUS_CLIENT: 'VIEW_CLIENT',
  ARCHIVE_CLIENT: 'VIEW_CLIENT',
  BOOK_APPOINTMENT: 'VIEW_APPOINTMENT_SLOT',
  CANCEL_APPOINTMENT: 'VIEW_APPOINTMENT_SLOT',
  RESCHEDULE_APPOINTMENT: 'VIEW_APPOINTMENT_SLOT',
  MANAGE_APPOINTMENT_SLOTS: 'VIEW_APPOINTMENT_SLOT',
  ENCOUNTER_NARRATIVE_EDIT: 'VIEW_ENCOUNTER',
  WAIVE_ENCOUNTER_REQUIREMENT: 'VIEW_ENCOUNTER',
  CLINICAL_NOTE_REGENERATE: 'VIEW_MEDICAL_NOTES_CLIENT',
  SUPERBILL_EDIT_BILLING_FIELDS: 'SUPERBILL_VIEW',
  AUTHORIZATION_ATTACH_DOCUMENT: 'AUTHORIZATION_VIEW',
  UPLOAD_FILES: 'VIEW_FILES',
  DELETE_FILES: 'VIEW_FILES',
  GENERATE_DOCUMENTS: 'VIEW_FILES',
  CREATE_TELEHEALTH: 'VIEW_TELEHEALTH',
  MANAGE_TELEHEALTH: 'VIEW_TELEHEALTH',
  JOIN_TELEHEALTH: 'VIEW_TELEHEALTH',
  ADMIT_TELEHEALTH: 'VIEW_TELEHEALTH',
  START_TELEHEALTH: 'VIEW_TELEHEALTH',
  FINISH_TELEHEALTH: 'VIEW_TELEHEALTH',
  CHAT_TELEHEALTH: 'VIEW_TELEHEALTH',
  UPLOAD_TELEHEALTH_FILES: 'VIEW_TELEHEALTH',
  DELETE_TELEHEALTH_FILES: 'VIEW_TELEHEALTH',
  MANAGE_SERVICE_REQUIREMENTS: 'VIEW_SERVICE_PROCEDURES',
  MANAGE_SCREENING_TEMPLATES: 'VIEW_SCREENINGS',
  MANAGE_CLINICAL_RESOURCES: 'VIEW_CLINICAL_RESOURCES',
}

const WRITE_PREFIXES = [
  'ADD_', 'EDIT_', 'DELETE_', 'CHANGE_', 'ARCHIVE_',
  'SIGN_', 'MANAGE_', 'COMPLETE_', 'START_', 'REOPEN_',
  'WAIT_', 'RESUME_', 'REVIEW_', 'CANCEL_', 'JOIN_',
  'ADMIT_', 'FINISH_', 'CHAT_',
]

const WRITE_SUFFIXES = [
  '_CREATE', '_EDIT', '_DELETE', '_APPROVE', '_DENY',
  '_CANCEL', '_SIGN', '_PUBLISH', '_ASSIGN', '_REVOKE',
  '_DOWNLOAD', '_DUPLICATE', '_ACTIVATE', '_DEACTIVATE',
  '_REVIEW', '_REOPEN', '_VOID',
]

function walkLeaves(nodes, visit) {
  if (!Array.isArray(nodes)) {
    return
  }
  for (const node of nodes) {
    if (Array.isArray(node?.children) && node.children.length) {
      walkLeaves(node.children, visit)
    } else {
      visit(node)
    }
  }
}

function leafId(node) {
  if (node?.nodeKey != null && String(node.nodeKey).trim() !== '') {
    const key = String(node.nodeKey)
    if (key.startsWith('m-')) {
      return null
    }

    return key
  }
  if (node?.value != null && String(node.value).trim() !== '') {
    return String(node.value)
  }
  if (node?.id != null && String(node.id).trim() !== '') {
    return String(node.id)
  }

  return null
}

function leafCode(node) {
  return String(
    node?.code ?? node?.name ?? node?.label ?? '',
  ).trim().toUpperCase()
}

function isViewPermission(code) {
  return code.startsWith('VIEW_') || code.endsWith('_VIEW')
}

function impliedViewFor(code, knownCodes) {
  if (!code || isViewPermission(code) || code.startsWith('USE_')) {
    return null
  }
  const special = SPECIAL_IMPLIED_VIEW[code]
  if (special) {
    return knownCodes.has(special) ? special : null
  }
  for (const prefix of WRITE_PREFIXES) {
    if (!code.startsWith(prefix)) {
      continue
    }
    const candidate = `VIEW_${code.slice(prefix.length)}`
    if (knownCodes.has(candidate)) {
      return candidate
    }
  }
  for (const suffix of WRITE_SUFFIXES) {
    if (!code.endsWith(suffix)) {
      continue
    }
    const candidate = `${code.slice(0, -suffix.length)}_VIEW`
    if (knownCodes.has(candidate)) {
      return candidate
    }
  }

  return null
}

function catalogFromNodes(nodes) {
  const byId = new Map()
  const codes = new Set()
  walkLeaves(nodes, node => {
    const id = leafId(node)
    const code = leafCode(node)
    if (!id || !code) {
      return
    }
    byId.set(String(id), code)
    codes.add(code)
  })

  return { byId, codes }
}

export function findMissingViewImplications(
  nodes = [],
  selectedIds = [],
) {
  const { byId, codes } = catalogFromNodes(nodes)
  const selectedCodes = new Set()
  for (const raw of selectedIds ?? []) {
    const code = byId.get(String(raw))
    if (code) {
      selectedCodes.add(code)
    }
  }
  const pairs = []
  const seen = new Set()
  for (const code of selectedCodes) {
    const view = impliedViewFor(code, codes)
    if (!view || selectedCodes.has(view)) {
      continue
    }
    const key = `${code}:${view}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    pairs.push({ write: code, view })
  }
  pairs.sort((a, b) => a.write.localeCompare(b.write))

  return pairs
}

export function moduleKeysWithMissingViewImplications(
  nodes = [],
  selectedIds = [],
) {
  const pairs = findMissingViewImplications(nodes, selectedIds)
  const writeCodes = new Set(pairs.map(pair => pair.write))
  const keys = new Set()
  if (!writeCodes.size) {
    return keys
  }
  for (const module of nodes ?? []) {
    let hit = false
    walkLeaves([module], node => {
      if (writeCodes.has(leafCode(node))) {
        hit = true
      }
    })
    if (!hit) {
      continue
    }
    const key = module.nodeKey ?? module.id
    if (key != null && String(key).trim() !== '') {
      keys.add(String(key))
    }
  }

  return keys
}
