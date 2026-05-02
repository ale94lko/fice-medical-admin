import {
  apiPaths,
  countryCodeUsa,
  countryDialMetaByCode,
  officialTimezoneRows,
  tenantCountryToIso3166Alpha2,
  tenantFieldKeys,
  tenantModelFallbacks,
  typeNames,
  US_NANP_DISPLAY_MAX_LENGTH,
  US_NANP_LENGTH,
  usStateOptions,
} from './constants.js'

export function tenantByIdPath(id) {
  return `${apiPaths.tenantsList}/${encodeURIComponent(String(id))}`
}

export function getTenantCountryIso3166Alpha2(tenantCountryCode) {
  const c = tenantCountryCode || countryCodeUsa

  return tenantCountryToIso3166Alpha2[c]
    ?? tenantCountryToIso3166Alpha2[countryCodeUsa]
}

export function getCountryDialMeta(countryCode) {
  const code = countryCode || countryCodeUsa

  return countryDialMetaByCode[code] ?? countryDialMetaByCode[countryCodeUsa]
}

export function concatInternationalPhone(countryCode, nationalNumberRaw) {
  const meta = getCountryDialMeta(countryCode)
  const digits = String(nationalNumberRaw ?? '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }

  return `+${meta.dialDigits}${digits}`
}

export function nationalPhoneDigitsFromStored(countryCode, storedPhone) {
  const meta = getCountryDialMeta(countryCode)
  const digits = String(storedPhone ?? '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }
  if (digits.startsWith(meta.dialDigits)) {
    return digits.slice(meta.dialDigits.length)
  }

  return digits
}

export function nationalPhoneDisplayMaxLength(countryCode) {
  const code = countryCode || countryCodeUsa
  if (code === countryCodeUsa) {
    return US_NANP_DISPLAY_MAX_LENGTH
  }

  return getCountryDialMeta(code).nationalMaxDigits ?? 15
}

export function parseNationalPhoneDigits(countryCode, raw) {
  const code = countryCode || countryCodeUsa
  let digits = String(raw ?? '').replace(/\D/g, '')
  if (code === countryCodeUsa) {
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1)
    }
    return digits.slice(0, US_NANP_LENGTH)
  }
  const max = getCountryDialMeta(code).nationalMaxDigits ?? 15

  return digits.slice(0, max)
}

export function formatUsNanpDisplay(digitsOnly) {
  const d = String(digitsOnly ?? '').replace(/\D/g, '').slice(0, US_NANP_LENGTH)
  if (!d.length) {
    return ''
  }
  const a = d.slice(0, 3)
  const b = d.slice(3, 6)
  const c = d.slice(6, US_NANP_LENGTH)
  if (d.length <= 3) {
    return `(${a}`
  }
  if (d.length <= 6) {
    return `(${a}) ${b}`
  }

  return `(${a}) ${b}-${c}`
}

export function formatNationalPhoneDisplay(countryCode, raw) {
  const code = countryCode || countryCodeUsa
  const digits = parseNationalPhoneDigits(code, raw)
  if (code === countryCodeUsa) {
    const formatted = formatUsNanpDisplay(digits)
    return formatted.slice(0, US_NANP_DISPLAY_MAX_LENGTH)
  }

  return digits
}

export function formatPhoneWithCountryCode(countryCode, storedPhone) {
  const code = countryCode || countryCodeUsa
  const meta = getCountryDialMeta(code)
  const national = formatNationalPhoneDisplay(code, storedPhone ?? '').trim()
  if (!national) {
    return ''
  }

  return `+${meta.dialDigits} ${national}`
}

export function usStateLabelFromCode(value) {
  if (value == null || value === '') {
    return ''
  }
  const o = usStateOptions.find(x => x.value === value)

  return o?.label ?? ''
}

