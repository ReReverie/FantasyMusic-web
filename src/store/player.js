import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import request from '@/utils/request'

export const usePlayerStore = defineStore('player', () => {
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

  // --- Actions ---

  // 初始化：从 localStorage 恢复状态
  const initFromStorage = () => {
    try {
      const stored = localStorage.getItem('player-state')
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

  // 持久化监听
  watch([currentMusic, playlist, playMode, volume], () => {
    const stateToSave = {
      currentMusic: currentMusic.value,
      playlist: playlist.value,
      playMode: playMode.value,
      volume: volume.value
    }
    localStorage.setItem('player-state', JSON.stringify(stateToSave))
  }, { deep: true })

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
      const response = await request({
        url: `/music/play/${music.id}`,
        method: 'get',
        responseType: 'blob'
      })
      
      // 如果当前歌曲已经改变（用户切换了其他歌曲），则丢弃本次结果
      if (currentMusic.value?.id !== music.id) {
          return
      }

      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
      }

      const blob = new Blob([response.data], { type: 'audio/mpeg' })
      audioUrl.value = URL.createObjectURL(blob)
      isPlaying.value = true
    } catch (error) {
      console.error('Failed to load music:', error)
      isPlaying.value = false
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
    isPlaying.value = !isPlaying.value
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
      // 注意：sequence 模式下，如果是最后一首，可能返回 -1 或 0，取决于具体实现。
      // 这里为了简单，sequence 模式点击下一首也回到开头，或者由调用者判断。
      // 通常 manual next 应该循环。只有 auto next 在 sequence 模式下才停止。
      // 让我们统一逻辑：Manual Next 总是循环。Auto Next 区分。
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
        // 调用 playMusic 会检测 id 相同，重置 isPlaying=true，但可能不会 seek 0
        // 对于单曲循环，组件端的 ended 事件处理可能更好，直接 currentTime=0
        // 但如果这里被调用，说明需要切歌。
        // 简单处理：单曲循环时，PlayNext 仍切到下一首（用户手动点击），
        // 只有 Auto 触发时才需要特殊处理。
        // 但通常 Store 的 PlayNext 是用户行为。
        // 这里的参数 isAuto 用于区分。
        // 如果是 isAuto && single，我们应该什么都不做（由组件 loop）或者重新加载。
        // 实际上，单曲循环通常由 <audio loop> 属性处理，或者 ended 事件 seek 0。
        // 如果调用到了这里，假设是切换到"下一首"的逻辑。
        return // 单曲循环自动播放由组件控制 loop 属性或 seek
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
    playPrev
  }
})
