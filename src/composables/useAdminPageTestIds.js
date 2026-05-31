import { testId as buildTestId } from 'src/utils/test-id.js'

/**
 * @param {string} pageKey - e.g. 'tenants', 'users'
 */
export function useAdminPageTestIds(pageKey) {
  function tid(...parts) {
    return buildTestId(pageKey, ...parts)
  }

  function rowTid(rowId, action) {
    return buildTestId(pageKey, 'row', rowId, action)
  }

  return {
    pageKey,
    tid,
    rowTid,
    tableTestId: buildTestId(pageKey, 'table'),
    formTestIdPrefix: buildTestId(pageKey, 'form'),
    filterTestIdPrefix: buildTestId(pageKey, 'filter'),
    deleteConfirmTestIdPrefix: buildTestId(pageKey, 'delete-confirm'),
    viewTestIdPrefix: buildTestId(pageKey, 'view'),
  }
}
