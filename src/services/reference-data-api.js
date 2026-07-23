/**
 * Typed API client for SUPER_ADMIN Reference Data
 * (`/admin-tenant/v1/reference-data/**`).
 *
 * @typedef {'ACTIVE'|'STUB'} ReferenceCatalogStatus
 * @typedef {'NUCC_TAXONOMY'|'PLACE_OF_SERVICE'|string} ReferenceCatalogCode
 * @typedef {'CSV'|'JSON'|'XML'|'ZIP'} ReferenceImportFormat
 * @typedef {'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'|'ROLLED_BACK'}
 *   ReferenceImportStatus
 * @typedef {'UPLOAD'|'HTTP'|'SCHEDULED'} ReferenceImportSourceType
 * @typedef {'INFO'|'ERROR'|string} ReferenceImportLogLevel
 *
 * @typedef {object} ReferenceCatalog
 * @property {number} id
 * @property {ReferenceCatalogCode} code
 * @property {string} name
 * @property {string|null} [source_authority]
 * @property {string|null} [source_url]
 * @property {string|null} [download_url]
 * @property {ReferenceImportFormat|string|null} [download_format]
 * @property {boolean} [supports_auto_download]
 * @property {ReferenceCatalogStatus} status
 * @property {boolean} [supports_clinic_override]
 * @property {string|null} [active_version]
 *
 * @typedef {object} ReferencePageMeta
 * @property {number} limit
 * @property {number} offset
 * @property {number} total
 * @property {number} page
 * @property {number} total_pages
 * @property {number} [totalPages]
 *
 * @typedef {object} ReferenceTaxonomy
 * @property {number} id
 * @property {string} code
 * @property {string|null} [grouping]
 * @property {string|null} [classification]
 * @property {string|null} [specialization]
 * @property {string|null} [display_name]
 * @property {string|null} [definition]
 * @property {string|null} [notes]
 * @property {boolean} active
 * @property {number|null} [display_order]
 * @property {string|null} [effective_date]
 * @property {string|null} [expiration_date]
 * @property {string|null} [version]
 * @property {string|null} [created_at]
 * @property {string|null} [updated_at]
 *
 * @typedef {object} ReferencePlaceOfService
 * @property {number} id
 * @property {string} code
 * @property {string} name
 * @property {string|null} [description]
 * @property {string|null} [display_name]
 * @property {boolean} active
 * @property {boolean} [enabled_for_clinic]
 * @property {boolean} [is_default]
 * @property {number|null} [display_order]
 * @property {string|null} [effective_date]
 * @property {string|null} [expiration_date]
 * @property {string|null} [version]
 *
 * @typedef {object} ReferenceImportLog
 * @property {number} id
 * @property {ReferenceImportLogLevel} level
 * @property {string} message
 * @property {number|null} [row_number]
 *
 * @typedef {object} ReferenceImportJob
 * @property {number} id
 * @property {ReferenceCatalogCode} catalog_code
 * @property {number|null} [version_id]
 * @property {string|null} [version_label]
 * @property {ReferenceImportSourceType} [source_type]
 * @property {ReferenceImportFormat|string|null} [format]
 * @property {ReferenceImportStatus} status
 * @property {string|null} [source_url]
 * @property {string|null} [error_summary]
 * @property {string|null} [started_at]
 * @property {string|null} [finished_at]
 * @property {string|null} [created_at]
 * @property {ReferenceImportLog[]} [logs]
 *
 * @typedef {object} TaxonomyListQuery
 * @property {string} [q]
 * @property {string} [code]
 * @property {string} [grouping]
 * @property {string} [classification]
 * @property {string} [specialization]
 * @property {boolean|string} [active]
 * @property {number} [page]
 * @property {number} [limit]
 * @property {string} [sort_by]
 * @property {'ASC'|'DESC'} [sort_dir]
 *
 * @typedef {object} PlacesOfServiceQuery
 * @property {boolean} [include_disabled]
 * @property {number} [tenant_id]
 * @property {number} [subtenant_id]
 *
 * @typedef {object} ImportListQuery
 * @property {string} [catalog_code]
 * @property {number} [page]
 * @property {number} [limit]
 *
 * @typedef {object} FromSourceImportBody
 * @property {ReferenceCatalogCode} catalog_code
 * @property {string} [version_label]
 *
 * @typedef {object} HttpImportBody
 * @property {ReferenceCatalogCode} catalog_code
 * @property {string} url
 * @property {ReferenceImportFormat} [format]
 * @property {string} [version_label]
 */

