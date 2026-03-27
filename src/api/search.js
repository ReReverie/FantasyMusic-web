import request from '@/utils/request'

// 搜索音乐
export function searchMusic(params) {
  return request({
    url: '/search',
    method: 'get',
    params
  })
}

// 搜索建议
export function suggestMusic(queryPrefix) {
  return request({
    url: '/search/suggest',
    method: 'get',
    params: { queryPrefix }
  })
}
