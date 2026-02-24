import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // url = base url + request url
  timeout: 30000 // request timeout (由5s改为30s，适应邮件发送/文件上传等耗时操作)
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
              duration: 5 * 1000,
              grouping: true
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
          duration: 5 * 1000,
          grouping: true
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
    
    // 如果配置了 skipErrorMessage，直接抛出错误
    if (error.config && error.config.skipErrorMessage) {
      return Promise.reject(error)
    }

    let message = error.message
    let code = 0

    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      code = error.response.status
      // 尝试获取后端返回的具体错误信息 (msg 或 message)
      const data = error.response.data
      if (data && (data.msg || data.message)) {
        message = data.msg || data.message
      } else {
        // 根据状态码设置默认提示
        switch (code) {
          case 400: message = '请求错误 (400)'; break
          case 401: message = '未授权，请重新登录 (401)'; break
          case 403: message = '拒绝访问 (403)'; break
          case 404: message = '请求出错 (404)'; break
          case 408: message = '请求超时 (408)'; break
          case 500: message = '服务器错误 (500)'; break
          case 501: message = '服务未实现 (501)'; break
          case 502: message = '网络错误 (502)'; break
          case 503: message = '服务不可用 (503)'; break
          case 504: message = '网络超时 (504)'; break
          case 505: message = 'HTTP版本不受支持 (505)'; break
          default: message = `连接出错 (${code})`
        }
      }
    } else {
      // 请求未发出或没有收到响应
      if (message.includes('timeout')) {
        message = '请求超时，请检查网络连接'
      } else if (message.includes('Network Error')) {
        message = '无法连接到服务器，请检查后端服务是否启动'
      } else {
        message = '未知错误'
      }
    }

    // 使用 grouping: true 合并重复的错误提示
    ElMessage({
      message: message,
      type: 'error',
      duration: 5 * 1000,
      grouping: true
    })
    
    // 针对 401 错误，可能需要跳转登录页
    if (code === 401) {
      // 这里可以引入 store 或者 router 进行跳转，为了避免循环引用，简单处理
      localStorage.removeItem('token')
      // 如果不是在登录页，跳转登录页
      if (window.location.pathname !== '/login') {
         setTimeout(() => {
           window.location.href = '/login'
         }, 1500)
      }
    }

    // 更新 error 对象的信息，以便后续 catch 块能获取到正确的错误信息
    error.message = message
    error.isHandled = true
    return Promise.reject(error)
  }
)

export default service
