import request from '@/utils/request'
import { getMusicLists, getMusicListDetail } from './musiclist'
import { getMusicList } from './music'

/**
 * 获取首页聚合数据
 * @returns {Promise<Object>} 包含歌单、音乐列表和统计数据的对象
 */
export function getHomeData() {
  // 理想情况下，后端应该提供一个 /home/data 接口一次性返回所有数据
  // 这里我们在前端进行聚合，模拟后端 API 的行为
  // 这样当后端真正实现了聚合接口时，只需要修改这里的实现即可，UI 层无需变动
  
  /* 
  // 真正的后端接口调用方式（待实现）：
  return request({
    url: '/home/data',
    method: 'get'
  })
  */

  // 前端模拟聚合：
  return Promise.all([
    getMusicLists(), // 获取歌单列表
    getMusicList()   // 获取音乐列表
  ]).then(async ([playlists, musicList]) => {
    // 处理空数据情况
    const validPlaylists = Array.isArray(playlists) ? playlists : []
    const validMusicList = Array.isArray(musicList) ? musicList : []

    // 确保按 ID 倒序排列（ID 越大表示上传越晚/越新）
    // 即使后端没有正确排序，前端这里强制重排也能保证展示的是最新的音乐
    validMusicList.sort((a, b) => b.id - a.id)

    // 获取所有歌单的详细信息，以便计算收藏歌曲总数和正确显示封面
    const detailedPlaylists = await Promise.all(
      validPlaylists.map(async (playlist) => {
        try {
          // 获取详情以拿到 musics 列表
          const detail = await getMusicListDetail(playlist.id)
          return {
            ...playlist,
            musics: detail.musics || [],
            trackCount: detail.musics ? detail.musics.length : 0,
            // 如果详情里有 cover 且不为空，优先用详情的（虽然通常是一样的）
            cover: detail.cover || playlist.cover
          }
        } catch (error) {
          console.warn(`Failed to fetch detail for playlist ${playlist.id}`, error)
          return {
            ...playlist,
            musics: [],
            trackCount: 0
          }
        }
      })
    )

    // 计算所有歌单内音乐的总数量（去重）
    const allMusicIds = new Set()
    detailedPlaylists.forEach(playlist => {
      if (playlist.musics) {
        playlist.musics.forEach(music => {
          if (music.id) {
            allMusicIds.add(music.id)
          }
        })
      }
    })
    const collectedMusicCount = allMusicIds.size

    return {
      // 统计数据
      playlistCount: validPlaylists.length,
      musicCount: validMusicList.length,
      collectedMusicCount: collectedMusicCount,
      
      // 推荐歌单（取前8个，已补充详情）
      recommendPlaylists: detailedPlaylists.slice(0, 8),
      
      // 最新音乐（取前10首）
      latestMusic: validMusicList.slice(0, 10),
      
      // 轮播图数据（目前是写死的，未来可以从后端获取）
      banners: [
        { title: '尽情享受音乐', url: 'https://picsum.photos/800/300?random=1' },
        { title: '发现新世界', url: 'https://picsum.photos/800/300?random=2' },
        { title: '我的私人歌单', url: 'https://picsum.photos/800/300?random=3' }
      ]
    }
  })
}
