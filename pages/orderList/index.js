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

const setTradeInfo = (trade) => {
  const S = appInfo.formatTime(trade.createDate);
  let amountAll = 0;
  let images = [];
  trade._state = tradeStatus[trade.refundStatus] ||tradeStatus[trade.status];
  trade._date = `${S.Y}-${S.MM}-${S.DD} ${S.hh}:${S.mm}:${S.ss}`;
  trade.products.map((product, index) => {
    amountAll += product.amount;
    product.frontLogo && images.push(product.frontLogo);
  });
  trade._priceAll = trade.paidInAmount.toFixed(2);
  trade._amount = amountAll;
  trade._images = images;
  trade._showPay = ['INIT', 'PAY_INIT', 'UNPAID'].indexOf(trade.status) != -1;
  trade._showArrived = ('PAID' == trade.status) && (trade.refundStatus == 'REFUND_NONE');
}

const pullDataLimit = 10;
const unfinishType = 'INIT,PAY_INIT,UNPAID,PAID';
const finishedType = '' && 'ARRIVED,COMPLETED,FAIL,REFUND_APPLY,REFUND_APPROVED,REFUND_COMPLETED';

Page({
  data: {
    loading: false,
    dataEnd: false,
    filterType: unfinishType,
    _filterType: 'unfinish',
    tradeList: []
  },
  setFilterType(e) {
    let filterType
    let _filterType = e.currentTarget.dataset.filertype;
    _filterType == 'unfinish' && (filterType = unfinishType);
    _filterType == 'finished' && (filterType = finishedType);
    this.setData({ filterType, _filterType, skip: 0, tradeList: [], dataEnd: false });
    this.getTradeList();
  },
  getTradeList() {
    const status = this.data.filterType;
    const skip = this.data.tradeList.length;
    const dataEnd = this.data.dataEnd;
    if (dataEnd || this.getTradeList.onRequest) return;
    this.getTradeList.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.getTradeList({ status, skip, limit: pullDataLimit }, ({ result }) => {
      wx.hideNavigationBarLoading();
      this.getTradeList.onRequest = false;
      // 兼容切换tab后才返回之前tab条件的内容
      if (status != this.data.filterType) {
        this.getTradeList();
        return;
      }
      result.map((trade) => setTradeInfo(trade));
      let tradeList = this.data.tradeList;
      this.setData({ tradeList: tradeList.concat(result), dataEnd: result.length < pullDataLimit });
    });
  },
  toTradeDetail(e) {
    const tradeId = e.currentTarget.dataset.tradeid;
    tradeId && appInfo.toUrl(`/pages/orderDetail/index?tradeId=${tradeId}`);
  },
  cancelTrade(e) {
    const tradeId = e.currentTarget.dataset.tradeid;
    if (this.cancelTrade.onRequest) return;
    this.cancelTrade.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.setTradeFail(tradeId, (res) => {
      wx.hideNavigationBarLoading();
      this.cancelTrade.onRequest = false;
      const tradeList = this.data.tradeList;
      tradeList.map((trade, index) => {
        if (trade.id != tradeId) return;
        // trade.status = 'FAIL';
        // setTradeInfo(trade);
        toast('取消订单成功');
        tradeList.splice(index, 1);
      });
      this.setData({ tradeList: tradeList });
    });
  },
  setArrived(e) {
    const tradeId = e.currentTarget.dataset.tradeid;
    if (this.setArrived.onRequest) return;
    this.setArrived.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.setTradeArrived(tradeId, () => {
      wx.hideNavigationBarLoading();
      this.setArrived.onRequest = false;
      const tradeList = this.data.tradeList;
      tradeList.map((trade, index) => {
        if (trade.id != tradeId) return;
        tradeList.splice(index, 1);
        toast('已通知门店');
      });
      this.setData({ tradeList: tradeList });
    });
  },
  payTrade(e) {
    const tradeId = e.currentTarget.dataset.tradeid;
    if (this.payTrade.onRequest) return;
    this.payTrade.onRequest = true;
    wx.showNavigationBarLoading();
    Trade.getPayInfo({
      tradeId: tradeId
    }, ({ result }) => {
      wx.hideNavigationBarLoading();
      this.payTrade.onRequest = false;
      this.requestPayment(result, () => {
        const tradeList = this.data.tradeList;
        tradeList.map(trade => {
          if (trade.id != tradeId) return;
          trade.status = 'PAID';
          setTradeInfo(trade);
        });
        this.setData({ tradeList: tradeList });
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
  onLoad(options) {
    wx.hideShareMenu({});
  },
  onShow() {
    this.getTradeList();
  },
  onHide() {
    this.setData({ dataEnd: false, tradeList: [] });
  }
})