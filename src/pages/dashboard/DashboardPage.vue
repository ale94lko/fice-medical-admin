<template>
  <q-page class="admin-page dashboard-page">
    <AppLoadingOverlay
      scope="content"
      :showing="loading" />
    <header class="dashboard-header">
      <div>
        <h1 class="dashboard-header__title">{{ t('dashboardTitle') }}</h1>
        <p class="dashboard-header__subtitle">
          {{ t('dashboardSubtitle') }}
        </p>
        <p
          v-if="lastUpdated && !loading"
          class="dashboard-header__updated">
          {{ t('dashboardLastUpdated') }}:
          {{ formatUpdated(lastUpdated) }}
        </p>
      </div>
      <q-btn
        outline
        no-caps
        color="primary"
        class="app-btn-outline"
        icon="refresh"
        data-testid="dashboard-btn-refresh"
        :loading="loading"
        :label="t('dashboardRefresh')"
        @click="refresh" />
    </header>

    <q-banner
      v-if="error"
      rounded
      class="bg-negative text-white q-mb-md"
      data-testid="dashboard-error-banner">
      {{ t('dashboardLoadError') }}
    </q-banner>

    <section class="dashboard-kpi-grid">
      <DashboardStatCard
        icon="apartment"
        :label="t('tenants')"
        :value="summary.tenants"
        :hint="kpiTenantHint"
        :loading="loading"
        icon-color="#0f766e"
        icon-bg="rgba(15, 118, 110, 0.12)"
        test-id="dashboard-kpi-tenants" />
      <DashboardStatCard
        icon="people"
        :label="t('users')"
        :value="summary.users"
        :hint="kpiUserHint"
        :loading="loading"
        icon-color="#0ea5e9"
        icon-bg="rgba(14, 165, 233, 0.12)"
        test-id="dashboard-kpi-users" />
      <DashboardStatCard
        icon="badge"
        :label="t('roles')"
        :value="summary.roles"
        :loading="loading"
        icon-color="#6366f1"
        icon-bg="rgba(99, 102, 241, 0.12)"
        test-id="dashboard-kpi-roles" />
      <DashboardStatCard
        icon="lock"
        :label="t('permissions')"
        :value="summary.permissions"
        :loading="loading"
        icon-color="#d97706"
        icon-bg="rgba(217, 119, 6, 0.12)"
        test-id="dashboard-kpi-permissions" />
      <DashboardStatCard
        icon="view_module"
        :label="t('modules')"
        :value="summary.modules"
        :loading="loading"
        icon-color="#16a34a"
        icon-bg="rgba(22, 163, 74, 0.12)"
        test-id="dashboard-kpi-modules" />
      <DashboardStatCard
        icon="paid"
        :label="t('plans')"
        :value="summary.plans"
        :hint="kpiPlanHint"
        :loading="loading"
        icon-color="#14b8a6"
        icon-bg="rgba(20, 184, 166, 0.12)"
        test-id="dashboard-kpi-plans" />
      <DashboardStatCard
        icon="menu_book"
        :label="t('catalogs')"
        :value="summary.catalogs"
        :hint="kpiCatalogHint"
        :loading="loading"
        icon-color="#ec4899"
        icon-bg="rgba(236, 72, 153, 0.12)"
        test-id="dashboard-kpi-catalogs" />
      <DashboardStatCard
        icon="insights"
        :label="t('dashboardCatalogItems')"
        :value="summary.catalogItems"
        :loading="loading"
        icon-color="#64748b"
        icon-bg="rgba(100, 116, 139, 0.12)"
        test-id="dashboard-kpi-catalog-items" />
    </section>

    <section class="dashboard-charts-grid">
      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardTenantStatusChart') }}
          </div>
          <div class="dashboard-panel__caption">
            {{ t('dashboardClientTenantsCaption') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardDonutChart
            :segments="labeledTenantStatus"
            :title="t('dashboardTenantStatusChart')"
            :total-label="t('dashboardTotal')"
            :empty-label="t('dashboardNoData')"
            :loading="loading"
            test-id="dashboard-chart-tenant-status" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardUserStatusChart') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardDonutChart
            :segments="labeledUserStatus"
            :title="t('dashboardUserStatusChart')"
            :total-label="t('dashboardTotal')"
            :empty-label="t('dashboardNoData')"
            :loading="loading"
            test-id="dashboard-chart-user-status" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardTenantsByPlan') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardBarChart
            :items="tenantsByPlan"
            :loading="loading"
            :empty-label="t('dashboardNoData')"
            test-id="dashboard-chart-tenants-plan" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardUsersByTenant') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardBarChart
            :items="usersByTenant"
            :loading="loading"
            :empty-label="t('dashboardNoData')"
            test-id="dashboard-chart-users-tenant" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardPermissionsByModule') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardBarChart
            :items="permissionsByModule"
            :loading="loading"
            :empty-label="t('dashboardNoData')"
            test-id="dashboard-chart-permissions-module" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardPlanBillingChart') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardDonutChart
            :segments="labeledPlanBilling"
            :title="t('dashboardPlanBillingChart')"
            :total-label="t('dashboardTotal')"
            :empty-label="t('dashboardNoData')"
            :loading="loading"
            test-id="dashboard-chart-plan-billing" />
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardCatalogScopeChart') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-panel__body">
          <DashboardDonutChart
            :segments="labeledCatalogScope"
            :title="t('dashboardCatalogScopeChart')"
            :total-label="t('dashboardTotal')"
            :empty-label="t('dashboardNoData')"
            :loading="loading"
            test-id="dashboard-chart-catalog-scope" />
        </q-card-section>
      </q-card>
    </section>

    <section class="dashboard-bottom-grid">
      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardQuickAccess') }}
          </div>
        </q-card-section>
        <q-card-section class="dashboard-quick-links">
          <router-link
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="dashboard-quick-link"
            :data-testid="link.testId">
            <q-icon :name="link.icon" size="20px" />
            <span>{{ link.label }}</span>
            <q-icon
              name="chevron_right"
              size="18px"
              class="dashboard-quick-link__arrow" />
          </router-link>
        </q-card-section>
      </q-card>

      <q-card
        flat
        bordered
        class="dashboard-panel">
        <q-card-section class="dashboard-panel__head">
          <div class="dashboard-panel__title">
            {{ t('dashboardActiveTenants') }}
          </div>
        </q-card-section>
        <q-card-section class="q-pa-none">
          <q-list
            v-if="loading"
            class="dashboard-tenant-list">
            <q-item
              v-for="n in 4"
              :key="n">
              <q-item-section>
                <q-skeleton type="text" width="60%" />
                <q-skeleton type="text" width="40%" />
              </q-item-section>
            </q-item>
          </q-list>
          <q-list
            v-else-if="featuredTenants.length"
            class="dashboard-tenant-list">
            <q-item
              v-for="tenant in featuredTenants"
              :key="tenant.id"
              clickable
              :to="'/tenants'"
              class="dashboard-tenant-list__item">
              <q-item-section avatar>
                <q-avatar
                  color="primary"
                  text-color="white"
                  size="36px"
                  font-size="14px">
                  {{ tenantInitial(tenant) }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ tenant[tk.name] }}</q-item-label>
                <q-item-label caption>
                  {{ tenant[tk.domain] || '—' }}
                  · {{ tenant[tk.planName] || t('dashboardNoPlan') }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  color="positive"
                  :label="t('tenantStatusActive')" />
              </q-item-section>
            </q-item>
          </q-list>
          <div
            v-else
            class="dashboard-panel__empty-list">
            {{ t('dashboardNoActiveTenants') }}
          </div>
        </q-card-section>
      </q-card>
    </section>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  catalogScopes,
  planBillingCycles,
  tenantFieldKeys,
} from 'components/constants.js'
import DashboardStatCard from 'components/dashboard/DashboardStatCard.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import DashboardDonutChart from 'components/dashboard/DashboardDonutChart.vue'
import DashboardBarChart from 'components/dashboard/DashboardBarChart.vue'
import { useDashboardStats } from 'src/composables/useDashboardStats.js'

const { t, locale } = useI18n()
const tk = tenantFieldKeys

const {
  loading,
  error,
  lastUpdated,
  refresh,
  summary,
  tenantStatusSegments,
  userStatusSegments,
  tenantsByPlan,
  usersByTenant,
  permissionsByModule,
  planBillingSegments,
  catalogScopeSegments,
  featuredTenants,
} = useDashboardStats()

const kpiTenantHint = computed(() =>
  t('dashboardKpiActiveInactive', {
    active: summary.value.tenantsActive,
    inactive: summary.value.tenantsInactive,
  }),
)

const kpiUserHint = computed(() =>
  t('dashboardKpiActiveInactive', {
    active: summary.value.usersActive,
    inactive: summary.value.usersInactive,
  }),
)

const kpiPlanHint = computed(() => {
  const parts = [
    t('dashboardKpiPlansActive', { count: summary.value.plansActive }),
  ]
  if (summary.value.avgPlanPrice > 0) {
    parts.push(
      t('dashboardKpiAvgPrice', {
        price: formatCurrency(summary.value.avgPlanPrice),
      }),
    )
  }

  return parts.join(' · ')
})

const kpiCatalogHint = computed(() =>
  t('dashboardKpiCatalogItems', { count: summary.value.catalogItems }),
)

const labeledTenantStatus = computed(() =>
  tenantStatusSegments.value.map(seg => ({
    ...seg,
    label: seg.label === 'active'
      ? t('tenantStatusActive')
      : t('tenantStatusInactive'),
  })),
)

const labeledUserStatus = computed(() =>
  userStatusSegments.value.map(seg => ({
    ...seg,
    label: seg.label === 'active'
      ? t('tenantStatusActive')
      : t('tenantStatusInactive'),
  })),
)

const labeledPlanBilling = computed(() =>
  planBillingSegments.value.map(seg => ({
    ...seg,
    label: planBillingLabel(seg.label),
  })),
)

const labeledCatalogScope = computed(() =>
  catalogScopeSegments.value.map(seg => ({
    ...seg,
    label: catalogScopeLabel(seg.label),
  })),
)

const quickLinks = computed(() => [
  {
    to: '/tenants',
    icon: 'apartment',
    label: t('tenants'),
    testId: 'dashboard-link-tenants',
  },
  {
    to: '/users',
    icon: 'people',
    label: t('users'),
    testId: 'dashboard-link-users',
  },
  {
    to: '/roles',
    icon: 'badge',
    label: t('roles'),
    testId: 'dashboard-link-roles',
  },
  {
    to: '/permissions',
    icon: 'lock',
    label: t('permissions'),
    testId: 'dashboard-link-permissions',
  },
  {
    to: '/modules',
    icon: 'view_module',
    label: t('modules'),
    testId: 'dashboard-link-modules',
  },
  {
    to: '/plans',
    icon: 'paid',
    label: t('plans'),
    testId: 'dashboard-link-plans',
  },
  {
    to: '/catalogs',
    icon: 'menu_book',
    label: t('catalogs'),
    testId: 'dashboard-link-catalogs',
  },
])

function planBillingLabel(cycle) {
  const v = String(cycle ?? '').trim()
  if (v === planBillingCycles.monthly) {
    return t('planBillingMonthly')
  }
  if (v === planBillingCycles.yearly) {
    return t('planBillingYearly')
  }
  if (v === planBillingCycles.quarterly) {
    return t('planBillingQuarterly')
  }

  return v || t('dashboardOther')
}

function catalogScopeLabel(scope) {
  const v = String(scope ?? '').trim()
  if (v === catalogScopes.global) {
    return t('catalogScopeGlobal')
  }
  if (v === catalogScopes.tenant) {
    return t('catalogScopeTenant')
  }

  return v || t('dashboardOther')
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${Math.round(amount)}`
  }
}

function formatUpdated(date) {
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

function tenantInitial(tenant) {
  const name = String(tenant?.[tk.name] ?? '').trim()

  return (name.charAt(0) || '?').toUpperCase()
}
</script>
