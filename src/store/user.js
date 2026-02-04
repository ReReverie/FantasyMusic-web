import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/user'
import { encrypt } from '@/utils/jsencrypt'
import { usePlayerStore } from './player'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    id: '',
    username: '',
    nickname: '',
    email: '',
    avatar: '',
    userLevelValue: '',
    roles: []
  }),
  actions: {
    login(userInfo) {
      const { username, password } = userInfo
      return new Promise((resolve, reject) => {
        // RSA Encryption
        const encryptedPassword = encrypt(password)
        if (!encryptedPassword) {
          reject(new Error('Password encryption failed'))
          return
        }
        
        login({ username: username.trim(), password: encryptedPassword }).then(response => {
          // data = { id, nickname, token }
          const data = response
          this.token = data.token
          this.id = data.id
          this.nickname = data.nickname
          this.username = username.trim() // store the username used for login
          
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
          const { id, username, nickname, email, avatarUrl, userLevelValue } = data
          this.id = id
          this.username = username
          this.nickname = nickname
          this.email = email
          this.avatar = avatarUrl
          this.userLevelValue = userLevelValue
          resolve(data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    logout() {
      return new Promise((resolve, reject) => {
        // 定义清除本地状态的函数
        const clearLocalState = () => {
          // 1. 调用 Player Store 的重置方法 (确保在 User ID 清除前或后？)
          // 最好在 User ID 清除前，或者 resetState 内部不依赖 ID
          const playerStore = usePlayerStore()
          playerStore.resetState()

          this.token = ''
          this.id = ''
          this.username = ''
          this.nickname = ''
          this.email = ''
          this.avatar = ''
          this.userLevelValue = ''
          localStorage.removeItem('token')
        }

        logout().then(() => {
          clearLocalState()
          resolve()
        }).catch(error => {
          // 即使后端接口报错（如Token过期），前端也应该强制清除本地状态
          clearLocalState()
          resolve() // resolve 允许前端继续跳转到登录页
        })
      })
    }
  }
})
