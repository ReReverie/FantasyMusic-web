import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    name: '',
    avatar: '',
    roles: []
  }),
  actions: {
    login(userInfo) {
      const { username, password } = userInfo
      return new Promise((resolve, reject) => {
        login({ username: username.trim(), password: password }).then(response => {
          // 假设后端返回的数据结构中包含 token
          const data = response
          // 这里假设返回的就是 token 字符串，或者 data.token
          // 根据 unified response { code: 1, msg: "success", data: ... }
          // request.js 已经解包了 data
          this.token = data.token
          localStorage.setItem('token', data.token)
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },
    getUserInfo() {
      return new Promise((resolve, reject) => {
        getUserInfo().then(response => {
          const data = response
          if (!data) {
            reject('Verification failed, please Login again.')
          }
          const { name, avatar } = data
          this.name = name
          this.avatar = avatar
          resolve(data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    logout() {
      return new Promise((resolve, reject) => {
        logout().then(() => {
          this.token = ''
          this.name = ''
          this.avatar = ''
          localStorage.removeItem('token')
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    }
  }
})
