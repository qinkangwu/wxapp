import appInfo from './utils/util.js'
import User from './servers/user.js'

let _width, _height, _inIos;

// 获取屏幕尺寸
wx.getSystemInfo({
  success: (res) => {
    _inIos = (/iphone/i).test(res.model);
    _width = res.screenWidth;
    _height = res.windowHeight;
  },
});

App({

  data: {
    _inIos,
    _width,
    _height
  },

  onLaunch(options) {
    setTimeout(() => {
      console.log('123')
      appInfo.acc('lanunch', options);
    }, 3600);
    // User.serverInit();
    User.localInit(User.serverInit.bind(User));
  },

  onShow(options) {
    // options: path, query, scene, shareTicket, referrerInfo, referrerInfo.appId, referrerInfo.extraData
  },

  onHide() {},

  // onError(e) {
  //   console.log(e);
  // }

})