import { apiInstance } from 'boot/axios'
import { apiPaths, typeNames } from 'components/constants.js'

/**
 * @param {unknown} root
 * @returns {unknown[]}
 */
export function extractReferenceItems(root) {
  if (!root) {
    return []
  }
  if (Array.isArray(root)) {
    return root
  }
  if (typeof root !== typeNames.object) {
    return []
  }
  if (Array.isArray(root.items)) {
    return root.items
  }
  if (Array.isArray(root.catalogs)) {
    return root.catalogs
  }

  return []
}

/**
 * @param {unknown} root
 * @returns {ReferencePageMeta|null}
 */
export function extractReferenceMeta(root) {
  if (!root || typeof root !== typeNames.object) {
    return null
  }
  const p = root.meta ?? root.pagination
  if (!p || typeof p !== typeNames.object) {
    return null
  }
  const limit = Number(p.limit)
  const offset = Number(p.offset)
  const total = Number(p.total)
  const page = Number(p.page)
  const totalPages = Number(p.total_pages ?? p.totalPages)

  return {
    limit: Number.isFinite(limit) ? limit : 0,
    offset: Number.isFinite(offset) ? offset : 0,
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) ? page : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
  }
}

/**
 * @param {unknown} body
 * @returns {unknown}
 */
function unwrapData(body) {
  return body?.data
}

/**
 * @param {import('axios').AxiosError|Error|unknown} error
 * @returns {string}
 */
export function referenceDataErrorMessage(error) {
  const data = error?.response?.data
  const msg =
    data?.error?.message
    || data?.message
    || error?.message
    || ''

  return String(msg || '').trim()
}

/**
 * @returns {Promise<ReferenceCatalog[]>}
 */
export async function listReferenceCatalogs() {
  const response = await apiInstance.get(apiPaths.referenceDataCatalogs)
  const root = unwrapData(response.data)

  return /** @type {ReferenceCatalog[]} */ (
    extractReferenceItems(root)
  )
}

/**
 * @param {TaxonomyListQuery} [query]
 * @returns {Promise<{
 *   items: ReferenceTaxonomy[],
 *   meta: ReferencePageMeta|null,
 * }>}
 */
export async function listTaxonomies(query = {}) {
  const response = await apiInstance.get(
    apiPaths.referenceDataTaxonomies,
    { params: query },
  )
  const root = unwrapData(response.data)

  return {
    items: /** @type {ReferenceTaxonomy[]} */ (
      extractReferenceItems(root)
    ),
    meta: extractReferenceMeta(root),
  }
}

/**
 * @param {string} code
 * @returns {Promise<ReferenceTaxonomy|null>}
 */
export async function getTaxonomyByCode(code) {
  const path =
    `${apiPaths.referenceDataTaxonomies}/`
    + `${encodeURIComponent(String(code))}`
  const response = await apiInstance.get(path)
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object && !Array.isArray(root)) {
    return /** @type {ReferenceTaxonomy} */ (root)
  }

  return null
}

/**
 * @param {number|string} id
 * @param {boolean} active
 * @returns {Promise<ReferenceTaxonomy|null>}
 */
export async function patchTaxonomyStatus(id, active) {
  const path =
    `${apiPaths.referenceDataTaxonomies}/`
    + `${encodeURIComponent(String(id))}/status`
  const response = await apiInstance.patch(path, { active })
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceTaxonomy} */ (root)
  }

  return null
}

/**
 * @param {PlacesOfServiceQuery} [query]
 * @returns {Promise<ReferencePlaceOfService[]>}
 */
export async function listPlacesOfService(query = {}) {
  const response = await apiInstance.get(
    apiPaths.referenceDataPlacesOfService,
    { params: query },
  )
  const root = unwrapData(response.data)

  return /** @type {ReferencePlaceOfService[]} */ (
    extractReferenceItems(root)
  )
}

/**
 * @param {string} code
 * @param {boolean} active
 * @returns {Promise<ReferencePlaceOfService|null>}
 */
export async function patchPlaceOfServiceStatus(code, active) {
  const path =
    `${apiPaths.referenceDataPlacesOfService}/`
    + `${encodeURIComponent(String(code))}/status`
  const response = await apiInstance.patch(path, { active })
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferencePlaceOfService} */ (root)
  }

  return null
}

/**
 * @param {string} code
 * @param {number} tenantId
 * @param {number} subtenantId
 * @param {boolean} enabled
 * @returns {Promise<ReferencePlaceOfService|null>}
 */
