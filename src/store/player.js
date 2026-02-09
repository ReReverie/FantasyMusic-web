import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/store/user'

export const usePlayerStore = defineStore('player', () => {
  const userStore = useUserStore()
  
  // --- State ---
  const currentMusic = ref(null)
  const playlist = ref([])
  const isPlaying = ref(false)
  const audioUrl = ref('')
  
  // 播放模式: 'sequence'(顺序播放), 'loop'(列表循环), 'single'(单曲循环), 'random'(随机播放)
  const playMode = ref('sequence') 
  // 音量 (0-100)
  const volume = ref(50)
  // 是否显示播放列表
  const showPlaylist = ref(false)

  // --- Computed ---
  // 计算当前的 Storage Key，基于 User ID
  const storageKey = computed(() => {
      // 如果未登录，使用 default；如果登录，使用 player-state-USERID
      return userStore.id ? `player-state-${userStore.id}` : 'player-state-guest'
  })

  // --- Actions ---

  // 初始化：从 localStorage 恢复状态
  const initFromStorage = () => {
    try {
      const key = storageKey.value
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        // 恢复播放模式
        if (data.playMode) playMode.value = data.playMode
        // 恢复音量
        if (data.volume !== undefined) volume.value = data.volume
        // 恢复播放列表
        if (data.playlist) playlist.value = data.playlist
        // 恢复当前歌曲 (但不自动播放)
        if (data.currentMusic) {
          currentMusic.value = data.currentMusic
          // 注意：audioUrl 需要重新请求获取，所以这里不恢复 isPlaying
        }
      }
    } catch (e) {
      console.error('Failed to restore player state:', e)
    }
  }

  // 播放指定音乐
  const playMusic = async (music) => {
    if (currentMusic.value && currentMusic.value.id === music.id && audioUrl.value) {
      isPlaying.value = true
      return
    }

    // 暂停当前播放
    isPlaying.value = false
    currentMusic.value = music

    // 如果不在播放列表中，添加到列表
    const index = playlist.value.findIndex(item => item.id === music.id)
    if (index === -1) {
      playlist.value.push(music)
    }

    try {
      // 尝试获取播放链接 (支持后端返回 OSS 预签名 URL)
      const response = await request({
        url: `/music/play/${music.id}`,
        method: 'get',
        // 移除 responseType: 'blob'，让 axios 自动处理 JSON 或 Text
      })
      
      // 如果当前歌曲已经改变（用户切换了其他歌曲），则丢弃本次结果
      if (currentMusic.value?.id !== music.id) {
          return
      }

      let playUrl = ''
      
      // 1. 如果后端直接返回 URL 字符串 (例如 OSS 签名链接)
      if (typeof response === 'string' && (response.startsWith('http') || response.startsWith('/'))) {
        playUrl = response
      } 
      // 2. 如果后端返回 JSON 对象包含 url 字段
      else if (response && typeof response === 'object' && response.url) {
        playUrl = response.url
      }
      
      // 强制升级 HTTP 为 HTTPS (解决 Mixed Content 问题)
      if (playUrl && playUrl.startsWith('http://')) {
        playUrl = playUrl.replace('http://', 'https://')
      }
      
      if (playUrl) {
        // 释放旧的 Blob URL
        if (audioUrl.value && audioUrl.value.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl.value)
        }
        audioUrl.value = playUrl
        isPlaying.value = true
      } else {
        throw new Error('Invalid playback URL')
      }

    } catch (error) {
      console.error('Failed to load music:', error)
      isPlaying.value = false
      // 可以在这里添加更友好的错误提示
    }
  }

  // 设置播放列表并播放其中一首（可选）
  const setPlaylist = (list, playIndex = 0) => {
    playlist.value = [...list] // 浅拷贝，避免引用问题
    if (list.length > 0 && playIndex >= 0 && playIndex < list.length) {
      playMusic(list[playIndex])
    }
  }

  // 暂停/播放切换
  const togglePlay = () => {
    if (!currentMusic.value && playlist.value.length > 0) {
        playMusic(playlist.value[0])
        return
    }

    if (currentMusic.value) {
      if (isPlaying.value) {
        isPlaying.value = false
      } else {
        // 如果没有 audioUrl (例如刷新页面后)，重新获取链接
        if (!audioUrl.value) {
          playMusic(currentMusic.value)
        } else {
          isPlaying.value = true
        }
      }
    }
  }

  // 切换播放模式
  const togglePlayMode = () => {
    const modes = ['sequence', 'loop', 'single', 'random']
    const currentIndex = modes.indexOf(playMode.value)
    playMode.value = modes[(currentIndex + 1) % modes.length]
  }

  // 获取下一首歌曲的索引
  const getNextIndex = () => {
    if (playlist.value.length === 0) return -1
    if (playlist.value.length === 1) return 0

    const currentIndex = playlist.value.findIndex(item => item.id === currentMusic.value?.id)
    
    if (playMode.value === 'random') {
      // 随机模式：随机选一个非当前的
      let nextIndex = currentIndex
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * playlist.value.length)
      }
      return nextIndex
    } else {
      // 顺序或循环模式，都是找下一个
      return (currentIndex + 1) % playlist.value.length
    }
  }

  // 获取上一首歌曲的索引
  const getPrevIndex = () => {
    if (playlist.value.length === 0) return -1
    if (playlist.value.length === 1) return 0

    const currentIndex = playlist.value.findIndex(item => item.id === currentMusic.value?.id)
    
    if (playMode.value === 'random') {
        let prevIndex = currentIndex
        while (prevIndex === currentIndex) {
            prevIndex = Math.floor(Math.random() * playlist.value.length)
        }
        return prevIndex
    }

    return (currentIndex - 1 + playlist.value.length) % playlist.value.length
  }

  // 下一首
  const playNext = (isAuto = false) => {
    if (playlist.value.length === 0) return

    // 如果是自动切换且是单曲循环，则重新播放当前
    if (isAuto && playMode.value === 'single') {
        return 
    }
    
    // 如果是 sequence 模式且自动播放且是最后一首，则停止
    if (isAuto && playMode.value === 'sequence') {
        const currentIndex = playlist.value.findIndex(item => item.id === currentMusic.value?.id)
        if (currentIndex === playlist.value.length - 1) {
            isPlaying.value = false
            return
        }
    }

    const index = getNextIndex()
    if (index !== -1) {
      playMusic(playlist.value[index])
    }
  }

  // 上一首
  const playPrev = () => {
    if (playlist.value.length === 0) return
    const index = getPrevIndex()
    if (index !== -1) {
      playMusic(playlist.value[index])
    }
  }

  // 清空/重置状态
  const resetState = () => {
    currentMusic.value = null
    playlist.value = []
    isPlaying.value = false
    if (audioUrl.value) {
      URL.revokeObjectURL(audioUrl.value)
      audioUrl.value = ''
    }
    // 重置为默认偏好，确保数据隔离
    volume.value = 50
    playMode.value = 'sequence'
    showPlaylist.value = false
  }

  // 移除指定音乐 (用于删除音乐时同步更新播放器状态)
  const removeMusic = (musicId) => {
    // 1. 从播放列表中移除
    const index = playlist.value.findIndex(item => item.id === musicId)
    if (index !== -1) {
      playlist.value.splice(index, 1)
    }

    // 2. 如果当前播放的是被删除的音乐，停止播放并清空状态
    if (currentMusic.value && currentMusic.value.id === musicId) {
      isPlaying.value = false
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
        audioUrl.value = ''
      }
      currentMusic.value = null
    }
  }

  // 批量移除音乐
  const batchRemoveMusic = (musicIds) => {
    if (!musicIds || musicIds.length === 0) return

    // 1. 从播放列表中移除
    playlist.value = playlist.value.filter(item => !musicIds.includes(item.id))

    // 2. 如果当前播放的音乐在删除列表中，停止播放
    if (currentMusic.value && musicIds.includes(currentMusic.value.id)) {
      isPlaying.value = false
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
        audioUrl.value = ''
      }
      currentMusic.value = null
    }
  }

  // --- Watchers ---

  // 持久化监听
  watch([currentMusic, playlist, playMode, volume], () => {
    const stateToSave = {
      currentMusic: currentMusic.value,
      playlist: playlist.value,
      playMode: playMode.value,
      volume: volume.value
    }
    localStorage.setItem(storageKey.value, JSON.stringify(stateToSave))
  }, { deep: true })
  
  // 监听 User ID 变化 (登录/登出)
  // 当用户 ID 变化时，重新加载对应的 Storage
  watch(() => userStore.id, (newId, oldId) => {
      if (newId !== oldId) {
          // 调用重置方法清理内存状态
          resetState()
          
          // 加载新用户的配置
          initFromStorage()
      }
  })

  return {
    currentMusic,
    playlist,
    isPlaying,
    audioUrl,
    playMode,
    volume,
    showPlaylist,
    initFromStorage,
    playMusic,
    setPlaylist,
    togglePlay,
    togglePlayMode,
    playNext,
    playPrev,
    resetState,
    removeMusic,
    batchRemoveMusic
  }
})
