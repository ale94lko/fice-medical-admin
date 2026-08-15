import { onBeforeUnmount, onMounted, unref, watch } from 'vue'
import { useAppFooterPagination } from
  'src/composables/useAppFooterPagination.js'

export function useListFooterPagination({
  tablePagination,
  loading,
  loadPage,
  rowsNumber,
  rowsPerPageChoices = [20, 50, 100],
  summaryKey = 'adminTablePaginationSummary',
} = {}) {
  const {
    setFooterPagination,
    patchFooterPagination,
    clearFooterPagination,
  } = useAppFooterPagination()

  function currentRowsNumber() {
    if (rowsNumber != null) {
      return Number(unref(rowsNumber) ?? 0)
    }

    return Number(tablePagination.value.rowsNumber ?? 0)
  }

  function onPageChange(page) {
    if (page === tablePagination.value.page) {
      return undefined
    }
    tablePagination.value = { ...tablePagination.value, page }

    return loadPage(tablePagination.value)
  }

  function onRowsPerPageChange(nextRowsPerPage) {
    if (nextRowsPerPage === tablePagination.value.rowsPerPage) {
      return undefined
    }
    tablePagination.value = {
      ...tablePagination.value,
      page: 1,
      rowsPerPage: nextRowsPerPage,
    }

    return loadPage(tablePagination.value)
  }

  function onTableRequest(props) {
    const { pagination } = props
    const sortChanged = pagination.sortBy !== tablePagination.value.sortBy
      || pagination.descending !== tablePagination.value.descending
    if (!sortChanged) {
      return undefined
    }

    return loadPage({
      ...tablePagination.value,
      sortBy: pagination.sortBy,
      descending: pagination.descending,
      page: 1,
    })
  }

  function syncFooterPaginationBar() {
    patchFooterPagination({
      page: tablePagination.value.page,
      rowsPerPage: tablePagination.value.rowsPerPage,
      rowsNumber: currentRowsNumber(),
      disable: Boolean(unref(loading)),
      onPageChange,
      onRowsPerPageChange,
    })
  }

  onMounted(() => {
    setFooterPagination({
      page: tablePagination.value.page,
      rowsPerPage: tablePagination.value.rowsPerPage,
      rowsNumber: currentRowsNumber(),
      disable: Boolean(unref(loading)),
      rowsPerPageChoices,
      summaryKey,
      perPageKey: 'adminTablePerPage',
      onPageChange,
      onRowsPerPageChange,
    })
  })

  onBeforeUnmount(() => {
    clearFooterPagination()
  })

  watch(
    () => [
      tablePagination.value.page,
      tablePagination.value.rowsPerPage,
      currentRowsNumber(),
      Boolean(unref(loading)),
    ],
    () => {
      syncFooterPaginationBar()
    },
  )

  return {
    onTableRequest,
    onPageChange,
    onRowsPerPageChange,
  }
}
