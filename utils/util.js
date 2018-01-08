import { getInfo, setInfo, clearInfo } from './base.js';
import paths from './apiPath.js';
import { get, post } from './http.js';
import { toast } from '../public/toast.js'
import { acc } from '../public/analytics.js'

const extendPath = () => {
  const reqHost = 'https://front.bestfood517.com';
  const sessionId = getInfo('session') && getInfo('session').result || '';
  const extroStr = [`sessionId=${sessionId}`, 'device=wxapp', 'version=1.0.0'].join('&');
  for (let key in paths) {
    paths[key] = extendPath.extroStr ? paths[key].replace(extendPath.extroStr, extroStr) : paths[key] + '?' + extroStr
    paths[key] = paths[key].indexOf(reqHost) == -1 ? reqHost + paths[key] : paths[key];
  }
  extendPath.extroStr = extroStr;
};

const _setInfo = (key, value) => {
  setInfo(key, value);
  key == 'session' && extendPath();
};

const showSetting = (msg, success) => {
  const alertMsg = msg || '只有获取基本信息后才能使用订餐哦 ^_^';
  wx.showModal({
    content: alertMsg,
    showCancel: false,
    success: success || appInfo.noop
  });
}

const makeParams = (paramsObj) => {
  let str = '';
  for (let key in paramsObj) {
    paramsObj.hasOwnProperty(key) && (str += `&${key}=${paramsObj[key]}`);
  }
  return str.substr(1) || ''
}

const formatTime = (_time) => {
  const time = _time !== undefined ? new Date(_time) : new Date;
  time.setMilliseconds(0);
  const Y = time.getFullYear();
  const M = time.getMonth() + 1;
  const MM = `0${time.getMonth() + 1}`.substr(-2);
  const D = time.getDate();
  const DD = `0${time.getDate()}`.substr(-2);
  const h = time.getHours();
  const hh = `0${time.getHours()}`.substr(-2);
  const m = time.getMinutes();
  const mm = `0${time.getMinutes()}`.substr(-2);
  const s = time.getSeconds();
  const ss = `0${time.getSeconds()}`.substr(-2);
  return {Y, M, MM, D, DD, h, hh, m, mm, s, ss};
};

const toUrl = (url) => {
  wx.navigateTo({
    url: url,
    fail: ({ errMsg }) => {
      wx.showModal({
        title: '跳转限制提示',
        content: '由于小程序跳转限制，您需要点左上角返回按钮或关闭微信后重新打开小程序访问目标页面',
        showCancel: false
      });
    },
  })
}

const noop = () => {};

const appInfo = {
  get: get,
  post: post,
  noop: noop,
  toast: toast,
  toUrl: toUrl,
  apiPath: paths,
  getInfo: getInfo,
  setInfo: _setInfo,
  clearInfo: clearInfo,
  makeParams: makeParams,
  formatTime: formatTime,
  showSetting: showSetting,
  acc: acc.bind(null, appInfo),
};

extendPath(); // 根据本地 session 初始化 apiPath 参数

export default appInfo
