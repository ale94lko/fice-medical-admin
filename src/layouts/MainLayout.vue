<template>
  <q-layout view="hHh Lpr lff" class="app-layout">
    <q-header bordered class="app-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          FiCE Medical
        </q-toolbar-title>
        <q-btn flat round dense icon="notifications">
        </q-btn>
        <q-btn flat round dense icon="manage_accounts">
          <q-menu class="user-menu">
            <q-list style="min-width: 100px">
              <q-item clickable @click="handleLogout">
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
      show-if-above
      bordered
      :mini="drawerMini"
      :breakpoint="drawerOverlayBreakpoint">
      <q-scroll-area
        class="fit"
        :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item
            clickable
            v-ripple
            to="/dashboard"
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
            :active-class="activeClass">
            <q-item-section avatar>
              <q-icon name="payments" />
            </q-item-section>
            <q-item-section>{{ t('plans') }}</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
      <div
        v-if="showDrawerExpandControl && sidebarExpanded"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_left"
          :title="t('collapseMenu')"
          :aria-label="t('collapseMenu')"
          @click="collapseDrawerToMini" />
      </div>
      <div
        v-else-if="showDrawerExpandControl"
        class="absolute icon-hide">
        <q-btn
          dense
          flat
          icon="chevron_right"
          :title="t('expandMenu')"
          :aria-label="t('expandMenu')"
          @click="expandDrawer" />
      </div>
    </q-drawer>
    <q-page-container>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import {
  drawerMobileMaxPx,
  siteBreakpointsPx,
} from 'components/constants.js'
import { useI18n } from 'vue-i18n'
import ModalComponent from 'components/ModalComponent.vue'

// Composables
const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// State
const sidebar = ref(false)
const sidebarExpanded = ref(false)
const showSignOutConfirm = ref(false)
const drawerOverlayBreakpoint = drawerMobileMaxPx + 1

// Computed
const windowWidth = computed(() => $q.screen.width)

const mobileView = computed(
  () => windowWidth.value <= drawerMobileMaxPx,
)
const tabletView = computed(
  () => windowWidth.value > drawerMobileMaxPx
    && windowWidth.value < siteBreakpointsPx.MD,
)
const drawerMini = computed(
  () => sidebar.value && !sidebarExpanded.value && !mobileView.value,
)
const showDrawerExpandControl = computed(
  () => sidebar.value && !mobileView.value,
)
const activeClass = computed(() => 'app-nav-item--active')

// Methods
const { t } = useI18n()

const handleSignOutConfirm = () => {
  authStore.logout(router, t)
}

const handleSignOutCancel = () => {
  showSignOutConfirm.value = false
}

const toggleLeftDrawer = () => {
  if (mobileView.value) {
    sidebar.value = !sidebar.value

    return
  }
  sidebar.value = !sidebar.value
  if (sidebar.value && tabletView.value) {
    sidebarExpanded.value = false
  }
}

function expandDrawer() {
  if (mobileView.value) {
    return
  }
  sidebar.value = true
  sidebarExpanded.value = true
}

function collapseDrawerToMini() {
  sidebarExpanded.value = false
}

function collapseDrawerForTablet() {
  if (!tabletView.value) {
    return
  }
  sidebarExpanded.value = false
}

function syncDrawerWithViewport() {
  if (mobileView.value) {
    return
  }
  if (tabletView.value) {
    sidebarExpanded.value = false
  }
}

const handleLogout = () => {
  showSignOutConfirm.value = true
}

onMounted(() => {
  syncDrawerWithViewport()
})

watch(() => route.path, () => {
  collapseDrawerForTablet()
})

watch(windowWidth, () => {
  syncDrawerWithViewport()
})
</script>
