import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../src/store/player'
import { useUserStore } from '../src/store/user'

// Mock request
vi.mock('@/utils/request', () => ({
  default: vi.fn()
}))

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('Player Store Deletion Logic', () => {
  let playerStore
  let userStore

  beforeEach(() => {
    setActivePinia(createPinia())
    playerStore = usePlayerStore()
    userStore = useUserStore()
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store = {}
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        removeItem: (key) => delete store[key],
        clear: () => store = {}
      }
    })()
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  })

  it('should remove music from playlist', () => {
    const music1 = { id: 1, title: 'Song 1' }
    const music2 = { id: 2, title: 'Song 2' }
    playerStore.playlist = [music1, music2]
    
    playerStore.removeMusic(1)
    
    expect(playerStore.playlist).toHaveLength(1)
    expect(playerStore.playlist[0].id).toBe(2)
  })

  it('should stop playing and clear state if current music is deleted', () => {
    const music1 = { id: 1, title: 'Song 1' }
    playerStore.playlist = [music1]
    playerStore.currentMusic = music1
    playerStore.isPlaying = true
    playerStore.audioUrl = 'blob:some-url'
    
    playerStore.removeMusic(1)
    
    expect(playerStore.playlist).toHaveLength(0)
    expect(playerStore.currentMusic).toBeNull()
    expect(playerStore.isPlaying).toBe(false)
    expect(playerStore.audioUrl).toBe('')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:some-url')
  })

  it('should not affect playback if deleted music is not current', () => {
    const music1 = { id: 1, title: 'Song 1' }
    const music2 = { id: 2, title: 'Song 2' }
    playerStore.playlist = [music1, music2]
    playerStore.currentMusic = music2
    playerStore.isPlaying = true
    
    playerStore.removeMusic(1)
    
    expect(playerStore.playlist).toHaveLength(1)
    expect(playerStore.playlist[0].id).toBe(2)
    expect(playerStore.currentMusic.id).toBe(2)
    expect(playerStore.isPlaying).toBe(true)
  })

  it('should handle batch removal', () => {
    const music1 = { id: 1, title: 'Song 1' }
    const music2 = { id: 2, title: 'Song 2' }
    const music3 = { id: 3, title: 'Song 3' }
    playerStore.playlist = [music1, music2, music3]
    
    playerStore.batchRemoveMusic([1, 3])
    
    expect(playerStore.playlist).toHaveLength(1)
    expect(playerStore.playlist[0].id).toBe(2)
  })

  it('should stop playback if current music is in batch removal', () => {
    const music1 = { id: 1, title: 'Song 1' }
    const music2 = { id: 2, title: 'Song 2' }
    playerStore.playlist = [music1, music2]
    playerStore.currentMusic = music1
    playerStore.isPlaying = true
    
    playerStore.batchRemoveMusic([1, 2])
    
    expect(playerStore.playlist).toHaveLength(0)
    expect(playerStore.currentMusic).toBeNull()
    expect(playerStore.isPlaying).toBe(false)
  })

  it('should update localStorage after removal', async () => {
    // Need to trigger watcher
    const music1 = { id: 1, title: 'Song 1' }
    playerStore.playlist = [music1]
    
    // Simulate async watcher (Vue watchers are usually synchronous for refs but let's check)
    // In Pinia/Vue 3, watchers are eager by default.
    
    // We need to set up userStore id to check storageKey
    userStore.id = '123'
    // Re-init watcher? No, watcher is set up on store creation.
    // But storageKey depends on userStore.id.
    
    playerStore.removeMusic(1)
    
    // Wait for watcher
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const key = 'player-state-123'
    const stored = JSON.parse(localStorage.getItem(key))
    expect(stored.playlist).toHaveLength(0)
  })
})
