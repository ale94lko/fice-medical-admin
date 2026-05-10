import { qSelectOptionKeys, typeNames } from 'components/constants.js'

export function filterLabelValueOptions(
  all,
  needle,
  labelKey = qSelectOptionKeys.label,
  valueKey = qSelectOptionKeys.value,
) {
  const list = Array.isArray(all) ? [...all] : []
  const q = String(needle ?? '').toLowerCase().trim()
  if (!q) {
    return list
  }

  return list.filter(opt => {
    if (!opt || typeof opt !== typeNames.object) {
      return false
    }
    const lab = String(opt[labelKey] ?? '').toLowerCase()
    const val = String(opt[valueKey] ?? '').toLowerCase()

    return lab.includes(q) || val.includes(q)
  })
}
