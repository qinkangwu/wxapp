import appInfo from '../../utils/util.js'
import Store from '../../servers/store.js'
import Trade from '../../servers/trade.js'

const appData = getApp().data;
const _width = appData._width;
const _height = appData._height;
const toast = appInfo.toast;

let easypayStoreId = '';
let deviceId = '';

Page({
  data: {
    _height: _height,
    showEasypay: false,
    onRequest: false,
    payOk: false,
    moneyToPay: '',
  },
  // 获取门店信息
  getStoreInfo() {
    if (!easypayStoreId) {
      toast('请返回首页扫码二维码');
      return;
    }
    Store.getStoreInfo(easypayStoreId, (storeInfo) => {
      this.setData({
        store: storeInfo
      });
      const curStoreConfig = storeInfo.storeConfig;
      if (!curStoreConfig || !curStoreConfig.open) {
        toast(curStoreConfig.closeReason);
        return;
      }
      this.setData({ showEasypay: true });
    });
  },
  setMoneyToPay(e) {
    const moneyToPay = e.detail.value;
    this.setData({ moneyToPay });
  },
  // 发起支付请求
  getPayInfo() {
    if (this.getPayInfo.onRequest) return;
    if (!easypayStoreId) {
      toast('请重新扫码');
      return;
    }
    const moneyToPay = this.data.moneyToPay;
    const moneyRegexp = /^([1-9][\d]{0,7}|0)(\.[\d]{1,2})?$/;
    if (moneyRegexp.test(moneyToPay) == false || parseFloat(moneyToPay) <= 0) {
      toast('请输入正确的支付金额');
      return;
    }
    const tradeInfo = {
      storeId: easypayStoreId,
      totalAmount: moneyToPay + '',
      deviceId: deviceId,
    };
    this.getPayInfo.onRequest = true;
    wx.showNavigationBarLoading();
    this.setData({ onRequest: true });
    Trade.getPayInfo(tradeInfo, this.requestPayment.bind(this), toast.bind(null));
    setTimeout(() => {
      this.getPayInfo.onRequest = false;
    }, 3000);
  },
  // 调用本地支付
  requestPayment(res) {
    const payInfo = res.result;
    wx.hideNavigationBarLoading();
    this.setData({ onRequest: false });
    wx.requestPayment({
      timeStamp: payInfo.timestamp,
      nonceStr: payInfo.nonceStr,
      package: payInfo.pkg,
      signType: payInfo.signType,
      paySign: payInfo.paySign,
      success: () => {
        toast('支付成功', 5000);
        this.setData({
          moneyToPay: '',
          payOk: true
        });
      }
    });
  },
  onLoad(options) {
    easypayStoreId = options.storeId || '';
    deviceId = options.deviceId || '';
  },
  onShow() {
    this.getStoreInfo();
  },
  onUnload() {
    easypayStoreId = '';
    deviceId = '';
  }
})
