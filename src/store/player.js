import { defineStore } from 'pinia'
import { ref } from 'vue'

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
  const playMusic = (music) => {
    currentMusic.value = music
    // 构造播放地址，假设后端接口 /api/music/play/{id}
    audioUrl.value = `/api/music/play/${music.id}`
    isPlaying.value = true
    
    // 如果不在播放列表中，添加到列表
    if (!playlist.value.find(item => item.id === music.id)) {
      playlist.value.push(music)
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
