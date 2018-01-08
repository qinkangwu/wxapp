import appInfo from '../utils/util.js';

const toast = appInfo.toast;
const apiPath = appInfo.apiPath;

const userServers = {};

const userInitActions = [];

const evalCallbacks = () => {
  userInitActions.map((callback) => {
    callback(appInfo.getInfo('babiUser'));
  });
  userInitActions.length = 0;
}

const createSession = () => {
  appInfo.post(apiPath.createSession, {}).then((res) => {
    if (res.status == 'OK') {
      createSession.timer = 0;
      appInfo.setInfo('session', res);
      loginWithCode();
      return;
    }
    createSession.timer = createSession.timer || 0;
    // 重试3次
    createSession.timer < 3 ? setTimeout(() => {
      createSession();
      createSession.timer = createSession.timer + 1;;
    }, createSession.timer * 1000) : (createSession.timer = 0, toast("服务器正忙，请稍后再试"));
  })
}

const loginWithCode = () => {
  wx.login({
    success: function (res) {
      res.code ? appInfo.post(apiPath.loginWithWechat, { code: res.code }).then((res) => {
        if (res.status == 'OK') {
          appInfo.setInfo('babiUser', res.result);
          evalCallbacks();
          return;
        }
        res.errorCode == 1 && createSession();
        res.errorCode == 2 && setTimeout(loginWithCode, 1000);
        ['1', '2'].indexOf(res.errorCode) == -1 && toast(res.message);
      }) : toast("获取登录信息失败！删除后再次加载可重新授权");
    },
    fail: toast.bind(null, "获取登录信息失败！删除后再次加载可重新授权")
  })
}

const getUserInfo = () => {
  appInfo.get(apiPath.getUserInfo).then(res => {
    if (res.status == 'OK') {
      appInfo.setInfo('babiUser', res.result);
      evalCallbacks();
      return;
    }
    res.errorCode == 1 && createSession();
    res.errorCode == 2 && loginWithCode();
    ['1', '2'].indexOf(res.errorCode) == -1 && toast(res.message);
  })
}

const getWechatUser = (callback) => {
  wx.getUserInfo({
    withCredentials: false,
    success: function (res) {
      appInfo.setInfo('wxUser', res.userInfo);
      callback && callback(res.userInfo);
    },
    fail: function (res) {
      wx.openSetting && wx.openSetting({
        success: (res) => {
          const authObj = res && res.authSetting;
          if (authObj && authObj['scope.userInfo']) return;
          appInfo.showSetting('', getWechatUser);
        },
        fail: appInfo.showSetting.bind(appInfo, '', getWechatUser)
      })
      !wx.openSetting && toast("获取登录信息失败！删除后再次加载可重新授权");
    }
  })
}

const getCoupons = (callback) => {
  const _store = appInfo.getInfo('store');
  const paramsObj = _store ? { storeId: _store.id } : {};
  appInfo.get(`${apiPath.getCoupons}&${appInfo.makeParams(paramsObj)}`).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? (toast(res.message), callback(null))  : userServers.serverInit(getCoupons.bind(null, callback));
  });
}

const getTradeCount = (callback) => {
  appInfo.get(apiPath.getTradeCount).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : userServers.serverInit(getTradeCount.bind(null, callback));
  });
}

// 服务器登录
userServers.serverInit = (callback) => {
  const session = appInfo.getInfo('session');
  if (typeof callback == 'function')
    userInitActions.push(callback)
  session ? getUserInfo() : createSession();
}

// 本地用户信息
userServers.localInit = (callback) => {
  !appInfo.getInfo('wxUser') && getWechatUser(callback);
}

userServers.getCoupons = getCoupons;

userServers.getTradeCount = getTradeCount;

export default userServers