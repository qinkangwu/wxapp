import appInfo from '../../utils/util.js'
import User from '../../servers/user.js'
import Trade from '../../servers/trade.js'

const appData = getApp().data;
const _inIos = appData._inIos;
const _width = appData._width;
const _height = appData._height;
const toast = appInfo.toast;

const tradeStatus = {
  INIT: '待支付',
  PAY_INIT: '待支付',
  UNPAID: '待支付',
  PAID: '待取餐',
  ARRIVED: '待取餐',
  COMPLETED: '已完成',
  FAIL: '已取消',
  REFUND_APPLY: '退款申请',
  REFUND_APPROVED: '退款通过',
  REFUND_COMPLETED: '退款成功'
};

Page({
  data: {
    loading: true,
    phone: '4006758517',
  },
  getTradeDetail(tradeId, state) {
    state && Trade.checkTradePaid(tradeId, this.getTradeDetail.bind(this, tradeId, null));
    !state && Trade.getTradeDetail(tradeId, this.setTradeDetail.bind(this));
  },
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone
    });
  },
  setTradeDetail({ result }) {
    const S = appInfo.formatTime(result.createDate);
    result.createDateStr = `${S.Y}/${S.M}/${S.D} ${S.hh}:${S.mm}:${S.ss}`;

    let cartPriceAll = 0;
    const paidInAmount = result.paidInAmount;
    const tradeId = result.id;
    const createTime = result.createDateStr;
    const payType = result.paymentChannel.indexOf('ZHIFUBAO') != -1 ? '支付宝' : '微信';
    const remark = result.remark || '';
    const products = result.products;
    const store = result.store;
    const off = result.off;
    const coupon = result.coupon;
    const takeNo = result.takeNo;
    const statusStr = tradeStatus[result.refundStatus] || tradeStatus[result.status];
    const showPay = ['INIT', 'PAY_INIT', 'UNPAID'].indexOf(result.status) != -1;
    const showTakeNo = ['PAID', 'ARRIVED', 'COMPLETED'].indexOf(result.status) != -1;
    const showArrived = ('PAID' == result.status) && (result.refundStatus == 'REFUND_NONE');
    products.map((product, index) => {
      cartPriceAll += product.amount * product.price;
    });
    let savedPrice = (cartPriceAll - paidInAmount).toFixed(2);
    this.setData({
      store,
      products,
      paidInAmount,
      savedPrice,
      tradeId,
      createTime,
      payType,
      remark,
      off,
      coupon,
      takeNo,
      statusStr,
      showPay,
      showTakeNo,
      showArrived,
      loading: false
    });
  },
  toIndex() {
    appInfo.toUrl('/pages/index/index');
  },
  cancelTrade() {
    const tradeId = this.data.tradeId;
    if (this.cancelTrade.onRequest) return;
    this.cancelTrade.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.setTradeFail(tradeId, (res) => {
      wx.hideNavigationBarLoading();
      this.cancelTrade.onRequest = false;
      const statusStr = tradeStatus['FAIL'];
      const showPay = false;
      const showArrived = false;
      this.getTradeDetail(tradeId);
      this.setData({ statusStr, showPay, showArrived });
      toast('取消订单成功');
    });
  },
  setArrived() {
    const tradeId = this.data.tradeId;
    if (this.setArrived.onRequest) return;
    this.setArrived.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.setTradeArrived(tradeId, () => {
      wx.hideNavigationBarLoading();
      this.setArrived.onRequest = false;
      const statusStr = tradeStatus['ARRIVED'];
      const showPay = false;
      const showArrived = false;
      this.getTradeDetail(tradeId);
      this.setData({ statusStr, showPay, showArrived });
      toast('已通知门店');
    });
  },
  payTrade() {
    const tradeId = this.data.tradeId;
    if (this.payTrade.onRequest) return;
    this.payTrade.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.getPayInfo({
      tradeId: tradeId
    }, ({ result }) => {
      wx.hideNavigationBarLoading();
      this.payTrade.onRequest = false;
      this.requestPayment(result, () => {
        const statusStr = tradeStatus['PAID'];
        const showPay = false;
        const showArrived = false;
        this.getTradeDetail(tradeId);
        this.setData({ statusStr, showPay, showArrived });
      });
    });
  },
  requestPayment(payInfo, payOkCallback) {
    let tradeDetailUri = `/pages/orderDetail/index?tradeId=${payInfo.tradeId}`;
    wx.requestPayment({
      timeStamp: payInfo.timestamp,
      nonceStr: payInfo.nonceStr,
      package: payInfo.pkg,
      signType: payInfo.signType,
      paySign: payInfo.paySign,
      success: payOkCallback,
    });
  },
  toStore(e) {
    const store = e.currentTarget.dataset.store;
    const storeId = store && store.id;
    storeId && appInfo.toUrl(`/pages/index/index?storeId=${storeId}`);
  },
  onLoad(options) {
    options.tradeId = options.tradeId || '2017091118021406628997130';
    this.getTradeDetail(options.tradeId, options.state);
    wx.hideShareMenu({ });
  },
  onShow() {}
})
