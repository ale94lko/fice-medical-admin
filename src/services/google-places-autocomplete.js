import { typeNames } from 'components/constants.js'
import { usAddressTextMatchesState } from 'components/helpers.js'

let mapsScriptPromise = null

function googleMapsApiKey() {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof k === typeNames.string ? k.trim() : ''
}

export function isGooglePlacesBrowserConfigured() {
  return googleMapsApiKey().length > 0
}

function loadGoogleMapsPlacesScript() {
  if (typeof window === typeNames.undefined) {
    return Promise.reject(new Error('no window'))
  }
  if (window.google?.maps?.places) {
    return Promise.resolve()
  }
  if (mapsScriptPromise) {
    return mapsScriptPromise
  }
  const key = googleMapsApiKey()
  mapsScriptPromise = new Promise((resolve, reject) => {
    const cbName = `__gmapsPlacesCb_${Date.now()}`
    window[cbName] = () => {
      try {
        delete window[cbName]
        if (!window.google?.maps?.places) {
          mapsScriptPromise = null
          reject(new Error('Google Maps Places not available'))
          return
        }
        resolve()
      } catch (e) {
        mapsScriptPromise = null
        reject(e)
      }
    }
    const s = document.createElement('script')
    s.async = true
    s.defer = true
    s.onerror = () => {
      mapsScriptPromise = null
      reject(new Error('Google Maps script load failed'))
    }
    s.src = 'https://maps.googleapis.com/maps/api/js'
      + `?key=${encodeURIComponent(key)}`
      + '&libraries=places'
      + `&callback=${cbName}`
    document.head.appendChild(s)
  })
  return mapsScriptPromise
}

export async function searchGooglePlacesAddresses(
  query,
  iso3166Alpha2,
  stateCode,
) {
  const q = String(query ?? '').trim()
  const st = stateCode != null && String(stateCode).trim() !== ''
  if (q.length < 3 || !st) {
    return []
  }
  if (!isGooglePlacesBrowserConfigured()) {
    return []
  }
  await loadGoogleMapsPlacesScript()
  const g = window.google
  const svc = new g.maps.places.AutocompleteService()
  const country = String(iso3166Alpha2 || 'US').toLowerCase()
  return new Promise(resolve => {
    svc.getPlacePredictions(
      {
        input: q,
        types: ['address'],
        componentRestrictions: { country },
      },
      (predictions, status) => {
        const ok = g.maps.places.PlacesServiceStatus.OK
        if (status !== ok || !predictions?.length) {
          resolve([])
          return
        }
        const filtered = predictions.filter(p =>
          usAddressTextMatchesState(p.description, stateCode),
        )
        const list = (filtered.length > 0 ? filtered : []).slice(0, 8)
        resolve(
          list.map(p => ({
            label: p.description,
            value: p.description,
          })),
        )
      },
    )
  })
}
