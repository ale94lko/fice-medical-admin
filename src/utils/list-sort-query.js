export function listSortQueryParams({
  sortBy,
  descending,
} = {}) {
  const key = String(sortBy ?? '').trim()
  if (!key || key === 'actions') {
    return {}
  }
  return {
    'sort_by': key,
    'sort_dir': descending === true ? 'DESC' : 'ASC',
  }
}

export function listPaginationParams(params, stored = {}) {
  const page = Number(params.page ?? stored.page ?? 1)
  const limit = Number(params.limit ?? stored.limit ?? 20)
  const safePage = Number.isFinite(page) && page >= 1 ? page : 1
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? limit : 20
  const sortBy = params.sortBy ?? stored.sortBy
  const descending = params.descending ?? stored.descending ?? false

  return {
    query: {
      page: safePage,
      limit: safeLimit,
      sortBy,
      descending,
    },
    apiParams: {
      page: Math.max(0, safePage - 1),
      limit: safeLimit,
      ...listSortQueryParams({ sortBy, descending }),
    },
  }
}
