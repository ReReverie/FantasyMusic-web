
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
