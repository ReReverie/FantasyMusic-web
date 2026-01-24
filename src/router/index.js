import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
    hidden: true
  },
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', icon: 'House' }
      }
    ]
  },
  {
    path: '/music',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Music',
        component: () => import('@/views/music/index.vue'),
        meta: { title: '音乐库', icon: 'Headset' }
      }
    ]
  },
  {
    path: '/playlist',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Playlist',
        component: () => import('@/views/playlist/index.vue'),
        meta: { title: '我的歌单', icon: 'Collection' }
      }
    ]
  },
  {
    path: '/account',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Account',
        component: () => import('@/views/account/index.vue'),
        meta: { title: '个人中心', icon: 'User' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
