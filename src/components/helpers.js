import {
  apiPaths,
  countryCodeUsa,
  countryDialMetaByCode,
  officialTimezoneRows,
  tenantCountryToIso3166Alpha2,
  permissionFieldKeys,
  roleDetailNumericIdArrayKeys,
  roleDetailPermissionEntryArrayKeys,
  roleFieldKeys,
  rolePermissionEnvelopeKeys,
  tenantFieldKeys,
  tenantModelFallbacks,
  typeNames,
  userFieldKeys,
  US_NANP_DISPLAY_MAX_LENGTH,
  US_NANP_LENGTH,
  usStateOptions,
} from './constants.js'

export function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

export function sanitizeTenantDomainInput(raw) {
  let s = String(raw ?? '').replace(/[^a-zA-Z0-9_]/g, '')
  while (s.length > 0 && /[0-9]/.test(s[0])) {
    s = s.slice(1)
  }

  return s
}

export function tenantByIdPath(id) {
  return `${apiPaths.tenantsList}/${encodeURIComponent(String(id))}`
}

export function userByIdPath(id) {
  return `${apiPaths.usersList}/${encodeURIComponent(String(id))}`
}

export function roleByIdPath(id) {
  return `${apiPaths.rolesList}/${encodeURIComponent(String(id))}`
}

export function permissionByIdPath(id) {
  return `${apiPaths.permissionsList}/${encodeURIComponent(String(id))}`
}

export function mapRole(row) {
  if (!row || typeof row !== typeNames.object) {
    return null
  }
  const rk = roleFieldKeys
  const id = row.id ?? row.role_id
  if (id == null || id === '') {
    return null
  }
  const levelRaw = row.level ?? row.role_level
  const level = Number(levelRaw)

  const mapped = {
    id: Number(id),
    [rk.tenantId]:
      row.tenant_id != null && row.tenant_id !== ''
        ? Number(row.tenant_id)
        : null,
    [rk.name]: String(row.name ?? row.role_name ?? '').trim(),
    [rk.description]: String(row.description ?? row.role_description ?? '')
      .trim(),
    [rk.level]: Number.isFinite(level) ? level : null,
  }
  if (Array.isArray(row.permissions)) {
    mapped[rk.permissions] = row.permissions
  }
  if (Array.isArray(row.permission_ids)) {
    mapped['permission_ids'] = row.permission_ids
  }
  if (Array.isArray(row.permissionIds)) {
    mapped.permissionIds = row.permissionIds
  }

  return mapped
}

export function mapPermission(row) {
  if (!row || typeof row !== typeNames.object) {
    return null
  }
  const pk = permissionFieldKeys
  const id = Number(row.id ?? row.permission_id ?? row.permissionId)
  if (!Number.isFinite(id)) {
    return null
  }
  const mod = row.module != null && typeof row.module === typeNames.object
    ? row.module
    : null
  const moduleIdRaw =
    row.module_id ?? row.moduleId ?? mod?.id
  const moduleId =
    moduleIdRaw != null && moduleIdRaw !== ''
      ? Number(moduleIdRaw)
      : null
  const moduleName = mod != null
    ? String(mod.name ?? '').trim()
    : ''

  return {
    id,
    [pk.name]: String(row.name ?? row.code ?? row.title ?? '').trim(),
    [pk.description]: String(row.description ?? '').trim(),
    [pk.moduleId]: Number.isFinite(moduleId) ? moduleId : null,
    [pk.moduleName]: moduleName,
  }
}

export function clonePermissionTreeForViewReadonly(nodes) {
  if (!Array.isArray(nodes)) {
    return []
  }

  return nodes.map(node => {
    const children = node.children
    const copy = { ...node, tickable: false }
    if (Array.isArray(children) && children.length > 0) {
      copy.children = clonePermissionTreeForViewReadonly(children)
    }

    return copy
  })
}

export function buildRoleCreateBody(payload) {
  if (!payload || typeof payload !== typeNames.object) {
    return {}
  }
  const rk = roleFieldKeys
  const name = String(payload[rk.name] ?? '').trim()
  const description = String(payload[rk.description] ?? '').trim()
  const permissionIds = intIdList(payload[rk.permissions])
  const tenantIdNum = Number(payload[rk.tenantId])

  const body = {
    name,
    description,
    permissionIds,
  }
  if (Number.isFinite(tenantIdNum)) {
    body.tenantId = tenantIdNum
  }

  return body
}

