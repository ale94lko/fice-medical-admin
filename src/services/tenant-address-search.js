import {
  isGooglePlacesBrowserConfigured,
  searchGooglePlacesAddresses,
} from './google-places-autocomplete.js'
import { searchPhotonAddresses } from './photon-address-search.js'

export {
  isGooglePlacesBrowserConfigured,
} from './google-places-autocomplete.js'

/**
 * Google (Maps JS + Places) if `VITE_GOOGLE_MAPS_API_KEY` is set; otherwise
 * Photon. Requires `stateCode`. Google has a free monthly cap under Maps
 * billing, but still needs a billing-enabled project + key.
 */
export async function searchTenantAddressSuggestions(
  query,
  iso3166Alpha2,
  stateCode,
) {
  const st = stateCode != null && String(stateCode).trim() !== ''
  if (!st) {
    return []
  }
  if (isGooglePlacesBrowserConfigured()) {
    try {
      const g = await searchGooglePlacesAddresses(
        query,
        iso3166Alpha2,
        stateCode,
      )
      if (g.length > 0) {
        return g
      }
    } catch {
      /* fall through to Photon */
    }
  }
  return searchPhotonAddresses(query, iso3166Alpha2, stateCode)
}
