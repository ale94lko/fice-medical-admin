<template>
  <q-page class="admin-page">
    <AppLoadingOverlay
      scope="content"
      :showing="pageOverlayShowing"
      :message="pageOverlayMessage" />

    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <div class="text-h6">{{ t('referenceDataCatalogs') }}</div>
        <div class="text-caption text-grey-7">
          {{ t('referenceDataCatalogsSubtitle') }}
        </div>
      </div>
      <div class="col-auto">
        <q-btn
          outline
          no-caps
          color="primary"
          class="app-btn-outline"
          icon="refresh"
          :data-testid="tid('btn', 'refresh')"
          :disable="loading"
          :label="t('dashboardRefresh')"
          @click="loadCatalogs" />
      </div>
    </div>

    <q-banner
      v-if="errorMessage"
      rounded
      class="bg-negative text-white q-mb-md"
      :data-testid="tid('error', 'banner')">
      {{ errorMessage }}
    </q-banner>

    <AdminQTable
      class="table admin-data-table"
      :test-id="tableTestId"
      row-key="id"
      :rows="rows"
      :columns="columns"
      :loading="false"
      :pagination="{ rowsPerPage: 0 }"
      hide-pagination
      :rows-per-page-label="t('rowsPerPage')">
      <template #body-cell-status="scope">
        <q-td :props="scope">
          <q-badge
            :color="statusBadgeColor(scope.row.status)"
            outline>
            {{ statusLabel(scope.row.status) }}
          </q-badge>
          <span
            v-if="isStub(scope.row)"
            class="q-ml-sm text-caption text-grey-6">
            {{ t('referenceDataComingSoon') }}
          </span>
        </q-td>
      </template>
      <template #body-cell-source_url="scope">
        <q-td :props="scope">
          <a
            v-if="scope.row.source_url"
            :href="scope.row.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary">
            {{ t('referenceDataSourceLink') }}
          </a>
          <span v-else>—</span>
        </q-td>
      </template>
      <template #row-actions="{ row }">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="upload_file"
          class="q-mr-xs"
          :data-testid="rowTid(row.id, 'upload')"
          :disable="!canImport(row)"
          :title="uploadButtonTitle(row)"
          :label="t('referenceDataUploadFile')"
          @click="goUpload(row)" />
        <q-btn
          flat
          dense
          no-caps
          color="teal"
          icon="cloud_download"
          :data-testid="rowTid(row.id, 'from-source')"
          :disable="!canAutoImport(row)"
          :title="autoImportButtonTitle(row)"
          :label="t('referenceDataImportFromSource')"
          @click="goFromSource(row)" />
      </template>
    </AdminQTable>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="text-center text-grey-7 q-pa-lg"
      :data-testid="tid('empty')">
      {{ t('referenceDataEmptyCatalogs') }}
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  quasarTableAlign,
  referenceDataCatalogStatuses,
} from 'components/constants.js'
import AdminQTable from 'components/AdminQTable.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import { useAdminPageTestIds } from 'src/composables/useAdminPageTestIds.js'
import { usePageLoadingOverlay }
  from 'src/composables/usePageLoadingOverlay.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import {
  isReferenceCatalogImportable,
  listReferenceCatalogs,
  referenceDataErrorMessage,
  supportsReferenceAutoDownload,
} from 'src/services/reference-data-api.js'

const {
  tid,
  rowTid,
  tableTestId,
} = useAdminPageTestIds('ref-catalogs')

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const rows = ref([])
const errorMessage = ref('')

const { showing: pageOverlayShowing, message: pageOverlayMessage } =
  usePageLoadingOverlay({ loading })

const columns = computed(() => [
  {
    name: 'code',
    label: t('referenceDataCode'),
    align: quasarTableAlign.left,
    field: 'code',
  },
  {
    name: 'name',
    label: t('name'),
    align: quasarTableAlign.left,
    field: 'name',
  },
  {
    name: 'source_authority',
    label: t('referenceDataAuthority'),
    align: quasarTableAlign.left,
    field: row => row.source_authority || '—',
  },
  {
    name: 'status',
    label: t('status'),
    align: quasarTableAlign.left,
    field: 'status',
  },
  {
    name: 'active_version',
    label: t('referenceDataActiveVersion'),
    align: quasarTableAlign.left,
    field: row => row.active_version || '—',
  },
  {
    name: 'source_url',
    label: t('referenceDataSourceUrl'),
    align: quasarTableAlign.left,
    field: 'source_url',
  },
  {
    name: 'actions',
    label: t('actions'),
    align: quasarTableAlign.right,
    field: 'id',
  },
])

function isStub(row) {
  return String(row?.status ?? '').toUpperCase()
    === referenceDataCatalogStatuses.stub
}

function canImport(row) {
  return isReferenceCatalogImportable(row)
}

function canAutoImport(row) {
  return supportsReferenceAutoDownload(row)
}

function statusLabel(status) {
  const s = String(status ?? '').toUpperCase()
  if (s === referenceDataCatalogStatuses.active) {
    return t('referenceDataStatusActive')
  }
  if (s === referenceDataCatalogStatuses.stub) {
    return t('referenceDataStatusStub')
  }

  return s || '—'
}

function statusBadgeColor(status) {
  const s = String(status ?? '').toUpperCase()
  if (s === referenceDataCatalogStatuses.active) {
    return 'positive'
  }
  if (s === referenceDataCatalogStatuses.stub) {
    return 'grey'
  }

  return 'primary'
}

function uploadButtonTitle(row) {
  if (canImport(row)) {
    return t('referenceDataUploadFile')
  }

  return t('referenceDataComingSoon')
}

function autoImportButtonTitle(row) {
  if (canAutoImport(row)) {
    return t('referenceDataImportFromSource')
  }
  if (canImport(row)) {
    return t('referenceDataAutoImportUnavailable')
  }

  return t('referenceDataComingSoon')
}

function goUpload(row) {
  if (!canImport(row)) {
    return
  }
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': row.code,
      mode: 'upload',
    },
  })
}

function goFromSource(row) {
  if (!canAutoImport(row)) {
    return
  }
  router.push({
    path: '/reference-data/imports',
    query: {
      'catalog_code': row.code,
      mode: 'from-source',
    },
  })
}

async function loadCatalogs() {
  loading.value = true
  errorMessage.value = ''
  try {
    rows.value = await listReferenceCatalogs()
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      errorMessage.value =
        referenceDataErrorMessage(error)
        || t('referenceDataCatalogsLoadError')
    }
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCatalogs()
})
</script>
