
// 获取封面图片的 URL
export function getCoverUrl(music) {
  if (!music) return ''
  
  // 1. 如果是完整的 HTTP URL，直接使用
  if (music.coverUrl && (music.coverUrl.startsWith('http://') || music.coverUrl.startsWith('https://'))) {
    return music.coverUrl
  }
  
  // 2. 如果是相对路径 (以 / 开头)，通常是静态资源，加上 API 前缀或者直接使用
  // 这里假设后端没有做特殊的静态资源映射到根路径，而是通过 API 服务提供
  // 如果是 /api 开头，也直接用
  if (music.coverUrl && music.coverUrl.startsWith('/')) {
     return music.coverUrl
  }

  // 3. 其他情况（包括 Windows 绝对路径 D:\...，或者空路径），构造后端接口 URL
  // 假设后端提供 /music/cover/{id} 接口来返回图片流
  if (music.id && music.coverUrl) {
    // 只有当 coverUrl 确实存在时才请求后端接口
    // 如果 coverUrl 只是普通的字符串路径（非 http/https, 非 / 开头），我们认为它是本地路径，需要通过 id 获取
    return `/api/music/cover/${music.id}`
  }
  
  return ''
}

// 获取歌单封面
export function getPlaylistCover(playlist) {
  if (!playlist) {
    return 'https://picsum.photos/300/300?random=default'
  }

  // 1. 优先展示用户设置的封面图片（只要有 cover 字段且不为空）
  if (playlist.cover) {
    return playlist.cover
  }

  // 2. 如果未设置封面，但歌单内有歌曲（列表接口可能不返回 musics，这种情况下这一步会跳过）
  if (playlist.musics && playlist.musics.length > 0) {
    return getCoverUrl(playlist.musics[0]) || `https://picsum.photos/300/300?random=${playlist.id}`
  }

  // 3. 既没设置封面，也没获取到歌曲信息（或歌单确实为空），展示随机图片
  return `https://picsum.photos/300/300?random=${playlist.id}`
}

// 格式化日期时间 (YYYY-MM-DD)
export function formatDate(timeStr) {
  if (!timeStr) return ''
  // 简单处理：截取 T 之前的部分
  return timeStr.split('T')[0]
}
