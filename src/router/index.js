import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: '主页', icon: 'dashboard' }
    }]
  },

  {
    path: '/edit-course', // 路由 URL
    component: Layout,
    children: [
      {
        path: '', // 子路由路径为空，意味着访问 /edit-course 时就渲染这个组件
        name: 'EditDeleteCourse',
        component: () => import('@/views/course/EditDeleteCourse'),
        meta: { title: '课程管理', icon: 'el-icon-notebook-2' } // 显示在侧边栏的标题和图标
      }
    ]
  },

  {
    path: '/manage-student',
    component: Layout,
    children: [
      {
        path: '',
        name: 'StudentManagement',
        component: () => import('@/views/student/StudentManagement'),
        meta: { title: '学生管理', icon: 'el-icon-user-solid' }
      }
    ]
  },

  {
    path: '/aichat',
    component: Layout,
    children: [
      {
        path: '',
        name: 'AIChat',
        component: () => import('@/views/aichat/index'),
        meta: { title: '大模型小助手', icon: 'el-icon-service' }
      }
    ]
  },

  // 保留您原有的 table 和 sql 路由，同样平铺
  {
    path: '/table',
    component: Layout,
    children: [
      {
        path: '', // 原来是 'index'，改为 '' 使 URL 更简洁
        name: 'Table',
        component: () => import('@/views/table/index'),
        meta: { title: '示例表格', icon: 'table' }
      }
    ]
  },

  {
    path: '/sql-query', // 建议给一个更明确的路径
    component: Layout,
    children: [
      {
        path: '', // 原来是 'index'，改为 ''
        name: 'SqlQuery',
        component: () => import('@/views/sql/index'),
        meta: { title: 'SQL查询', icon: 'el-icon-coin' }
      }
    ]
  },

  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://panjiachen.github.io/vue-element-admin-site/#/',
        meta: { title: 'External Link', icon: 'link' }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
