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

/** Below this width the drawer uses overlay (mobile) behavior. */
export const drawerMobileMaxPx = 499

/** Desktop drawer width when expanded on hover (overlay). */
export const drawerWidthPx = 200

/** Desktop drawer rail width (layout always reserves this). */
export const drawerMiniWidthPx = 48

export const defaultTenant = 'main'

export const primarySuperadminUser = 'superadmin@fice.medical'

export const apiPaths = {
  plans: '/plans/v1',
  tenantsList: '/admin-tenant/v1/tenants',
  tenantsCreate: '/admin-tenant/v1/tenants/create',
  usersList: '/admin-tenant/v1/users',
  usersRegister: '/admin-tenant/v1/users/register',
  usersChangePassword: '/admin-tenant/v1/users/change-password',
  rolesList: '/admin-tenant/v1/roles',
  rolesCreate: '/admin-tenant/v1/roles/add',
  rolesUpdate: '/admin-tenant/v1/roles/update',
  permissionsList: '/admin-tenant/v1/permissions',
  permissionsUpdate: '/admin-tenant/v1/permissions/update',
  modulesList: '/admin-tenant/v1/module',
  modulesUpdate: '/admin-tenant/v1/modules/update',
  moduleAdminItem: '/admin-tenant/v1/module',
  aiConfigList: '/admin-tenant/v1/ai-config',
  aiSuggestionsList: '/admin-tenant/v1/ai-suggestions',
  catalogList: '/admin-tenant/v1/catalog',
  catalogCreate: '/admin-tenant/v1/catalog/create',
  referenceDataBase: '/admin-tenant/v1/reference-data',
  referenceDataCatalogs: '/admin-tenant/v1/reference-data/catalogs',
  referenceDataTaxonomies:
    '/admin-tenant/v1/reference-data/taxonomies',
  referenceDataPlacesOfService:
    '/admin-tenant/v1/reference-data/places-of-service',
  referenceDataImports: '/admin-tenant/v1/reference-data/imports',
  referenceDataImportsFromSource:
    '/admin-tenant/v1/reference-data/imports/from-source',
  referenceDataImportsHttp:
    '/admin-tenant/v1/reference-data/imports/http',
  referenceDataVersions: '/admin-tenant/v1/reference-data/versions',
  /** Tenant/staff read API used to browse MEDICATION in admin. */
  referenceDataMedications: '/reference-data/v1/medications',
  referenceDataIcd10Cm: '/reference-data/v1/icd10-cm',
  oauthLogin: '/oauth/v1/login',
  oauthRefresh: '/oauth/v1/refresh',
  oauthResetPassword: '/oauth/v1/reset-password',
  oauthMfaChallenge: '/oauth/v1/mfa/challenge',
  oauthMfaSetup: '/oauth/v1/mfa/setup',
  oauthMfaVerifySetup: '/oauth/v1/mfa/verify-setup',
  oauthMfaStatus: '/oauth/v1/mfa/status',
  oauthMfaDisable: '/oauth/v1/mfa/disable',
  logout: '/logout',
}

/** Reference Data (terminologies) — not UI enum catalogs. */
export const referenceDataCatalogCodes = {
  nuccTaxonomy: 'NUCC_TAXONOMY',
  placeOfService: 'PLACE_OF_SERVICE',
  medication: 'MEDICATION',
  icd10Cm: 'ICD10_CM',
  /** Documentary stub alias — never use for import. */
  rxnormStub: 'RXNORM',
}

