/* * *
 * 全局共享变量: appData
 * setInfo: 默认记录在内存中，第三个参数为真时存储到 localStorage
* * */

const appData = {};

try {
  // init cached data from localStorage
  var res = wx.getStorageInfoSync()
  res.keys.map((key, index) => {
    appData[key] = wx.getStorageSync(key)
  })
} catch (e) {}

export function setInfo(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {}
  appData[key] = value;
  return appData[key];
}

export function getInfo(key) {
  return appData[key];
}

export function clearInfo(key) {
  try {
    key ? wx.removeStorageSync(key) : wx.clearStorage()
  } catch (e) {}
}
