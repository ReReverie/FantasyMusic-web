import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // url = base url + request url
  timeout: 5000 // request timeout
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    // 例如，如果有 token，可以加入 headers
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = token
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  async response => {
    // 如果是 Blob 类型，返回整个 response 对象，以便获取 headers (如文件名)
    if (response.config.responseType === 'blob' || response.data instanceof Blob) {
      // 检查是否是 JSON 格式的错误信息
      if (response.data.type === 'application/json') {
        try {
          const text = await response.data.text()
          const res = JSON.parse(text)
          if (res.code !== 1) {
             ElMessage({
              message: res.msg || 'Error',
              type: 'error',
              duration: 5 * 1000
            })
            const err = new Error(res.msg || 'Error')
            err.code = res.code
            err.isHandled = true
            return Promise.reject(err)
          }
        } catch (e) {
          // 解析失败，继续按 Blob 处理
        }
      }
      return response
    }

    const res = response.data
    
    // 特殊处理：如果后端直接返回 URL 字符串 (例如 OSS 签名链接)，视为成功
    if (typeof res === 'string' && (res.startsWith('http://') || res.startsWith('https://'))) {
      return res
    }

    // 根据后端约定的状态码判断
    // 兼容 code === 1 和 code === 200 为成功
    if (res.code !== 1 && res.code !== 200) {
      // 允许通过配置 skipErrorMessage 跳过默认的错误提示
      if (!response.config.skipErrorMessage) {
        ElMessage({
          message: res.msg || 'Error',
          type: 'error',
          duration: 5 * 1000
        })
      }
      const err = new Error(res.msg || 'Error')
      err.code = res.code
      err.isHandled = true
      return Promise.reject(err)
    } else {
      return res.data
    }
  },
  error => {
    console.log('err' + error) // for debug
    
    let message = error.message
    if (error.response && error.response.data) {
      // 尝试获取后端返回的具体错误信息 (msg 或 message)
      message = error.response.data.msg || error.response.data.message || message
    }

    // 允许通过配置 skipErrorMessage 跳过默认的错误提示
    if (!error.config || !error.config.skipErrorMessage) {
      // 检查是否是网络错误
      if (error.message === 'Network Error') {
        ElMessage.error('无法连接到服务器，请检查后端服务是否启动，或者代理配置是否生效')
      } else {
        ElMessage({
          message: message,
          type: 'error',
          duration: 5 * 1000
        })
      }
    }
    
    // 更新 error 对象的信息，以便后续 catch 块能获取到正确的错误信息
    error.message = message
    error.isHandled = true
    return Promise.reject(error)
  }
)

export default service
