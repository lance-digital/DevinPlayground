import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'TopPage',
      component: () => import('../views/TopPage.vue')
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/RegisterPage.vue')
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfilePage.vue')
    },
    {
      path: '/posts',
      name: 'PostList',
      component: () => import('../views/PostListPage.vue')
    },
    {
      path: '/posts/create',
      name: 'PostCreate',
      component: () => import('../views/PostCreatePage.vue')
    },
    {
      path: '/posts/:id',
      name: 'PostDetail',
      component: () => import('../views/PostDetailPage.vue')
    },
    {
      path: '/posts/:id/edit',
      name: 'PostEdit',
      component: () => import('../views/PostEditPage.vue')
    },
    {
      path: '/categories',
      name: 'Category',
      component: () => import('../views/CategoryPage.vue')
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: () => import('../views/AdminDashboard.vue')
    }
  ]
})

export default router