export function usAddressTextMatchesState(text, stateCode) {
  if (text == null || stateCode == null || String(stateCode).trim() === '') {
    return false
  }
  const code = String(stateCode).toUpperCase().trim()
  if (code.length !== 2) {
    return false
  }
  const label = usStateLabelFromCode(code)
  const labU = (label || '').trim().toUpperCase()
  const segments = String(text)
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)

  for (const seg of segments) {
    if (seg === code || (labU && seg === labU)) {
      return true
    }
    if (labU && (seg.endsWith(` ${labU}`) || seg.startsWith(`${labU} `))) {
      return true
    }
    if (seg.endsWith(` ${code}`) || seg.startsWith(`${code} `)) {
      return true
    }
  }

  const u = String(text).toUpperCase()
  const reCode = new RegExp(`(?:^|[^A-Z0-9])${code}(?:[^A-Z0-9]|$)`)
  if (reCode.test(u)) {
    return true
  }
  if (labU) {
    const esc = labU
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/ /g, '\\s+')
    const reLab = new RegExp(`(?:^|[^A-Z0-9])${esc}(?:[^A-Z]|$)`)
    if (reLab.test(u)) {
      return true
    }
  }

  return false
}

function utcOffsetToken(hours) {
  if (hours === 0) {
    return 'UTC+00:00'
  }
  const sign = hours > 0 ? '+' : '-'
  const abs = Math.abs(hours)
  const hh = String(abs).padStart(2, '0')

  return `UTC${sign}${hh}:00`
}

function utcOffsetValue(hours) {
  if (hours === 0) {
    return 'UTC'
  }
  return utcOffsetToken(hours)
}

let cachedOfficialTimezoneOptions = null

export function getOfficialUtcOffsetTimezoneOptions() {
  if (cachedOfficialTimezoneOptions) {
    return cachedOfficialTimezoneOptions
  }
  cachedOfficialTimezoneOptions = officialTimezoneRows.map(({ h, cities }) => ({
    label: `(${utcOffsetToken(h)}) ${cities}`,
    value: utcOffsetValue(h),
  }))

  return cachedOfficialTimezoneOptions
}

export function extractPlansList(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root.items)) {
    return root.items
  }
  if (Array.isArray(root.data)) {
    return root.data
  }
  if (Array.isArray(root.plans)) {
    return root.plans
  }
  if (root.data && typeof root.data === typeNames.object
    && !Array.isArray(root.data)) {
    return Object.values(root.data)
  }

  return []
}

export function mapPlanRow(p) {
  if (!p || typeof p !== typeNames.object) {
    return null
  }
  const id = p.id ?? p.plan_id
  if (id == null || id === '') {
    return null
  }
  const name = p.name ?? p.plan_name ?? p.title ?? `Plan ${id}`

  return {
    id: Number(id),
    name: String(name),
  }
}

export function extractTenantList(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (Array.isArray(root.items)) {
    return root.items
  }
  if (Array.isArray(root.tenants)) {
    return root.tenants
  }
  if (typeof root === typeNames.object) {
    return Object.values(root).filter(
      v => v && typeof v === typeNames.object
        && !Array.isArray(v) && v.id != null,
    )
  }

  return []
}

