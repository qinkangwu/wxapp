const apiPath = {
  getUserInfo: '/api-front/session/get-user-info', // get
  createSession: '/api-front/session/create', // post
  loginWithWechat: '/api-front/session/wechat/login-with-mini-code', // post
  getStoresNearBy: '/api-front/store/list-nearby', // get
  getStoresByKey: '/api-front/store/list', // get
  getStoreInfo: '/api-front/store/get', // get
  getGoodsList: '/api-front/category/list', // get
  getSpecInfo: '/api-front/store/product/spec/get', // get
  getCoupons: '/api-front/coupon/list', // get
  addTrade: '/api-front/trade/add', // post
  updateTrade: '/api-front/trade/update', // post
  updatePayChannel: '/api-front/payment/update-channel', // post
  getTradeCount: '/api-front/trade/count', // get
  getTradeDetail: '/api-front/trade/get', // get
  checkIfPaid: '/api-front/trade/check-if-paid', // post
  setTradeArrived: '/api-front/trade/update-to-arrived', // post
  setTradeFail: '/api-front/trade/update-to-fail', // post
  getTradeList: '/api-front/trade/list', // get
  getOffList: '/api-front/off/source/list-by-store', // get
}

export default apiPath;
