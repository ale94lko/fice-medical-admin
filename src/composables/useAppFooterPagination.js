import { reactive } from 'vue'

const footerPaginationState = reactive({
  visible: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  rowsPerPageChoices: [20, 50, 100],
  summaryKey: 'adminTablePaginationSummary',
  perPageKey: 'adminTablePerPage',
  disable: false,
  onPageChange: null,
  onRowsPerPageChange: null,
})

export function useAppFooterPagination() {
  function setFooterPagination(options = {}) {
    footerPaginationState.visible = true
    footerPaginationState.page = options.page ?? 1
    footerPaginationState.rowsPerPage = options.rowsPerPage ?? 20
    footerPaginationState.rowsNumber = options.rowsNumber ?? 0
    footerPaginationState.rowsPerPageChoices =
      options.rowsPerPageChoices ?? [20, 50, 100]
    footerPaginationState.summaryKey =
      options.summaryKey ?? 'adminTablePaginationSummary'
    footerPaginationState.perPageKey =
      options.perPageKey ?? 'adminTablePerPage'
    footerPaginationState.disable = Boolean(options.disable)
    footerPaginationState.onPageChange =
      options.onPageChange ?? null
    footerPaginationState.onRowsPerPageChange =
      options.onRowsPerPageChange ?? null
  }

  function patchFooterPagination(partial = {}) {
    if (partial.page != null) {
      footerPaginationState.page = partial.page
    }
    if (partial.rowsPerPage != null) {
      footerPaginationState.rowsPerPage = partial.rowsPerPage
    }
    if (partial.rowsNumber != null) {
      footerPaginationState.rowsNumber = partial.rowsNumber
    }
    if (partial.disable != null) {
      footerPaginationState.disable = partial.disable
    }
    if (partial.onPageChange) {
      footerPaginationState.onPageChange = partial.onPageChange
    }
    if (partial.onRowsPerPageChange) {
      footerPaginationState.onRowsPerPageChange =
        partial.onRowsPerPageChange
    }
  }

  function clearFooterPagination() {
    footerPaginationState.visible = false
    footerPaginationState.onPageChange = null
    footerPaginationState.onRowsPerPageChange = null
  }

  return {
    footerPaginationState,
    setFooterPagination,
    patchFooterPagination,
    clearFooterPagination,
  }
}
