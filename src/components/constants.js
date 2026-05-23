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

export const defaultTenant = 'main'

export const primarySuperadminUser = 'superadmin@fice.medical'

export const apiPaths = {
  plans: '/plans/v1',
  tenantsList: '/admin-tenant/v1/tenants',
  tenantsCreate: '/admin-tenant/v1/tenants/create',
  usersList: '/admin-tenant/v1/users',
  usersRegister: '/admin-tenant/v1/users/register',
  usersChangePassword: '/admin-tenant/v1/users/change-password',
  rolesList: '/roles/v1',
  rolesCreate: '/admin-tenant/v1/role/add',
  rolesUpdate: '/admin-tenant/v1/role/update',
  permissionsList: '/permissions/v1',
  permissionsUpdate: '/admin-tenant/v1/permissions/update',
  modulesList: '/modules/v1',
  modulesCreate: '/modules/v1/create',
  modulesUpdate: '/modules/v1/update',
  moduleAdminItem: '/admin-tenant/v1/module',
  catalogList: '/admin-tenant/v1/catalog',
  catalogCreate: '/admin-tenant/v1/catalog/create',
  oauthLogin: '/oauth/v1/login',
  oauthRefresh: '/oauth/v1/refresh',
  oauthResetPassword: '/oauth/v1/reset-password',
  logout: '/logout',
}

export const authStorageKeys = {
  token: 'token',
  expireAt: 'expireAt',
  expireAtLegacy: 'expiresAt',
  refresh: 'refreshToken',
  refreshLegacy: 'refresh_token',
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
}

export const tenantFieldKeys = {
  name: 'name',
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
}

export const htmlInputTypes = {
  text: 'text',
  email: 'email',
  password: 'password',
  tel: 'tel',
  textarea: 'textarea',
}

export const htmlInputModes = {
  tel: 'tel',
}

export const htmlAutocomplete = {
  off: 'off',
  newPassword: 'new-password',
  telNational: 'tel-national',
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
