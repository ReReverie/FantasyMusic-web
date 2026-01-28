import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const usePlayerStore = defineStore('player', () => {
  // 当前播放的音乐信息
  const currentMusic = ref(null)
  // 播放列表
  const playlist = ref([])
  // 播放状态
  const isPlaying = ref(false)
  // 音频源 URL
  const audioUrl = ref('')

  // 播放音乐
  const playMusic = async (music) => {
    // 如果是同一首歌曲，只切换播放状态
    if (currentMusic.value && currentMusic.value.id === music.id && audioUrl.value) {
      isPlaying.value = true
      return
    }

    currentMusic.value = music
    isPlaying.value = false // 先暂停，等待加载
    
    // 使用 axios 请求音频文件流，这样可以带上 header
    try {
      const response = await request({
        url: `/music/play/${music.id}`,
        method: 'get',
        responseType: 'blob' // 重要：指定响应类型为 blob
      })
      
      // 释放旧的 URL 对象
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
      }

      // 创建新的 Blob URL
      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      audioUrl.value = URL.createObjectURL(blob)
      isPlaying.value = true

      // 如果不在播放列表中，添加到列表
      if (!playlist.value.find(item => item.id === music.id)) {
        playlist.value.push(music)
      }
    } catch (error) {
      console.error('Failed to load music:', error)
      isPlaying.value = false
    }
  }

  // 暂停/播放切换
  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
  }

  return {
    currentMusic,
    playlist,
    isPlaying,
    audioUrl,
    playMusic,
    togglePlay
  }
})
