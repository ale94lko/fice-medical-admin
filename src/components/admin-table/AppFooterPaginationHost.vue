<template>
  <AdminTablePaginationBar
    v-if="footerPaginationState.visible"
    class="admin-table-pagination--footer"
    :page="footerPaginationState.page"
    :rows-per-page="footerPaginationState.rowsPerPage"
    :rows-number="footerPaginationState.rowsNumber"
    :rows-per-page-choices="footerPaginationState.rowsPerPageChoices"
    :summary-key="footerPaginationState.summaryKey"
    :per-page-key="footerPaginationState.perPageKey"
    :disable="footerPaginationState.disable"
    @update:page="onPageChange"
    @update:rows-per-page="onRowsPerPageChange"
  />
</template>

<script setup>
import AdminTablePaginationBar from
  'components/admin-table/AdminTablePaginationBar.vue'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'

const { footerPaginationState } = useAppFooterPagination()

function onPageChange(page) {
  footerPaginationState.onPageChange?.(page)
}

function onRowsPerPageChange(rowsPerPage) {
  footerPaginationState.onRowsPerPageChange?.(rowsPerPage)
}
</script>