export const referenceDataMedicationSortFields = {
  code: 'code',
  name: 'name',
  genericName: 'generic_name',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const referenceDataIcd10CmSortFields = {
  code: 'code',
  codeDotted: 'code_dotted',
  shortDescription: 'short_description',
  orderNumber: 'order_number',
  billable: 'billable',
  active: 'active',
}

export const referenceDataCatalogStatuses = {
  active: 'ACTIVE',
  stub: 'STUB',
}

export const referenceDataImportFormats = {
  csv: 'CSV',
  json: 'JSON',
  xml: 'XML',
  zip: 'ZIP',
}

export const referenceDataImportStatuses = {
  pending: 'PENDING',
  running: 'RUNNING',
  completed: 'COMPLETED',
  failed: 'FAILED',
  rolledBack: 'ROLLED_BACK',
}

export const referenceDataImportSourceTypes = {
  upload: 'UPLOAD',
  http: 'HTTP',
  scheduled: 'SCHEDULED',
}

export const referenceDataTaxonomySortFields = {
  code: 'code',
  grouping: 'grouping',
  classification: 'classification',
  specialization: 'specialization',
  displayName: 'display_name',
  createdAt: 'created_at',
}

export const authStorageKeys = {
  token: 'token',
  expireAt: 'expireAt',
  expireAtLegacy: 'expiresAt',
  refresh: 'refreshToken',
  refreshLegacy: 'refresh_token',
  mustEnrollMfa: 'mustEnrollMfa',
}

export const countryCodeUsa = 'USA'

export const tenantCountryToIso3166Alpha2 = {
  USA: 'US',
}

export const countryDialMetaByCode = {
  USA: { dialDigits: '1', nationalMaxDigits: 10 },
}

export const US_NANP_DISPLAY_MAX_LENGTH = 14

export const US_NANP_LENGTH = 10

export const officialTimezoneRows = [
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

export const typeNames = {
  undefined: 'undefined',
  object: 'object',
  function: 'function',
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  symbol: 'symbol',
  bigint: 'bigint',
}

export const fieldTypes = {
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  checkbox: 'checkbox',
  addressSuggest: 'addressSuggest',
  permissionTree: 'permissionTree',
  rolePicker: 'rolePicker',
  modulePicker: 'modulePicker',
  heading: 'heading',
  logo: 'logo',
}

export const inputNormalizeKeys = {
  roleName: 'roleName',
  tenantDomain: 'tenantDomain',
  ein: 'ein',
}

export const tenantFormSectionIds = {
  basic: 'basic',
  contact: 'contact',
  legal: 'legal',
  credentials: 'credentials',
}

export const tenantFieldKeys = {
  name: 'name',
  mainSubtenantName: 'mainSubtenantName',
  clinicType: 'clinicType',
  domain: 'domain',
  planId: 'planId',
  planName: 'planName',
  status: 'status',
  timezone: 'timezone',
  locale: 'locale',
  country: 'country',
  state: 'state',
  contactEmail: 'contactEmail',
  contactPhone: 'contactPhone',
  contactAddress: 'contactAddress',
  notes: 'notes',
  schemaName: 'schemaName',
  legalBusinessName: 'legalBusinessName',
  taxId: 'taxId',
  billingEmail: 'billingEmail',
  billingPhone: 'billingPhone',
  billingAddress: 'billingAddress',
  sameAsContactAddress: 'sameAsContactAddress',
  logoFile: 'logoFile',
}

export const tenantListColumnKeys = {
  actions: 'actions',
}

export const userFieldKeys = {
  username: 'username',
  email: 'email',
  password: 'password',
  status: 'status',
  description: 'description',
  changePassword: 'changePassword',
  roles: 'roles',
  permissions: 'permissions',
  tenantId: 'tenantId',
  allowedSubtenantIds: 'allowedSubtenantIds',
}

export const userListColumnKeys = {
  actions: 'actions',
}

export const roleFieldKeys = {
  name: 'name',
  description: 'description',
  permissions: 'permissions',
  templateRoleId: 'templateRoleId',
  level: 'level',
  tenantId: 'tenantId',
}

export const roleListColumnKeys = {
  actions: 'actions',
}

export const permissionFieldKeys = {
  name: 'name',
  description: 'description',
  moduleId: 'moduleId',
  moduleName: 'moduleName',
}

export const permissionListColumnKeys = {
  actions: 'actions',
}

export const moduleFieldKeys = {
  name: 'name',
  description: 'description',
}

export const moduleListColumnKeys = {
  actions: 'actions',
}

export const aiConfigFieldKeys = {
  feature: 'feature',
  enabled: 'enabled',
  promptVersion: 'promptVersion',
  promptBody: 'promptBody',
}

export const aiConfigListColumnKeys = {
  actions: 'actions',
}

export const aiSuggestionFieldKeys = {
  tenantId: 'tenantId',
  tenantName: 'tenantName',
  subtenantId: 'subtenantId',
  feature: 'feature',
  status: 'status',
  provider: 'provider',
  model: 'model',
  promptVersion: 'promptVersion',
  createdAt: 'createdAt',
  createdBy: 'createdBy',
  clientId: 'clientId',
  encounterId: 'encounterId',
  conversationId: 'conversationId',
  tokensPrompt: 'tokensPrompt',
  tokensCompletion: 'tokensCompletion',
  result: 'result',
  request: 'request',
  acceptedAt: 'acceptedAt',
  acceptedBy: 'acceptedBy',
  rejectedAt: 'rejectedAt',
  rejectedBy: 'rejectedBy',
  rejectionReason: 'rejectionReason',
  committedToRecordAt: 'committedToRecordAt',
}

export const aiSuggestionListColumnKeys = {
  actions: 'actions',
}

export const aiSuggestionFeatures = [
  'ICD10_SUGGEST',
  'SOAP_DRAFT',
  'CLINICAL_SUMMARY',
  'CARE_PLAN_DRAFT',
  'CHART_CHAT',
  'ASSISTANT_ROUTER',
  'FREE_TEXT',
]

export const aiSuggestionStatuses = [
  'PENDING',
  'EDITED',
  'PARTIALLY_ACCEPTED',
  'ACCEPTED',
  'REJECTED',
  'FAILED',
  'EXPIRED',
]

export const catalogFieldKeys = {
  name: 'name',
  scope: 'scope',
  description: 'description',
  status: 'status',
  items: 'items',
}

export const catalogItemFieldKeys = {
  label: 'label',
  code: 'code',
  description: 'description',
  tenantId: 'tenantId',
}

export const catalogListColumnKeys = {
  actions: 'actions',
  itemCount: 'itemCount',
}

export const catalogScopes = {
  global: 'global',
  tenant: 'tenant',
}

export const catalogFormDefaults = {
  statusActive: 1,
  scope: catalogScopes.global,
}

export const planFieldKeys = {
  name: 'name',
  description: 'description',
  price: 'price',
  status: 'status',
  billingCycle: 'billingCycle',
  features: 'features',
  modules: 'modules',
  permissions: 'permissions',
}

export const planListColumnKeys = {
  actions: 'actions',
}

export const planBillingCycles = {
  monthly: 'monthly',
  yearly: 'yearly',
  quarterly: 'quarterly',
}

export const planFormDefaults = {
  statusActive: 1,
  billingCycle: planBillingCycles.monthly,
}

export const roleDetailNumericIdArrayKeys = [
  'permissions_ids',
  'permissionsIds',
  'permission_ids',
  'permissionIds',
  'permissionIDs',
]

export const roleDetailPermissionEntryArrayKeys = [
  'permissions',
  'permission_list',
  'permissionList',
  'role_permissions',
  'rolePermissions',
  'permission_codes',
  'permissionCodes',
  'permission_names',
  'permissionNames',
]

export const rolePermissionEnvelopeKeys = [
  ...roleDetailNumericIdArrayKeys,
  ...roleDetailPermissionEntryArrayKeys,
]

export const protectedSystemRoleName = 'SUPER_ADMIN'

export const userFormDefaults = {
  statusActive: 1,
}

export const localeCodes = {
  enUs: 'en_US',
  esUs: 'es_US',
}

export const tenantModelFallbacks = {
  timezone: 'UTC',
  locale: localeCodes.enUs,
}

export const tenantFormDefaults = {
  timezonePicker: 'UTC-08:00',
  statusActive: 1,
  clinicType: 'PRIMARY_CARE',
}

export const clinicTypeValues = {
  primaryCare: 'PRIMARY_CARE',
  specialty: 'SPECIALTY',
  behavioralHealth: 'BEHAVIORAL_HEALTH',
  urgentCare: 'URGENT_CARE',
  telehealth: 'TELEHEALTH',
  multiSpecialty: 'MULTI_SPECIALTY',
}

export const htmlInputTypes = {
  text: 'text',
  email: 'email',
  password: 'password',
  tel: 'tel',
  textarea: 'textarea',
  number: 'number',
}

export const htmlInputModes = {
  tel: 'tel',
  numeric: 'numeric',
}

export const htmlAutocomplete = {
  off: 'off',
  newPassword: 'new-password',
  telNational: 'tel-national',
  email: 'email',
}

export const qSelectOptionKeys = {
  label: 'label',
  value: 'value',
}

export const selectBehaviors = {
  default: 'default',
  menu: 'menu',
  dialog: 'dialog',
}

export const quasarNotifyTypes = {
  positive: 'positive',
  negative: 'negative',
  warning: 'warning',
  info: 'info',
}

export const storedFileMaxBytes = 25 * 1024 * 1024

export const clipboardMimeTypes = {
  textPlain: 'text/plain',
}

export const quasarTransitions = {
  scale: 'scale',
}

export const dialogI18nKeys = {
  cancel: 'cancel',
  save: 'save',
}

export const dialogEmitEvents = {
  updateModelValue: 'update:modelValue',
  save: 'save',
}

export const cssOverflow = {
  auto: 'auto',
}

export const phoneInputNavKeys = [
  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End',
]

export const keyboardKeys = {
  unidentified: 'Unidentified',
  empty: '',
}

export const htmlButtonTypes = {
  submit: 'submit',
}

export const quasarTableAlign = {
  left: 'left',
  center: 'center',
  right: 'right',
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
