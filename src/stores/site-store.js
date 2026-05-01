import { defineStore } from 'pinia'
import { apiInstance } from 'boot/axios'
import {
  plansApiPath,
  tenantByIdPath,
  tenantsCreatePath,
  tenantsListPath,
} from 'components/constants.js'

function extractPlansList(root) {
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
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return Object.values(root.data)
  }
  return []
}

function mapPlanRow(p) {
  if (!p || typeof p !== 'object') {
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

function extractTenantList(root) {
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
  if (typeof root === 'object') {
    return Object.values(root).filter(
      v => v && typeof v === 'object' && !Array.isArray(v) && v.id != null,
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

/** POST/PUT tenant: unwrap common API envelopes. */
function extractTenantMutationResponse(data) {
  if (!data || typeof data !== 'object') {
    return null
  }
  let root = data.data
  if (root == null || typeof root !== 'object' || Array.isArray(root)) {
    root = data
  }
  if (root.tenant && typeof root.tenant === 'object') {
    return root.tenant
  }
  return root
}

function mapTenant(tenant) {
  if (!tenant || typeof tenant !== 'object') {
    return null
  }
  const planIdRaw = tenant.plan_id ?? tenant.plan?.id
  return {
    id: tenant.id ?? tenant.tenant_id,
    name: tenant.name ?? tenant.tenant_name ?? '',
    domain: tenant.domain ?? tenant.tenant_domain ?? '',
    status: normalizeTenantStatus(
      tenant.status ?? tenant.tenant_status ?? tenant.schema_status,
    ),
    planName:
      tenant.plan?.name
      || tenant.plan_name
      || tenant.planName
      || '',
    planId:
      planIdRaw != null && planIdRaw !== ''
        ? Number(planIdRaw)
        : null,
    schemaName: tenant.schema_name ?? tenant.schemaName ?? '',
    timezone: tenant.timezone ?? 'UTC',
    locale: tenant.locale ?? 'en_US',
    contactEmail: tenant.contact_email ?? tenant.contactEmail ?? '',
    contactPhone: tenant.contact_phone ?? tenant.contactPhone ?? '',
    contactAddress: tenant.contact_address ?? tenant.contactAddress ?? '',
    notes: tenant.notes ?? '',
    state: tenant.state ?? null,
    country: tenant.country ?? null,
  }
}

/**
 * Create/update responses often omit echo fields; fill from request payload
 * and loaded plans so the table row renders immediately.
 */
function mergeTenantWithPayload(mapped, payload, plans) {
  if (!mapped) {
    return null
  }
  if (!payload || typeof payload !== 'object') {
    return mapped
  }
  const planIdRaw = mapped.planId ?? payload.planId
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
    name: pickStr(mapped.name, payload.name),
    domain: pickStr(mapped.domain, payload.domain),
    planId,
    planName: pickStr(mapped.planName, planRow?.name),
    schemaName: pickStr(mapped.schemaName, payload.schemaName),
    timezone: pickStr(mapped.timezone, payload.timezone) || mapped.timezone,
    locale: pickStr(mapped.locale, payload.locale) || mapped.locale,
    contactEmail: pickStr(mapped.contactEmail, payload.contactEmail),
    contactPhone: pickStr(mapped.contactPhone, payload.contactPhone),
    contactAddress: pickStr(mapped.contactAddress, payload.contactAddress),
    notes: pickStr(mapped.notes, payload.notes),
    state: mapped.state ?? payload.state ?? null,
    country: mapped.country ?? payload.country ?? null,
    status: normalizeTenantStatus(
      mapped.status ?? payload?.status,
    ),
  }
}

// eslint-disable-next-line max-statements
function buildTenantRequestBody(payload) {
  /* eslint-disable camelcase -- API contract uses snake_case */
  const body = {}
  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    body.name = payload.name
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'domain')) {
    body.domain = payload.domain
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'planId')) {
    const pid = Number(payload.planId)
    if (!Number.isNaN(pid)) {
      body.plan_id = pid
    }
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'schemaName')) {
    body.schema_name = payload.schemaName
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'timezone')) {
    body.timezone = payload.timezone
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'locale')) {
    body.locale = payload.locale
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'contactEmail')) {
    body.contact_email = payload.contactEmail
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'contactPhone')) {
    body.contact_phone = payload.contactPhone ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'contactAddress')) {
    body.contact_address = payload.contactAddress ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'notes')) {
    body.notes = payload.notes ?? ''
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'state')) {
    body.state = payload.state
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'country')) {
    body.country = payload.country
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const s = Number(payload.status)
    if (!Number.isNaN(s)) {
      body.status = s
    }
  }
  /* eslint-enable camelcase */
  return body
}

