import request from '@/utils/request'

// 获取歌单列表
export function getMusicLists(params) {
  return request({
    url: '/musiclist/list',
    method: 'get',
    params
  })
}

// 创建歌单
export function createMusicList(data) {
  return request({
    url: '/musiclist/create',
    method: 'post',
    data
  })
}

// 更新歌单
export function updateMusicList(data) {
  return request({
    url: '/musiclist/update',
    method: 'put',
    data
  })
}

// 获取歌单详情
export function getMusicListDetail(id) {
  return request({
    url: `/musiclist/${id}`,
    method: 'get'
  })
}

// 歌单详情内搜索
export function searchMusicInList(id, params) {
  return request({
    url: `/musiclist/${id}/search`,
    method: 'get',
    params
  })
}

// 添加音乐到歌单
export function addMusicToMusicList(data) {
  return request({
    url: '/musiclist/addMusic',
    method: 'post',
    data
  })
}

// 从歌单移除音乐
export function removeMusicFromMusicList(data) {
  return request({
    url: '/musiclist/removeMusic',
    method: 'delete',
    data
  })
}

// 删除歌单
export function deleteMusicList(id) {
  return request({
    url: `/musiclist/${id}`,
    method: 'delete'
  })
}
