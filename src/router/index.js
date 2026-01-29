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
    path: '/musiclist',
    component: Layout,
    children: [
      {
        path: '',
        name: 'MusicList',
        component: () => import('@/views/musiclist/index.vue'),
        meta: { title: '我的歌单', icon: 'Collection' }
      },
      {
        path: ':id',
        name: 'MusicListDetail',
        component: () => import('@/views/musiclist/detail.vue'),
        meta: { title: '歌单详情', icon: 'Collection', hidden: true }
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
  },
  {
    path: '/password',
    component: Layout,
    children: [
      {
        path: '',
        name: 'ChangePassword',
        component: () => import('@/views/password/index.vue'),
        meta: { title: '修改密码', icon: 'Lock' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