export const useSiteStore = defineStore('site', {
  state: () => ({
    tenantList: [],
    userList: [],
    plans: [],
  }),
  getters: {
    planSelectOptions(state) {
      return state.plans
        .map(p => ({
          label: p.name,
          value: p.id,
        }))
        .filter(o => Number.isFinite(o.value))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
  },
  actions: {
    async getPlans() {
      try {
        const response = await apiInstance.get(plansApiPath)
        const list = extractPlansList(response.data.data)
        this.plans = list.map(mapPlanRow).filter(Boolean)
      } catch (error) {
        console.error('Error fetching plans:', error)
        this.plans = []
        throw error
      }
    },
    async getTenantList() {
      try {
        const response = await apiInstance.get(tenantsListPath)

        const tenantRoot = response?.data?.data
        if (!tenantRoot) {
          return
        }
        const list = extractTenantList(tenantRoot)

        this.tenantList = list
          .map(mapTenant)
          .filter(Boolean)
      } catch (error) {
        console.error('Error fetching tenants:', error)
        throw error
      }
    },
    async createTenant(payload) {
      try {
        const body = buildTenantRequestBody(payload)
        const response = await apiInstance.post(
          tenantsCreatePath,
          body,
        )
        const raw = extractTenantMutationResponse(response.data)
        const mapped = mapTenant(
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? raw
            : null,
        )
        const created = mergeTenantWithPayload(
          mapped,
          payload,
          this.plans,
        )
        if (created && created.id != null) {
          this.tenantList = [...this.tenantList, created]
        } else {
          await this.getTenantList()
        }
        return created
      } catch (error) {
        console.error('Error creating tenant:', error)
        throw error
      }
    },
    async updateTenant(id, payload) {
      try {
        const body = buildTenantRequestBody(payload)
        const response = await apiInstance.patch(
          tenantByIdPath(id),
          body,
        )
        const raw = extractTenantMutationResponse(response.data)
        const mapped = mapTenant(
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? raw
            : null,
        )
        let updated = mergeTenantWithPayload(
          mapped,
          payload,
          this.plans,
        )
        if (updated && updated.id == null && id != null) {
          updated = { ...updated, id }
        }
        if (updated && updated.id != null) {
          const idx = this.tenantList.findIndex(
            t => String(t.id) === String(updated.id),
          )
          if (idx >= 0) {
            this.tenantList.splice(idx, 1, updated)
          } else {
            await this.getTenantList()
          }
        } else {
          await this.getTenantList()
        }
        return updated
      } catch (error) {
        console.error('Error updating tenant:', error)
        throw error
      }
    },
    /** Logical delete: set tenant status to inactive (0), keep row in list. */
    async deleteTenant(id) {
      return this.updateTenant(id, { status: 0 })
    },
    async getUserList(t) {
      try {
        console.warn(t)
        // const response = await apiInstance.get(
        //   '/client/v1/all-clients?limit=10&offset=0'
        // )
        //
        // if (!response) {
        //   return
        // }
        //
        // this.clientList = response.data
      } catch (error) {
        console.error('Error fetching users:', error)
        throw error
      }
    },
  },
})
