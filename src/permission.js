import router from './router'
import { useUserStore } from '@/store/user'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import pinia from '@/store' // Ensure pinia instance is used

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/register'] // no redirect whitelist

router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = (to.meta.title ? to.meta.title + ' - ' : '') + 'Fantasy Music'

  // determine whether the user has logged in
  const hasToken = localStorage.getItem('token')

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const userStore = useUserStore(pinia)
      const hasUserInfo = userStore.nickname
      if (hasUserInfo) {
        next()
      } else {
        try {
          // get user info
          await userStore.getUserInfo()
          next()
        } catch (error) {
          // remove token and go to login page to re-login
          await userStore.logout()
          sessionStorage.setItem('redirect_path', to.fullPath)
          next(`/login`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      if (!to.path.includes('hybridaction') && !to.path.includes('zybTracker')) {
        sessionStorage.setItem('redirect_path', to.fullPath)
      }
      next(`/login`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
