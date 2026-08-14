function leafKey(node) {
  if (!node || typeof node !== 'object') {
    return null
  }
  if (node.nodeKey != null && String(node.nodeKey).trim() !== '') {
    const key = node.nodeKey
    if (typeof key === 'string' && key.startsWith('m-')) {
      return null
    }

    return key
  }
  if (node.value != null && String(node.value).trim() !== '') {
    return node.value
  }

  return null
}

export function collectLeafValues(node) {
  if (!node) {
    return []
  }
  if (Array.isArray(node.children) && node.children.length) {
    return node.children.flatMap(child => collectLeafValues(child))
  }
  const key = leafKey(node)

  return key == null ? [] : [key]
}

export function collectAllLeafValues(nodes) {
  return (nodes ?? []).flatMap(node => collectLeafValues(node))
}

export function toStoredPermissionId(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return value
  }
  const n = Number(raw)
  if (Number.isFinite(n) && String(n) === raw) {
    return n
  }

  return value
}

export function toggleBranchSelection(node, selectedValues, checked) {
  const leafValues = collectLeafValues(node).map(String)
  const next = new Set(
    (selectedValues ?? []).map(value => String(value)),
  )
  if (checked) {
    leafValues.forEach(value => next.add(value))
  } else {
    leafValues.forEach(value => next.delete(value))
  }

  return Array.from(next).map(toStoredPermissionId)
}

export function toggleLeafSelection(value, selectedValues, checked) {
  const key = String(value)
  const next = new Set(
    (selectedValues ?? []).map(item => String(item)),
  )
  if (checked) {
    next.add(key)
  } else {
    next.delete(key)
  }

  return Array.from(next).map(toStoredPermissionId)
}

export function moduleNodeKey(module) {
  return module?.nodeKey ?? module?.id
}

export function permissionNodeKey(permission) {
  return leafKey(permission)
}
