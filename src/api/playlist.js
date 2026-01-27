import request from '@/utils/request'

// 获取歌单列表
export function getPlaylist(params) {
  return request({
    url: '/playlist/list',
    method: 'get',
    params
  })
}

// 创建歌单
export function createPlaylist(data) {
  return request({
    url: '/playlist/create',
    method: 'post',
    data
  })
}

// 获取歌单详情
export function getPlaylistDetail(id) {
  return request({
    url: `/playlist/${id}`,
    method: 'get'
  })
}

// 添加音乐到歌单
export function addMusicToPlaylist(data) {
  return request({
    url: '/playlist/addMusic',
    method: 'post',
    data
  })
}
