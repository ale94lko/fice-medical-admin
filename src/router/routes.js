const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('pages/dashboard/DashboardPage.vue'),
      },
      {
        path: 'tenants',
        component: () => import('pages/administration/TenantList.vue'),
      },
      {
        path: 'users',
        component: () => import('pages/administration/UserList.vue'),
      },
      {
        path: 'roles',
        component: () => import('pages/administration/RoleList.vue'),
      },
      {
        path: 'permissions',
        component: () => import('pages/administration/PermissionList.vue'),
      },
      {
        path: 'modules',
        component: () => import('pages/administration/ModuleList.vue'),
      },
      {
        path: 'catalogs',
        component: () => import('pages/administration/CatalogList.vue'),
      },
      {
        path: 'plans',
        component: () => import('pages/administration/PlanList.vue'),
      },
    ],
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/account/LoginPage.vue'),
      },
    ],
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/account/ResetPasswordPage.vue'),
      },
    ],
    meta: { requiresAuth: false },
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  }
]

export default routes
