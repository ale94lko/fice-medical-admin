import { usAddressTextMatchesState } from 'components/constants.js'

const PHOTON_URL = 'https://photon.komoot.io/api/'

/**
 * Single-line postal address from a Photon `properties` object.
 */
export function formatPhotonAddressLine(props) {
  if (!props || typeof props !== 'object') {
    return ''
  }
  const line1 = [props.housenumber, props.street]
    .filter(Boolean)
    .join(' ')
    .trim()
  const locality = props.city || props.town || props.village
    || props.district || props.hamlet || props.locality
  const region = props.state || props.region
  const parts = [
    line1 || props.name,
    locality,
    region,
    props.postcode,
    props.country,
  ].filter(p => p && String(p).trim())
  return parts.join(', ')
}

function photonMatchesCountryAndState(props, iso3166Alpha2, stateCode) {
  if (!props) {
    return false
  }
  const iso = iso3166Alpha2 ? String(iso3166Alpha2).toUpperCase() : ''
  const cc = props.countrycode?.toUpperCase()
  if (iso && cc && cc !== iso) {
    return false
  }
  const line = formatPhotonAddressLine(props)
  return usAddressTextMatchesState(line, stateCode)
}

/**
 * Photon forward geocode. Requires `stateCode` (no global fallback).
 * @param {string} query
 * @param {string} [iso3166Alpha2] e.g. "US"
 * @param {string} stateCode US state value e.g. "CA"
 */
export async function searchPhotonAddresses(
  query,
  iso3166Alpha2,
  stateCode,
) {
  const q = String(query ?? '').trim()
  const st = stateCode != null && String(stateCode).trim() !== ''
  if (q.length < 3 || !st) {
    return []
  }
  const url = new URL(PHOTON_URL)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '30')
  url.searchParams.set('lang', 'en')
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Photon HTTP ${res.status}`)
  }
  const data = await res.json()
  const features = Array.isArray(data?.features) ? data.features : []
  const iso = iso3166Alpha2 ? String(iso3166Alpha2).toUpperCase() : ''
  const list = features.filter(f =>
    photonMatchesCountryAndState(f.properties, iso, stateCode),
  )
  const seen = new Set()
  const out = []
  for (const f of list) {
    const line = formatPhotonAddressLine(f.properties)
    if (!line || seen.has(line)) {
      continue
    }
    seen.add(line)
    out.push({ label: line, value: line })
    if (out.length >= 8) {
      break
    }
  }
  return out
}
