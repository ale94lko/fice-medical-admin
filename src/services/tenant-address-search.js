import {
  isGooglePlacesBrowserConfigured,
  searchGooglePlacesAddresses,
} from './google-places-autocomplete.js'
import { searchPhotonAddresses } from './photon-address-search.js'

export {
  isGooglePlacesBrowserConfigured,
} from './google-places-autocomplete.js'

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