export function buildRoleUpdateBody(payload, roleId) {
  if (!payload || typeof payload !== typeNames.object) {
    return {}
  }
  const rk = roleFieldKeys
  const id = Number(roleId ?? payload.id)
  if (!Number.isFinite(id)) {
    return {}
  }
  const name = String(payload[rk.name] ?? '').trim()
  const description = String(payload[rk.description] ?? '').trim()
  const permissionIds = intIdList(payload[rk.permissions])

  return {
    id,
    name,
    description,
    permissionIds,
  }
}

export function buildPermissionUpdateBody(payload) {
  if (!payload || typeof payload !== typeNames.object) {
    return {}
  }
  const pk = permissionFieldKeys
  const name = String(payload[pk.name] ?? '').trim()
  const description = String(payload[pk.description] ?? '').trim()

  return {
    name,
    description,
  }
}

function pickExpiration(td, root) {
  let expiration =
    td?.expiration ?? td?.expires_at ?? td?.expiresAt
    ?? root?.expiration ?? root?.expires_at ?? root?.expiresAt
  if (!isEmpty(expiration)) {
    return String(expiration)
  }
  const ei = root?.expires_in ?? td?.expires_in
  if (typeof ei === 'number' && Number.isFinite(ei)) {
    return new Date(Date.now() + ei * 1000).toISOString()
  }

  return ''
}

function extractFromFiCeEnvelope(body) {
  const envelope = body.data
  if (!envelope?.token_data?.token) {
    return null
  }
  const td = envelope.token_data
  const refreshToken =
    envelope.refresh_token_data?.token
    || envelope.refreshTokenData?.token

  return {
    token: td.token,
    expiration: pickExpiration(td, {}),
    refreshToken,
  }
}

function extractFromRoots(body) {
  const roots = []
  const push = r => {
    if (r && typeof r === 'object' && !roots.includes(r)) {
      roots.push(r)
    }
  }
  push(body.data)
  push(body.data?.data)
  if (body.token || body.access_token) {
    push(body)
  }
  if (body.token_data) {
    push(body)
  }

  for (const root of roots) {
    const td = root.token_data
    const token =
      td?.token
      || root.token
      || root.access_token
    if (!token) {
      continue
    }
    const refreshToken =
      root.refresh_token_data?.token
      || root.refreshTokenData?.token

    return {
      token,
      expiration: pickExpiration(td || {}, root),
      refreshToken,
    }
  }

  return null
}

