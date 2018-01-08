// get 请求，默认 json 解析，制定 text 返回 字符串，其他格式返回 原始数据
export function get(url, dataType = 'json') {
  const _res = new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: 'GET',
      dataType: dataType,
      success: (res) => {
        resolve(res.data)
      },
      fail: (res) => {
        // reject(res);
        resolve({ message: '服务器正忙，请稍后再试', errorCode: '-1' });
      }
    })
  });
  return _res;
}

// post 请求，默认使用 form 提交，默认使用 json 解析
export function post(url, data, dataType = 'json') {
  data = data || {};
  const _res = new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: data,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      dataType: dataType,
      success: (res) => {
        resolve(res.data)
      },
      fail: (res) => {
        // reject(res);
        resolve({ message: '服务器正忙，请稍后再试', errorCode: '-1' });
      }
    })
  });
  return _res;
}
