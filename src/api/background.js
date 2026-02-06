import request from '@/utils/request'

// 配置项
const config = {
  // 使用 Unsplash 的优质风景图片作为默认源
  // 也可以替换为具体的 API URL
  sourceType: 'list', // 'list' | 'api'
  apiEndpoint: 'https://api.unsplash.com/photos/random?query=landscape&orientation=landscape',
  rotateInterval: 30000, // 自动轮播间隔 (ms)
  
  // 预设的高清风景图片列表 (作为备用或默认源)
  imageList: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1434725039720-bb360dae7a72?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop'
  ]
}

/**
 * 获取背景图片 URL
 * @returns {Promise<string>} 图片 URL
 */
export function getBackgroundImage() {
  return new Promise((resolve, reject) => {
    try {
      if (config.sourceType === 'api') {
        // 如果有真实后端 API，在这里调用
        // request({ url: config.apiEndpoint, method: 'get' }).then(...)
        // 演示目的，暂时回落到 list
        resolve(getRandomFromList())
      } else {
        resolve(getRandomFromList())
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 从列表中随机获取一张图片
 */
function getRandomFromList() {
  const index = Math.floor(Math.random() * config.imageList.length)
  return config.imageList[index]
}

/**
 * 预加载图片
 * @param {string} url 
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve(url)
    img.onerror = (e) => reject(e)
  })
}

export const backgroundConfig = config
