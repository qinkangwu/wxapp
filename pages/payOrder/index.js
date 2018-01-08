import appInfo from '../../utils/util.js'
import User from '../../servers/user.js'
import Store from '../../servers/store.js'
import Trade from '../../servers/trade.js'

const appData = getApp().data;
const _inIos = appData._inIos;
const _width = appData._width;
const _height = appData._height;
const toast = appInfo.toast;

const payBarHeight = 48;
const pickerBoxHeight = 280;

const weekChinese = ['天', '一', '二', '三', '四', '五', '六'];
const defaultTimeArr = [];
let _minHour = 5.5;
let _maxHour = 20;
let _stepHour = 0.5;
let takeTimeStamp = 0; // 取餐时间
while (_minHour < _maxHour) {
  defaultTimeArr.push(_minHour);
  _minHour += _stepHour;
}

let paymentCompleteSign = false; // 支付成功后会在当前页重新启动app，导致两次跳转

Page({
  data: {
    loading: false,
    _inIos: _inIos,
    _width: _width,
    _height: _height,
    showAllGoods: false,
    showPickerTime: false,
    showAddComments: false,
    showPickerCoupon: false,
    loadingCoupongs: !appInfo.coupons, // loading 遮罩页面，为防止阻碍支付，loadingCoupongs 实现局部 loading
    loadingOff: true,
    payBarHeight: payBarHeight,
    pickerBoxHeight: pickerBoxHeight,
    promotions: [],
    pickDayArr: [],
    pickTimeArr: [],
  },
  // 获取优惠券，准备数据
  prepareInfo() {
    takeTimeStamp = 0;
    this.tidyGoodsInfo();
    const store = appInfo.getInfo('store');
    appInfo.coupons = [];
    User.getCoupons((res) => {
      appInfo.coupons = res && res.result;
      this.tidyGoodsInfo();
      this.setData({ loadingCoupongs: false });
    });
    Store.getOff(store.id, (result) => {
      this.tidyGoodsInfo();
      appInfo.offs = result || [];
    });
    this.makePickData();
  },
  // 切换取餐时间：日期
  makePickData(e) {
    let dayIndex = e && e.currentTarget.dataset.index;
    const dateToday = new Date;
    const pickDayArr = [];
    let pickTimeArr = [];
    pickDayArr.push(`今天(周${weekChinese[new Date(+dateToday + 0 * 24 * 3600 * 1000).getDay()]})`);
    pickDayArr.push(`明天(周${weekChinese[new Date(+dateToday + 1 * 24 * 3600 * 1000).getDay()]})`);
    pickDayArr.push(`后天(周${weekChinese[new Date(+dateToday + 2 * 24 * 3600 * 1000).getDay()]})`);
    let nowTimeHH = dateToday.getHours();
    nowTimeHH += dateToday.getMinutes() > 30 ? 0.5 : 0;
    // 今天
    if (!dayIndex) {
      pickTimeArr.push(-1);
      nowTimeHH = nowTimeHH > 5 ? nowTimeHH : 5.5;
      while (nowTimeHH < _maxHour) {
        pickTimeArr.push(nowTimeHH);
        nowTimeHH += _stepHour;
      }
    }
    // 今天夜间，默认选择明天取餐
    dayIndex = dayIndex === undefined && pickTimeArr.length == 1 ? 1 : (dayIndex || 0);
    // 明后天
    dayIndex && (pickTimeArr = defaultTimeArr);
    this.setData({ showPickerTime: true, pickDayArr, pickTimeArr, dayIndex});
  },
  // 切换取餐时间：时段
  makePickTime(e) {
    const timeNum = e && e.currentTarget.dataset.value;
    const dayIndex = this.data.dayIndex;
    let takeTime = ['今天', '明天', '后天'][dayIndex] + `  ${timeNum % 1 == 0.5 ? (timeNum - 0.5) + ':30 ~ ' + (timeNum + 0.5) + ':00' : timeNum + ':00 ~ ' + timeNum + ':30'}`
    let time = new Date;
    if (timeNum != -1) {
      time.setHours(0);
      time.setMinutes(0);
      time.setSeconds(0);
      time.setMilliseconds(0);
      time = new Date(+time + dayIndex * 24 * 3600 * 1000 + timeNum * 3600 * 1000);
    } else {
      takeTime = '立即取餐';
    }
    takeTimeStamp = time;
    this.setData({
      takeTime,
      showPickerTime: false
    });
  },
  // 整理购物车数据
  tidyGoodsInfo(e) {
    const _pickedCoupn = e && e.currentTarget.dataset.coupon;
    let specAount = 0;
    let cartAmountAll = 0;
    let cartPriceAll = 0;
    let savedPrice = 0;
    const cart = appInfo.cart;
    const coupons = appInfo.coupons || [];
    const offs = appInfo.offs || [];
    const cartArr = [];
    for(let key in cart) {
      if (!cart.hasOwnProperty(key)) continue;
      let specGoods = cart[key];
      specAount += 1;
      cartAmountAll += specGoods['amount'];
      cartPriceAll += specGoods['amount'] * specGoods['price'];
      cartArr.push(specGoods);
    }
    // 过滤不可用优惠券
    let pickedCoupn = _pickedCoupn;
    if (_pickedCoupn && ((_pickedCoupn.trigger || _pickedCoupn.source.trigger) > cartPriceAll) || _pickedCoupn && (_pickedCoupn.useable === false)) {
      pickedCoupn = this.data.pickedCoupn || null;
    }
    // 替用户选择默认的优惠券
    pickedCoupn === undefined && coupons.map((coupon, index) => {
      const S = appInfo.formatTime(coupon.startDate);
      const E = appInfo.formatTime(coupon.expireDate);
      coupon.startDateStr = `${S.Y}/${S.M}/${S.D} ${S.hh}:${S.mm}:${S.ss}`;
      coupon.expireDateStr = `${S.Y}/${E.M}/${E.D} ${E.hh}:${E.mm}:${S.ss}`;
      let userable = (coupon.trigger || coupon.source.trigger) <= cartPriceAll && (coupon.startDate <= +new Date && coupon.expireDate > +new Date) && !coupon.used;
      coupon.useable = userable;
      if (userable) {
        pickedCoupn = pickedCoupn && pickedCoupn.subtract >= coupon.subtract ? pickedCoupn : coupon;
      }
    });
    let offCut = 0, pickedOff = null;
    offs.map((off, index) => {
      const userable = (off.trigger || off.source.trigger) <= (cartPriceAll - (pickedCoupn ? pickedCoupn.subtract : 0));
      if (!userable) return;
      off.subtract = off.subtract || (off.source && off.source.subtract);
      if (off.subtract > offCut) {
        offCut = off.subtract;
        pickedOff = off;
      }
    });
    // 按优惠金额排序
    coupons.sort((a, b) => {
      return a.subtract > b.subtract ? -1 : 1;
    });
    // 计算实付金额
    savedPrice = (pickedCoupn && pickedCoupn.subtract || 0) + (pickedOff && pickedOff.subtract || 0);
    cartPriceAll = (cartPriceAll - savedPrice) > 0.01 ? (cartPriceAll - savedPrice) : 0.01;
    cartPriceAll = (cartPriceAll).toFixed(2);
    const newStateData = {
      store: appInfo.getInfo('store'),
      cart: cartArr,
      coupons, specAount, cartAmountAll, cartPriceAll, pickedOff, pickedCoupn, savedPrice
    };
    // 选择了可用优惠券或选择不使用
    if (_pickedCoupn && _pickedCoupn.useable || _pickedCoupn === null) {
      newStateData.showPickerCoupon = false;
    }
    this.setData(newStateData);
  },
  // 查看门店位置
  showStorePosition(e) {
    const store = e && e.currentTarget.dataset.store;
    if (!store) return;
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.location
    });
  },
  // 记录备注
  setComment(e) {
    const comments = e && e.detail.value;
    this.setData({ comments });
  },
  // 切换是否展示全部商品
  toggleShowAllGoods() {
    this.setData({ showAllGoods: !this.data.showAllGoods });
  },
  // 切换选择取餐时间
  toggleShowPickTime() {
    this.setData({ showPickerTime: !this.data.showPickerTime });
  },
  // 切换备注弹层
  toggleShowComments() {
    this.setData({
      showAddComments: !this.data.showAddComments
    });
  },
  // 切换选择优惠券弹层
  toggleShowPickCoupon() {
    this.setData({ showPickerCoupon: !this.data.showPickerCoupon });
  },
  hideLayers() {
    this.setData({
      showPickerTime: false, showPickerCoupon: false
    });
  },
  // 发起支付请求
  getPayInfo() {
    if (this.data.payRequest) return;
    const store = appInfo.getInfo('store');
    const cart = appInfo.cart;
    const payInfoArr = [];
    const pickedCoupon = this.data.pickedCoupn;
    const pickedOff = this.data.pickedOff;
    const comments = this.data.comments;
    for(let key in cart) {
      if (!cart.hasOwnProperty(key)) continue;
      payInfoArr.push({
        storeProductId: cart[key]['storeProductId'],
        storeProductSpecId: cart[key]['storeProductSpecId'],
        amount: cart[key]['amount']
      });
    }
    const tradeInfo = {
      storeId: store.id,
      payString: JSON.stringify(payInfoArr),
      couponId: pickedCoupon && pickedCoupon.id || '',
      offId: pickedOff && pickedOff.id || '',
      estimateDate: +takeTimeStamp,
      remark: comments || '',
    };
    this.setData({ payRequest: true });
    Trade.getPayInfo(tradeInfo, this.requestPayment.bind(this), toast.bind(null));
  },
  // 调用本地支付
  requestPayment(res) {
    const payInfo = res.result;
    let tradeDetailUri = `/pages/orderDetail/index?tradeId=${payInfo.tradeId}`;
    wx.requestPayment({
      timeStamp: payInfo.timestamp,
      nonceStr: payInfo.nonceStr,
      package: payInfo.pkg,
      signType: payInfo.signType,
      paySign: payInfo.paySign,
      success: () => {
        tradeDetailUri += '&state=paid';
      },
      complete: () => {
        delete appInfo.cart;
        this.setData({ payRequest: false });
        paymentCompleteSign = true;
        wx.redirectTo({
          url: tradeDetailUri,
          complete: () => {
            paymentCompleteSign = false;
          }
        });
      }
    });
  },
  onLoad() {
    wx.hideShareMenu({});
  },
  onShow() {
    if (paymentCompleteSign) {
      paymentCompleteSign = false;
      return;
    }
    appInfo.cart && this.prepareInfo ? this.prepareInfo() : wx.redirectTo({ url: '/pages/index/index' });
  }
})