function normalizeTenantStatus(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

export function extractTenantMutationResponse(data) {
  if (!data || typeof data !== typeNames.object) {
    return null
  }
  let root = data.data
  if (root == null || typeof root !== typeNames.object || Array.isArray(root)) {
    root = data
  }
  if (root.tenant && typeof root.tenant === typeNames.object) {
    return root.tenant
  }

  return root
}

export function mapTenant(tenant) {
  if (!tenant || typeof tenant !== typeNames.object) {
    return null
  }
  const tk = tenantFieldKeys
  const planIdRaw = tenant.plan_id ?? tenant.plan?.id

  return {
    id: tenant.id ?? tenant.tenant_id,
    [tk.name]: tenant.name ?? tenant.tenant_name ?? '',
    [tk.domain]: tenant.domain ?? tenant.tenant_domain ?? '',
    [tk.status]: normalizeTenantStatus(
      tenant.status ?? tenant.tenant_status ?? tenant.schema_status,
    ),
    [tk.planName]:
      tenant.plan?.name
      || tenant.plan_name
      || tenant.planName
      || '',
    [tk.planId]:
      planIdRaw != null && planIdRaw !== ''
        ? Number(planIdRaw)
        : null,
    [tk.schemaName]: tenant.schema_name ?? tenant.schemaName ?? '',
    [tk.timezone]: tenant.timezone ?? tenantModelFallbacks.timezone,
    [tk.locale]: tenant.locale ?? tenantModelFallbacks.locale,
    [tk.contactEmail]: tenant.contact_email ?? tenant.contactEmail ?? '',
    [tk.contactPhone]: tenant.contact_phone ?? tenant.contactPhone ?? '',
    [tk.contactAddress]: tenant.contact_address ?? tenant.contactAddress ?? '',
    [tk.notes]: tenant.notes ?? '',
    [tk.state]: tenant.state ?? null,
    [tk.country]: tenant.country ?? null,
  }
}

export function mergeTenantWithPayload(mapped, payload, plans) {
  if (!mapped) {
    return null
  }
  if (!payload || typeof payload !== typeNames.object) {
    return mapped
  }
  const tk = tenantFieldKeys
  const planIdRaw = mapped[tk.planId] ?? payload[tk.planId]
  const planId = planIdRaw != null && planIdRaw !== ''
    ? Number(planIdRaw)
    : null
  const planRow = planId != null && Array.isArray(plans)
    ? plans.find(p => Number(p.id) === planId)
    : null
  const pickStr = (fromApi, fromPayload) => {
    const a = String(fromApi ?? '').trim()
    if (a.length > 0) {
      return a
    }

    return String(fromPayload ?? '').trim()
  }

  return {
    ...mapped,
    [tk.name]: pickStr(mapped[tk.name], payload[tk.name]),
    [tk.domain]: pickStr(mapped[tk.domain], payload[tk.domain]),
    [tk.planId]: planId,
    [tk.planName]: pickStr(mapped[tk.planName], planRow?.name),
    [tk.schemaName]: pickStr(mapped[tk.schemaName], payload[tk.schemaName]),
    [tk.timezone]: pickStr(mapped[tk.timezone], payload[tk.timezone])
      || mapped[tk.timezone],
    [tk.locale]: pickStr(mapped[tk.locale], payload[tk.locale])
      || mapped[tk.locale],
    [tk.contactEmail]: pickStr(
      mapped[tk.contactEmail],
      payload[tk.contactEmail],
    ),
    [tk.contactPhone]: pickStr(
      mapped[tk.contactPhone],
      payload[tk.contactPhone],
    ),
    [tk.contactAddress]: pickStr(
      mapped[tk.contactAddress],
      payload[tk.contactAddress],
    ),
    [tk.notes]: pickStr(mapped[tk.notes], payload[tk.notes]),
    [tk.state]: mapped[tk.state] ?? payload[tk.state] ?? null,
    [tk.country]: mapped[tk.country] ?? payload[tk.country] ?? null,
    [tk.status]: normalizeTenantStatus(
      mapped[tk.status] ?? payload?.[tk.status],
    ),
  }
}

function applyTenantPayloadToSnakeBody(body, payload, tk) {
  const rows = [
    { p: tk.name, b: 'name' },
    { p: tk.domain, b: 'domain' },
    {
      p: tk.planId,
      b: 'plan_id',
      map: v => {
        const n = Number(v)
        return Number.isNaN(n) ? undefined : n
      },
      skip: v => v === undefined,
    },
    { p: tk.schemaName, b: 'schema_name' },
    { p: tk.timezone, b: 'timezone' },
    { p: tk.locale, b: 'locale' },
    { p: tk.contactEmail, b: 'contact_email' },
    { p: tk.contactPhone, b: 'contact_phone', map: v => v ?? '' },
    { p: tk.contactAddress, b: 'contact_address', map: v => v ?? '' },
    { p: tk.notes, b: 'notes', map: v => v ?? '' },
    { p: tk.state, b: 'state' },
    { p: tk.country, b: 'country' },
    {
      p: tk.status,
      b: 'status',
      map: v => {
        const n = Number(v)
        return Number.isNaN(n) ? undefined : n
      },
      skip: v => v === undefined,
    },
  ]
  for (const row of rows) {
    if (!Object.prototype.hasOwnProperty.call(payload, row.p)) {
      continue
    }
    const map = row.map ?? (x => x)
    const v = map(payload[row.p])
    if (row.skip?.(v)) {
      continue
    }
    body[row.b] = v
  }
}

export function buildTenantRequestBody(payload) {
  const body = {}
  applyTenantPayloadToSnakeBody(body, payload, tenantFieldKeys)

  return body
}

export function coerceTenantMutationRoot(raw) {
  return raw && typeof raw === typeNames.object && !Array.isArray(raw)
    ? raw
    : null
}