export function extractOAuthTokenPayload(body) {
  if (!body || typeof body !== 'object') {
    return null
  }
  const fromEnvelope = extractFromFiCeEnvelope(body)
  if (fromEnvelope) {
    return fromEnvelope
  }

  return extractFromRoots(body)
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

export function extractTenantListPagination(root) {
  if (!root || typeof root !== typeNames.object) {
    return null
  }
  const p = root.pagination
  if (!p || typeof p !== typeNames.object) {
    return null
  }
  const limit = Number(p.limit)
  const offset = Number(p.offset)
  const total = Number(p.total)
  const page = Number(p.page)
  const totalPages = Number(p.total_pages)

  return {
    limit: Number.isFinite(limit) ? limit : 0,
    offset: Number.isFinite(offset) ? offset : 0,
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
  }
}

export async function fetchAllEnvelopeList(apiGet, path, extraQuery = {}) {
  const limit = 100
  let page = 0
  const combined = []
  while (true) {
    const response = await apiGet(path, {
      params: { page, limit, ...extraQuery },
    })
    const root = response?.data?.data
    const batch = extractTenantList(root)
    const meta = extractTenantListPagination(root)
    combined.push(...batch)
    const total = meta?.total
    if (batch.length === 0) {
      break
    }
    if (typeof total === typeNames.number && combined.length >= total) {
      break
    }
    if (batch.length < limit) {
      break
    }
    page += 1
  }

  return combined.filter(r => r && typeof r === typeNames.object)
}

export function buildModuleIdToNameMap(moduleRows) {
  const m = new Map()
  if (!Array.isArray(moduleRows)) {
    return m
  }
  for (const row of moduleRows) {
    if (!row || typeof row !== typeNames.object) {
      continue
    }
    const id = Number(row.id)
    if (!Number.isFinite(id)) {
      continue
    }
    const name = String(row.name ?? '').trim()

    m.set(id, name || String(id))
  }

  return m
}

export function enrichPermissionsModuleNames(permissionRows, moduleRows) {
  if (!Array.isArray(permissionRows)) {
    return []
  }
  const pk = permissionFieldKeys
  const byId = buildModuleIdToNameMap(moduleRows)

  return permissionRows.map(p => {
    if (!p || typeof p !== typeNames.object) {
      return p
    }
    const existing = p[pk.moduleName]
    if (existing) {
      return p
    }
    const mid = p[pk.moduleId]
    const n = Number(mid)
    if (!Number.isFinite(n) || !byId.has(n)) {
      return p
    }

    return {
      ...p,
      [pk.moduleName]: byId.get(n),
    }
  })
}

function normalizeTenantStatus(raw) {
  if (isEmpty(raw)) {
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

function normalizeUserStatus(raw) {
  if (isEmpty(raw)) {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

export function extractUserMutationResponse(data) {
  if (!data || typeof data !== typeNames.object) {
    return null
  }
  let root = data.data
  if (root == null || typeof root !== typeNames.object || Array.isArray(root)) {
    root = data
  }
  if (root.user && typeof root.user === typeNames.object) {
    return root.user
  }

  return root
}

export function coerceUserMutationRoot(raw) {
  return raw && typeof raw === typeNames.object && !Array.isArray(raw)
    ? raw
    : null
}

export function mapUser(user) {
  if (!user || typeof user !== typeNames.object) {
    return null
  }
  const uk = userFieldKeys

  return {
    id: user.id ?? user.user_id,
    [uk.username]: user.username ?? user.user_name ?? '',
    [uk.email]: user.email ?? user.user_email ?? '',
    [uk.status]: normalizeUserStatus(
      user.status ?? user.user_status ?? user.account_status,
    ),
  }
}

export function mergeUserWithPayload(mapped, payload) {
  if (!mapped) {
    return null
  }
  if (!payload || typeof payload !== typeNames.object) {
    return mapped
  }
  const uk = userFieldKeys
  const pickStr = (fromApi, fromPayload) => {
    const a = String(fromApi ?? '').trim()
    if (a.length > 0) {
      return a
    }

    return String(fromPayload ?? '').trim()
  }

  return {
    ...mapped,
    [uk.username]: pickStr(mapped[uk.username], payload[uk.username]),
    [uk.email]: pickStr(mapped[uk.email], payload[uk.email]),
    [uk.status]: normalizeUserStatus(
      mapped[uk.status] ?? payload[uk.status],
    ),
  }
}

export function buildUserRequestBody(payload) {
  if (!payload || typeof payload !== typeNames.object) {
    return {}
  }
  const body = {}
  const uk = userFieldKeys
  if (Object.prototype.hasOwnProperty.call(payload, uk.username)) {
    body.username = String(payload[uk.username] ?? '').trim()
  }
  if (Object.prototype.hasOwnProperty.call(payload, uk.email)) {
    body.email = String(payload[uk.email] ?? '').trim()
  }
  if (Object.prototype.hasOwnProperty.call(payload, uk.password)) {
    const pw = String(payload[uk.password] ?? '').trim()
    if (pw.length > 0) {
      body.password = pw
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, uk.status)) {
    const n = Number(payload[uk.status])
    if (Number.isFinite(n)) {
      body.status = n
    }
  }

  return body
}

function intIdList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(x => Number(x)).filter(Number.isFinite)
}

function uniqueFiniteNumbers(values) {
  return [...new Set(values.filter(Number.isFinite))]
}

function mergeRolePermissionEnvelopeFields(roleObj, envelope) {
  if (!roleObj || !envelope || envelope === roleObj) {
    return roleObj
  }
  const merged = { ...roleObj }
  for (const k of rolePermissionEnvelopeKeys) {
    if (envelope[k] == null) {
      continue
    }
    const onRole = merged[k]
    const useEnvelope =
      onRole == null
      || (Array.isArray(onRole)
        && onRole.length === 0
        && Array.isArray(envelope[k])
        && envelope[k].length > 0)
    if (useEnvelope) {
      merged[k] = envelope[k]
    }
  }

  return merged
}

function unwrapRoleDetailInner(payload) {
  if (!payload || typeof payload !== typeNames.object) {
    return null
  }
  let inner =
    payload.data != null && typeof payload.data === typeNames.object
      ? payload.data
      : payload
  if (inner.role != null && typeof inner.role === typeNames.object) {
    inner = mergeRolePermissionEnvelopeFields(inner.role, inner)
  }

  return inner
}

function permissionIdFromPrimitiveOrCode(p, map) {
  const n = Number(p)
  if (Number.isFinite(n)) {
    return n
  }
  if (!map || p == null || typeof p !== 'string' || !String(p).trim()) {
    return null
  }
  const hit = map.get(String(p).trim().toUpperCase())

  return Number.isFinite(hit) ? hit : null
}

function collectPermissionIdsFromArray(perms, codeToIdMap) {
  if (!Array.isArray(perms)) {
    return []
  }
  const out = []
  const map = codeToIdMap && codeToIdMap.size ? codeToIdMap : null
  for (const p of perms) {
    if (p == null) {
      continue
    }
    if (typeof p === 'number' || typeof p === 'string') {
      const id = permissionIdFromPrimitiveOrCode(p, map)
      if (id != null) {
        out.push(id)
      }
      continue
    }
    if (typeof p !== typeNames.object) {
      continue
    }
    const nested = p.permission
    const id =
      p.id
      ?? p.permission_id
      ?? p.permissionId
      ?? nested?.id
    const n = Number(id)
    if (Number.isFinite(n)) {
      out.push(n)
      continue
    }
    if (!map) {
      continue
    }
    const codeRaw =
      p.code
      ?? p.permission_code
      ?? p.name
      ?? nested?.code
      ?? nested?.name
    if (codeRaw != null && String(codeRaw).trim()) {
      const hit = map.get(String(codeRaw).trim().toUpperCase())
      if (Number.isFinite(hit)) {
        out.push(hit)
      }
    }
  }

  return intIdList(out)
}

export function buildPermissionCodeToIdMap(permissionRows) {
  const m = new Map()
  for (const row of permissionRows) {
    if (!row || typeof row !== typeNames.object) {
      continue
    }
    const id = Number(row.id ?? row.permission_id ?? row.permissionId)
    if (!Number.isFinite(id)) {
      continue
    }
    const keys = [
      row.code,
      row.permission_code,
      row.slug,
      row.name,
      row.title,
      row.display_name,
    ]
    for (const k of keys) {
      if (k != null && String(k).trim()) {
        m.set(String(k).trim().toUpperCase(), id)
      }
    }
  }

  return m
}

export function extractRoleTemplatePermissionIds(payload, codeToIdMap) {
  const inner = unwrapRoleDetailInner(payload)
  if (!inner) {
    return []
  }
  const fromDirectParts = []
  for (const k of roleDetailNumericIdArrayKeys) {
    const arr = inner[k]
    if (Array.isArray(arr) && arr.length) {
      fromDirectParts.push(...intIdList(arr))
    }
  }
  const fromDirect = uniqueFiniteNumbers(fromDirectParts)

  const fromListParts = []
  for (const k of roleDetailPermissionEntryArrayKeys) {
    const arr = inner[k]
    if (Array.isArray(arr) && arr.length) {
      fromListParts.push(...collectPermissionIdsFromArray(arr, codeToIdMap))
    }
  }
  const fromList = uniqueFiniteNumbers(fromListParts)

  return uniqueFiniteNumbers([...fromDirect, ...fromList])
}

export function extractPermissionIdsFromRoleDetailPayload(payload) {
  return extractRoleTemplatePermissionIds(payload, null)
}

export function buildUserRegisterBody(payload) {
  if (!payload || typeof payload !== typeNames.object) {
    return {}
  }
  const uk = userFieldKeys
  const username =
    String(payload[uk.username] ?? '').trim()
    || String(payload[uk.email] ?? '').trim()
  const password = String(payload[uk.password] ?? '').trim()
  const status = Number(payload[uk.status])
  const description = String(payload.description ?? '').trim()
  const changePassword = payload.changePassword
  const roles = intIdList(payload.roles)
  const permissions = intIdList(payload.permissions)
  const modules = intIdList(payload.modules)
  const allowedSub = intIdList(
    payload.allowedSubtenantIds ?? payload.allowed_subtenant_ids,
  )

  const body = {
    username,
    password,
    status: Number.isFinite(status) ? status : 1,
    changePassword: changePassword !== false && changePassword !== 0,
    roles,
    permissions,
    modules,
    allowedSubtenantIds: allowedSub,
  }
  if (description.length > 0) {
    body.description = description
  }

  return body
}