export async function putPlaceOfServiceClinicAvailability(
  code,
  tenantId,
  subtenantId,
  enabled,
) {
  const path =
    `${apiPaths.referenceDataPlacesOfService}/`
    + `${encodeURIComponent(String(code))}/clinic-availability`
  const response = await apiInstance.put(
    path,
    { enabled },
    {
      params: {
        'tenant_id': tenantId,
        'subtenant_id': subtenantId,
      },
    },
  )
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferencePlaceOfService} */ (root)
  }

  return null
}

/**
 * @param {object} opts
 * @param {ReferenceCatalogCode} opts.catalogCode
 * @param {File|Blob} opts.file
 * @param {ReferenceImportFormat} [opts.format]
 * @param {string} [opts.versionLabel]
 * @returns {Promise<ReferenceImportJob|null>}
 */
export async function createImportUpload({
  catalogCode,
  file,
  format,
  versionLabel,
}) {
  const form = new FormData()
  form.append('catalog_code', String(catalogCode))
  form.append('file', file)
  if (format) {
    form.append('format', String(format))
  }
  if (versionLabel) {
    form.append('version_label', String(versionLabel))
  }
  const response = await apiInstance.post(
    apiPaths.referenceDataImports,
    form,
  )
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceImportJob} */ (root)
  }

  return null
}

/**
 * Import from catalog official source (download_url / download_format).
 * Do not send url or format — backend resolves them from the catalog.
 *
 * @param {object} opts
 * @param {ReferenceCatalogCode} opts.catalogCode
 * @param {string} [opts.versionLabel]
 * @returns {Promise<ReferenceImportJob|null>}
 */
export async function createImportFromSource({
  catalogCode,
  versionLabel,
}) {
  /** @type {FromSourceImportBody} */
  const body = { 'catalog_code': catalogCode }
  const label = String(versionLabel || '').trim()
  if (label) {
    body['version_label'] = label
  }
  const response = await apiInstance.post(
    apiPaths.referenceDataImportsFromSource,
    body,
  )
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceImportJob} */ (root)
  }

  return null
}

/**
 * Advanced HTTP import (not shown in primary admin UI).
 *
 * @param {HttpImportBody} body
 * @returns {Promise<ReferenceImportJob|null>}
 */
export async function createImportFromHttp(body) {
  const response = await apiInstance.post(
    apiPaths.referenceDataImportsHttp,
    body,
  )
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceImportJob} */ (root)
  }

  return null
}

/**
 * @param {ImportListQuery} [query]
 * @returns {Promise<{
 *   items: ReferenceImportJob[],
 *   meta: ReferencePageMeta|null,
 * }>}
 */
export async function listImports(query = {}) {
  const response = await apiInstance.get(
    apiPaths.referenceDataImports,
    { params: query },
  )
  const root = unwrapData(response.data)

  return {
    items: /** @type {ReferenceImportJob[]} */ (
      extractReferenceItems(root)
    ),
    meta: extractReferenceMeta(root),
  }
}

/**
 * @param {number|string} id
 * @returns {Promise<ReferenceImportJob|null>}
 */
export async function getImportById(id) {
  const path =
    `${apiPaths.referenceDataImports}/`
    + `${encodeURIComponent(String(id))}`
  const response = await apiInstance.get(path)
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceImportJob} */ (root)
  }

  return null
}

/**
 * @param {number|string} id
 * @returns {Promise<ReferenceImportJob|null>}
 */
export async function rollbackImport(id) {
  const path =
    `${apiPaths.referenceDataImports}/`
    + `${encodeURIComponent(String(id))}/rollback`
  const response = await apiInstance.post(path)
  const root = unwrapData(response.data)
  if (root && typeof root === typeNames.object) {
    return /** @type {ReferenceImportJob} */ (root)
  }

  return null
}

/**
 * @param {number|string} versionId
 * @returns {Promise<unknown>}
 */
export async function activateReferenceVersion(versionId) {
  const path =
    `${apiPaths.referenceDataVersions}/`
    + `${encodeURIComponent(String(versionId))}/activate`
  const response = await apiInstance.post(path)

  return unwrapData(response.data)
}

/**
 * @param {ReferenceCatalog|null|undefined} catalog
 * @returns {boolean}
 */
export function isReferenceCatalogImportable(catalog) {
  return String(catalog?.status ?? '').toUpperCase() === 'ACTIVE'
}

/**
 * @param {ReferenceCatalog|null|undefined} catalog
 * @returns {boolean}
 */
export function supportsReferenceAutoDownload(catalog) {
  return isReferenceCatalogImportable(catalog)
    && Boolean(catalog?.supports_auto_download)
}
