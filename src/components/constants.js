export const siteBreakpoints = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
}

export const siteBreakpointsPx = {
  XXS: 500,
  MD: 1024,
}

export const clientStatus = {
  CLOSED: 0,
  OPEN: 1,
}

export const defaultTenant = 'main'

export const plansApiPath = '/plans/v1'

/** GET list tenants. */
export const tenantsListPath = '/admin-tenant/v1/tenants'

/** POST create tenant. */
export const tenantsCreatePath = '/admin-tenant/v1/tenants/create'

/** DELETE one tenant by id. */
export function tenantByIdPath(id) {
  return `${tenantsListPath}/${encodeURIComponent(String(id))}`
}

export const countryCodeUsa = 'USA'

/** Tenant country → ISO 3166-1 alpha-2 (Photon address filter). */
export const tenantCountryToIso3166Alpha2 = {
  USA: 'US',
}

export function getTenantCountryIso3166Alpha2(tenantCountryCode) {
  const c = tenantCountryCode || countryCodeUsa
  return tenantCountryToIso3166Alpha2[c]
    ?? tenantCountryToIso3166Alpha2[countryCodeUsa]
}

/** Maps tenant country to dial code and national number limits. */
export const countryDialMetaByCode = {
  USA: { dialDigits: '1', nationalMaxDigits: 10 },
}

export function getCountryDialMeta(countryCode) {
  const code = countryCode || countryCodeUsa
  return countryDialMetaByCode[code] ?? countryDialMetaByCode[countryCodeUsa]
}

/** E.164-style string for API: +{dial}{national digits only}. */
export function concatInternationalPhone(countryCode, nationalNumberRaw) {
  const meta = getCountryDialMeta(countryCode)
  const digits = String(nationalNumberRaw ?? '').replace(/\D/g, '')
  if (!digits) {
    return ''
  }
  return `+${meta.dialDigits}${digits}`
}

/** Strip stored country code; input shows national digits only (USA +1). */
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

const US_NANP_LENGTH = 10

/** Formatted NANP display `(555) 555-5555` character cap. */
export const US_NANP_DISPLAY_MAX_LENGTH = 14

export function nationalPhoneDisplayMaxLength(countryCode) {
  const code = countryCode || countryCodeUsa
  if (code === countryCodeUsa) {
    return US_NANP_DISPLAY_MAX_LENGTH
  }
  return getCountryDialMeta(code).nationalMaxDigits ?? 15
}

/**
 * Raw input → national digits only (NANP strips leading 1 if 11 digits).
 */
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

/** NANP display while typing: (555) 123-4567 */
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

/** Format national phone field value for the selected tenant country. */
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

export const usStateOptions = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
]

export function usStateLabelFromCode(value) {
  if (value == null || value === '') {
    return ''
  }
  const o = usStateOptions.find(x => x.value === value)
  return o?.label ?? ''
}

/**
 * True if US address text (Places description, Photon line) refers to
 * `stateCode` (USPS, e.g. AL). Avoids false positives such as matching "AL"
 * inside "California".
 */
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

/** API value: UTC for Greenwich, else UTC±HH:00. */
function utcOffsetValue(hours) {
  if (hours === 0) {
    return 'UTC'
  }
  return utcOffsetToken(hours)
}

/**
 * 24 hourly offsets UTC−12 … UTC+11.
 * label: (UTC±HH:mm) City, City — value: UTC or UTC±HH:00 for API.
 */
const officialTimezoneRows = [
  { h: -12, cities: 'Baker Island, Howland Island' },
  { h: -11, cities: 'Pago Pago, Midway' },
  { h: -10, cities: 'Honolulu' },
  { h: -9, cities: 'Anchorage' },
  { h: -8, cities: 'Los Angeles, Vancouver' },
  { h: -7, cities: 'Denver, Phoenix' },
  { h: -6, cities: 'Mexico City, Chicago' },
  { h: -5, cities: 'New York, Bogotá, Lima' },
  { h: -4, cities: 'Caracas, Atlantic Time' },
  { h: -3, cities: 'São Paulo, Buenos Aires' },
  { h: -2, cities: 'Mid-Atlantic' },
  { h: -1, cities: 'Azores' },
  { h: 0, cities: 'London, Lisbon, Dublin' },
  { h: 1, cities: 'Paris, Berlin, Madrid' },
  { h: 2, cities: 'Cairo, Athens, Helsinki' },
  { h: 3, cities: 'Kuwait, Riyadh, Moscow, Nairobi' },
  { h: 4, cities: 'Abu Dhabi, Dubai, Baku' },
  { h: 5, cities: 'Islamabad, Karachi, Tashkent' },
  { h: 6, cities: 'Dhaka, Almaty' },
  { h: 7, cities: 'Bangkok, Jakarta, Ho Chi Minh City' },
  { h: 8, cities: 'Beijing, Hong Kong, Singapore' },
  { h: 9, cities: 'Tokyo, Seoul, Osaka' },
  { h: 10, cities: 'Sydney, Melbourne, Guam' },
  { h: 11, cities: 'Solomon Islands, New Caledonia' },
]

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
