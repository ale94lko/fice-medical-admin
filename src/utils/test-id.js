/**
 * Builds stable kebab-case data-testid values for QA automation.
 *
 * @example testId('tenants', 'btn', 'add') => 'tenants-btn-add'
 * @example testId('users', 'row', 12, 'edit') => 'users-row-12-edit'
 */
export function testId(...parts) {
  return parts
    .filter(part => part != null && String(part).trim() !== '')
    .map(part => String(part)
      .trim()
      .replace(/_/g, '-')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase())
    .join('-')
}

export function fieldTestId(prefix, fieldKey, fieldTestIdOverride) {
  if (fieldTestIdOverride) {
    return fieldTestIdOverride
  }

  return testId(prefix, 'field', fieldKey)
}
