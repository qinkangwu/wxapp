import appInfo from '../../utils/util.js'
import Store from '../../servers/store.js'
import Goods from '../../servers/goods.js'
import User from '../../servers/user.js'

const appData = getApp().data;
const _width = appData._width;
const _height = appData._height;
const storeInfoHeight = 49;
const cartBarHeight = 49;
const goodsItemHeight = 80;
const cateNavHeight = 32;
const scrollNavMatchHeight = [];
const toast = appInfo.toast;

Page({
  data: {
    loading: true,
    _width: _width,
    _height: _height,
    goodList: [],
    pormotions: [],
    storeInfoHeight,
    promotionBarheight: 24,
    containerHeight: _height - storeInfoHeight - cartBarHeight,
    cartBarHeight,
    goodsItemHeight,
    cateNavHeight,
    cart: {},
    unFinishTrades: 0,
    showEasyPay: false
  },
  navLightOn(e) {
    const _this = this;
    const tabNavIndex = e.currentTarget.id && e.currentTarget.id.substr(3);
    const scrollCateId = `cate${tabNavIndex || 0}`;
    _this.data.goodList.map((cate, index) => {
      cate.lightOn = index == tabNavIndex;
    });
    _this.setData({
      goodList: _this.data.goodList,
      scrollCateId
    });
  },
  scrollOnGoods(e) {
    const nowScrollTop = e.detail.scrollTop;
    let navIndex = 0;
    let preHeight = -1, nextHeight = 100000;
    scrollNavMatchHeight.map((height, index) => {
      preHeight = index > 0 ? scrollNavMatchHeight[index - 1] : 0;
      nextHeight = scrollNavMatchHeight[index];
      navIndex = (nowScrollTop >= preHeight) && (nowScrollTop < nextHeight) ? index : navIndex;
    });
    const scrollNavId = `nav${navIndex}`
    this.data.goodList.map((cate, index) => {
      cate.lightOn = navIndex == index;
    });
    this.setData({
      goodList: this.data.goodList,
      scrollNavId
    });
  },
  toggleMiniCart() {
    const showMiniCart = !this.data.showMiniCart;
    this.setData({ showMiniCart });
  },
  hideMiniCart() {
    this.setData({ showMiniCart: false });
  },
  // 加入购物车
  addToCart(e) {
    const curStoreConfig = appInfo.curStoreInfo.storeConfig;
    if (!curStoreConfig || !curStoreConfig.open || !curStoreConfig.isOneKeyBuy) {
      toast(curStoreConfig.open ? '暂不支持一件订餐' : curStoreConfig.closeReason);
      return;
    }
    const info = e.currentTarget.dataset;
    const specInfo = info.goods;
    const cart = this.data.cart;
    let cartInfo = cart[specInfo.storeProductSpecId];
    cartInfo ? cartInfo.amount += info.amount : cartInfo = cart[specInfo.storeProductSpecId] = {
      storeProductId: specInfo.storeProductId,
      storeProductSpecId: specInfo.storeProductSpecId,
      name: specInfo.name,
      price: specInfo.price,
      amount: info.amount,
      logo: specInfo.frontLogo,
    };
    cartInfo.amount < 1 ? delete cart[specInfo.storeProductSpecId] : Goods.getSpecInfo(cartInfo, this.reviseCartInfo.bind(this));
    let cartPriceTotal = 0, cartAmountTotal = 0;
    for (let key in cart) {
      if (!cart.hasOwnProperty(key)) continue;
      cartAmountTotal += cart[key].amount;
      cartPriceTotal += cart[key].amount * cart[key].price;
    }
    cartPriceTotal = cartPriceTotal.toFixed(2);
    this.setData({ cart, cartAmountTotal, cartPriceTotal });
  },
  clearCart() {
    wx.showModal({
      content: '确认清空购物车吗',
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ showMiniCart: false, cart: {}, cartAmountTotal: 0, cartPriceTotal: 0 });
      }
    })
  },
  // 检验购物车商品储量
  reviseCartInfo(specInfo) {
    const cart = this.data.cart;
    const cartSpecInfo = cart[specInfo && specInfo.id];
    const checkProduct = cart[specInfo.id];
    if (!cartSpecInfo || !specInfo) return;
    if (!specInfo.soldOut && (specInfo.remain >= cartSpecInfo.amount)) return;
    cartSpecInfo.amount = specInfo.soldOut ? 0 : specInfo.remain;
    cartSpecInfo.amount < 1 && (delete cart[specInfo.id]);
    checkProduct && toast(`${checkProduct.name}商品不足`);
    let cartPriceTotal = 0, cartAmountTotal = 0;
    for (let key in cart) {
      if (!cart.hasOwnProperty(key)) continue;
      cartAmountTotal += cart[key].amount;
      cartPriceTotal += cart[key].amount * cart[key].price;
    }
    cartPriceTotal = cartPriceTotal.toFixed(2);
    this.setData({ cart, cartAmountTotal, cartPriceTotal });
  },
  goToPay() {
    if (!this.data.cartAmountTotal) return;
    appInfo.cart = this.data.cart;
    appInfo.toUrl('/pages/payOrder/index');
  },
  getTradeCount() {
    User.getTradeCount(({result}) => {
      let unFinishTrades = (result.INIT + result.UNPAID + result.PAID) || 0;
      this.setData({ unFinishTrades });
    });
  },
  toTradeList() {
    appInfo.toUrl('/pages/orderList/index');
  },
  // 获取门店信息
  getStoreInfo() {
    const store = appInfo.getInfo('store');
    wx.showNavigationBarLoading();
    Store.getStoreInfo(store.id, (storeInfo) => {
      appInfo.curStoreInfo = storeInfo;
      appInfo.setInfo('store', storeInfo);
      const localVersion = appInfo.getInfo('version') || NaN;
      const localGoods = appInfo.getInfo('goods');
      this.setData({ store: storeInfo, showEasyPay: !!storeInfo.showEasyPay || !!storeInfo.storeConfig.showEasyPay });
      if (localVersion == storeInfo.version && localGoods) {
        this.tidyGoods(localGoods);
        wx.hideNavigationBarLoading();
      } else {
        appInfo.setInfo('version', storeInfo.version);
        this.getGoods();
      }
    });
  },
  // 获取当前门店商品
  getGoods() {
    const store = appInfo.getInfo('store');
    Store.getGoods(store.id, (goodsInfo) => {
      appInfo.setInfo('goods', goodsInfo);
      this.tidyGoods(goodsInfo);
      wx.hideNavigationBarLoading();
    });
  },
  // 转换商品格式
  tidyGoods(goods) {
    const goodsList = [];
    const goodsIds = [];
    // make new goods data list for render
    goods.map((cate, navIndex) => {
      const sons = [];
      cate.storeProducts && cate.storeProducts.length && cate.storeProducts.map((baseProduct, baseIndex) => {
        if (!baseProduct.specs.length) return;
        baseProduct.specs.map((specProduct, specIndex) => {
          goodsIds.push(specProduct.id);
          sons.push({
            storeProductSpecId: specProduct.id,
            storeProductId: baseProduct.id,
            name: baseProduct.name,
            price: (+specProduct.price).toFixed(2),
            terse: baseProduct.terse,
            detail: baseProduct.detail,
            frontLogo: baseProduct.frontLogo,
            frontPhotos: baseProduct.frontPhotos,
            frontHeadPhoto: baseProduct.frontHeadPhoto,
          });
        });
      });
      sons.length && goodsList.push({
        name: cate.name,
        sons: sons
      });
    });
    // set scrollTop data
    let lastHeight = 0;
    scrollNavMatchHeight.length = 0;
    goodsList.map((cate, index) => {
      let thisPartHeight = cate.sons.length * goodsItemHeight + cateNavHeight;
      scrollNavMatchHeight.push(lastHeight + thisPartHeight);
      lastHeight += thisPartHeight;
      cate.lightOn = index == 0;
    });
    // check cartInfo
    let cart = this.data.cart;
    let cartPriceTotal = 0, cartAmountTotal = 0, badCart = false;
    for (let key in cart) {
      if (!cart.hasOwnProperty(key)) continue;
      goodsIds.indexOf(key) == -1 && (badCart = true);
      cartAmountTotal += cart[key].amount;
      cartPriceTotal += cart[key].amount * cart[key].price;
    }
    cartPriceTotal = cartPriceTotal.toFixed(2);
    if (badCart) {
      cart = {};
      cartPriceTotal = 0;
      cartAmountTotal = 0;
    }
    this.setData({
      goodList: goodsList,
      loading: false,
      cart,
      cartAmountTotal,
      cartPriceTotal
    });
  },
  // 切换门店
  changeStore() {
    delete appInfo.cart;
    appInfo.clearInfo('version');
    appInfo.clearInfo('goods');
    let loading = true;
    let cartAmountTotal = 0;
    let cartPriceTotal = 0;
    let cart = null;
    let store = null;
    wx.redirectTo({
      url: '/pages/storeList/index'
    });
    this.setData({ store, cart, loading, cartAmountTotal, cartPriceTotal });
  },
  showPormotion() {
    const coupons = this.data.coupons || [];
    const offs = this.data.offs || [];
    const pormotions = [];
    let couponPromotion = '您有';
    coupons.map(coupon => {
      couponPromotion += `满${coupon.trigger || coupon.source.trigger}减${coupon.subtract}、`;
    });
    couponPromotion = couponPromotion.substr(0, couponPromotion.length - 1) + '的优惠券可用';
    let offPromotion = '当前门店现有';
    offs.map(off => {
      offPromotion += `满${off.trigger || off.source.trigger}减${off.subtract || off.source.subtract}、`; 
    });
    offPromotion = offPromotion.substr(0, offPromotion.length - 1) + '的优惠活动';
    // 统一展示优惠
    offs.length && pormotions.push(offPromotion);
    coupons.length && pormotions.push(couponPromotion);
    this.setData({ pormotions });
  },
  // 扫码支付
  toEasyPay() {
    wx.scanCode({
      success: (res) => {
        const scanResult = res.result;
        const matchRes = scanResult.match(/easyPay\/(.*)/);
        if (!matchRes) {
          toast('请扫门店一键支付二维码');
          return;
        }
        const storeId = matchRes[1].split('?')[0];
        const deviceId = storeId == matchRes[1] ? '' : matchRes[1].split('?')[1].substr(-1);
        appInfo.toUrl(`/pages/easypay/index?storeId=${storeId}&deviceId=${deviceId}`);
      }
    });
  },
  onLoad(options) {
    const store = appInfo.getInfo('store');
    if (store && (store.id == options.storeId)) return;
    wx.showShareMenu({ withShareTicket: true });
    options.storeId && appInfo.setInfo('store', {
      id: options.storeId,
      name: '获取门店信息中...'
    });
  },
  onReady() {},
  onShow(options) {
    const store = appInfo.getInfo('store');
    if (!store) {
      this.changeStore();
    } else {
      this.setData({ store });
      wx.setNavigationBarTitle({ title: '巴比商城' });
      this.getStoreInfo();
      this.getTradeCount();
      // get coupon info
      User.getCoupons(({ result }) => {
        appInfo.coupons = result;
        this.setData({coupons: result });
        this.showPormotion();
      });
      // get off info
      Store.getOff(store.id, (result) => {
        appInfo.offs = [];
        result.map((offRes,offIndex)=>{
          if (offRes.source.tradeSource == '1'){
              appInfo.offs.push(offRes);
            }
        })
        this.setData({ offs: appInfo.offs });
        this.showPormotion();
      });
    }
  },
  onHide () {},
  onUnload() {}
})
