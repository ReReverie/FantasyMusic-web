import request from '@/utils/request'

// 获取音乐列表
export function getMusicList(params) {
  return request({
    url: '/music/list',
    method: 'get',
    params
  })
}

// 上传音乐
export function uploadMusic(data) {
  return request({
    url: '/music/upload',
    method: 'post',
    data
    // headers: { 'Content-Type': 'multipart/form-data' } // Let axios set it automatically with boundary
  })
}

// 获取音乐详情
export function getMusicDetail(id) {
  return request({
    url: `/music/${id}`,
    method: 'get'
  })
}

// 音乐分类列表
export function getCategoryList() {
  return request({
    url: '/music/category/list',
    method: 'get'
  })
}
