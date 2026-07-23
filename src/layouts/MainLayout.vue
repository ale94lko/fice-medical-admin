<template>
  <q-layout view="hHh Lpr lFf" class="app-layout">
    <q-header bordered class="app-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          data-testid="layout-btn-menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          FiCE Medical
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="notifications"
          data-testid="layout-btn-notifications"/>
        <q-btn
          flat
          round
          dense
          icon="manage_accounts"
          data-testid="layout-btn-account-menu">
          <q-menu class="user-menu">
            <q-list style="min-width: 100px">
              <q-item
                clickable
                data-testid="layout-btn-sign-out"
                @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>{{ t('signOut') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>
    <q-footer class="app-footer">
      <q-toolbar class="justify-center">
        <label>&copy; 2025 FiCE Medical Admin. Powered by LandA Apps</label>
      </q-toolbar>
    </q-footer>
    <q-drawer
      v-model="sidebar"
      class="app-drawer"
      :class="{ 'app-drawer--pinned': drawerPinned }"
      show-if-above
      bordered
      :mini-to-overlay="drawerMiniToOverlay"
      :mini="drawerMini"
      :width="drawerWidthPx"
      :mini-width="drawerMiniWidthPx"
      :breakpoint="drawerOverlayBreakpoint"
      @mouseenter="onDrawerMouseEnter"
      @mouseleave="onDrawerMouseLeave">
      <q-scroll-area
        class="fit"
        :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item
            clickable
            v-ripple
            to="/dashboard"
            data-testid="nav-dashboard"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>{{ t('dashboard') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/tenants"
            data-testid="nav-tenants"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="apartment" />
            </q-item-section>
            <q-item-section>{{ t('tenants') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/users"
            data-testid="nav-users"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>{{ t('users') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/roles"
            data-testid="nav-roles"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="badge" />
            </q-item-section>
            <q-item-section>{{ t('roles') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/permissions"
            data-testid="nav-permissions"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="vpn_key" />
            </q-item-section>
            <q-item-section>{{ t('permissions') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/modules"
            data-testid="nav-modules"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="extension" />
            </q-item-section>
            <q-item-section>{{ t('modules') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/catalogs"
            data-testid="nav-catalogs"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="category" />
            </q-item-section>
            <q-item-section>{{ t('catalogs') }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-ripple
            to="/plans"
            data-testid="nav-plans"
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="payments" />
            </q-item-section>
            <q-item-section>{{ t('plans') }}</q-item-section>
          </q-item>
          <q-expansion-item
            dense
            expand-separator
            icon="menu_book"
            :label="t('referenceData')"
            data-testid="nav-reference-data"
            header-class="app-drawer-expansion-header"
            expand-icon-class="app-drawer-expansion-icon"
            :default-opened="isReferenceDataRoute">
            <q-item
              clickable
              v-ripple
              dense
              to="/reference-data/catalogs"
              data-testid="nav-reference-catalogs"
              :active-class="activeClass">
              <q-item-section avatar>
                <q-icon name="list_alt" />
              </q-item-section>
              <q-item-section>
                {{ t('referenceDataCatalogs') }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              dense
              to="/reference-data/taxonomies"
              data-testid="nav-reference-taxonomies"
              :active-class="activeClass">
              <q-item-section avatar>
                <q-icon name="medical_services" />
              </q-item-section>
              <q-item-section>
                {{ t('referenceDataTaxonomies') }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              dense
              to="/reference-data/places-of-service"
              data-testid="nav-reference-pos"
              :active-class="activeClass">
              <q-item-section avatar>
                <q-icon name="place" />
              </q-item-section>
              <q-item-section>
                {{ t('referenceDataPlacesOfService') }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              dense
              to="/reference-data/imports"
              data-testid="nav-reference-imports"
              :active-class="activeClass">
              <q-item-section avatar>
                <q-icon name="cloud_upload" />
              </q-item-section>
              <q-item-section>
                {{ t('referenceDataImports') }}
              </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
      <div
        v-if="showDrawerPinControl && drawerPinned"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_left"
          data-testid="layout-btn-drawer-collapse"
          :title="t('collapseMenu')"
          :aria-label="t('collapseMenu')"
          @click="unpinDrawerToMini" />
      </div>
      <div
        v-else-if="showDrawerPinControl"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_right"
          data-testid="layout-btn-drawer-expand"
          :title="t('expandMenu')"
          :aria-label="t('expandMenu')"
          @click="pinDrawerExpanded" />
      </div>
    </q-drawer>
    <q-page-container
      id="app-content-root"
      class="app-content-root">
      <router-view />
    </q-page-container>
  </q-layout>
  <ModalComponent
    v-model="showSignOutConfirm"
    :confirm-text="t('confirm')"
    :cancel-text="t('cancel')"
    :title="t('confirmSignOutTitle')"
    :message="t('confirmSignOut')"
    @confirm="handleSignOutConfirm"
    @cancel="handleSignOutCancel"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import {
  drawerMiniWidthPx,
  drawerMobileMaxPx,
  drawerWidthPx,
} from 'components/constants.js'
import { useI18n } from 'vue-i18n'
import ModalComponent from 'components/ModalComponent.vue'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebar = ref($q.screen.width > drawerMobileMaxPx)
const drawerMiniCollapsed = ref(true)
const drawerPinned = ref(false)
const showSignOutConfirm = ref(false)
const drawerOverlayBreakpoint = drawerMobileMaxPx + 1

const windowWidth = computed(() => $q.screen.width)

const mobileView = computed(
  () => windowWidth.value <= drawerMobileMaxPx,
)

const isReferenceDataRoute = computed(
  () => String(route.path || '').startsWith('/reference-data'),
)

const drawerMini = computed(
  () => !mobileView.value && sidebar.value && !drawerPinned.value
    && drawerMiniCollapsed.value,
)

const drawerMiniToOverlay = computed(
  () => !mobileView.value && !drawerPinned.value,
)

const showDrawerPinControl = computed(
  () => sidebar.value && !mobileView.value,
)

const activeClass = computed(() => 'app-nav-item--active')

const { t } = useI18n()

const handleSignOutConfirm = () => {
  authStore.logout(router, t)
}

const handleSignOutCancel = () => {
  showSignOutConfirm.value = false
}

const toggleLeftDrawer = () => {
  sidebar.value = !sidebar.value
}

function onDrawerMouseEnter() {
  if (!mobileView.value && sidebar.value && !drawerPinned.value) {
    drawerMiniCollapsed.value = false
  }
}

function onDrawerMouseLeave() {
  if (!mobileView.value && !drawerPinned.value) {
    drawerMiniCollapsed.value = true
  }
}

function pinDrawerExpanded() {
  drawerPinned.value = true
  drawerMiniCollapsed.value = false
}

function unpinDrawerToMini() {
  drawerPinned.value = false
  drawerMiniCollapsed.value = true
}

const handleLogout = () => {
  showSignOutConfirm.value = true
}

watch(mobileView, isMobile => {
  if (isMobile) {
    sidebar.value = false
    drawerMiniCollapsed.value = true
    drawerPinned.value = false
  } else {
    sidebar.value = true
    drawerMiniCollapsed.value = true
    drawerPinned.value = false
  }
})
</script>
