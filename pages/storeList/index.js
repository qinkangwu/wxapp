import appInfo from '../../utils/util.js'
import Store from '../../servers/store.js'

const appData = getApp().data;
const _width = appData._width;
const _height = appData._height;
const _heightScale = .65;
const _searchBarHeight = 40;
const toast = appInfo.toast;

const getPositionControl = () => {
  // 重新定位按钮
  return [{
    id: 0,
    iconPath: '/static/locate.png',
    position: {
      left: 0 + 5,
      top: _width * _heightScale - 20 - 15,
      width: 30,
      height: 30
    },
    clickable: true
  }, {
    iconPath: '/static/center.png',
    position: {
      left: _width / 2 - 11,
      top: (_width * _heightScale) / 2 - 34,
      width: 22,
      height: 34
    },
    clickable: false
  }]
}

Page({
  data: {
    keySearchFocus: false,
    showKeySearchRes: false,
    showSearchLoading: false,
    mapHeightScale: _heightScale,
    searchBarHeight: _searchBarHeight,
    mapSearchHeight: _height - (_width * _heightScale) - _searchBarHeight,
    keySearchHeight: _height - _searchBarHeight,
    searchKey: '',
    location: {},
    searchStores: [],
    lightOnMapItemIndex: 0,
    cityNames: [],
    curCityIndex: -1,
    storeMarkers: [],
    controls: getPositionControl()
  },
  // 移动地图获取定位
  getMapCenter(e) {
    if (this.data.keySearchFocus || this.data.showKeySearchRes || e.type != 'end') return;
    this.map.getCenterLocation({
      success: (res) => {
        const lastRes = this.getMapCenter.lastRes;
        if (lastRes && res.latitude == lastRes.latitude && res.longitude == lastRes.longitude) return;
        this.getMapCenter.lastRes = res;
        this.searchStoreByPosition(res);
      }
    });
  },
  // 点击门店小图标
  pickStoreOnMap(e) {
    const stores = this.data.searchStores;
    let lightOnMapItemIndex = 0;
    stores.map((store, index) => {
      store.lightOn = index == e.markerId;
      store.lightOn && (lightOnMapItemIndex = index);
    });
    this.setData({
      searchStores: stores,
      lightOnMapItemIndex: lightOnMapItemIndex
    });
  },
  searchInputBulr() {
    if (this.data.showKeySearchRes) return;
    this.setData({ keySearchFocus: false });
    this.getCurLocation();
  },
  // 获取当前定位并拉取附近门店
  getCurLocation(e) {
    const _this = this;
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        _this.setData({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
        _this.searchStoreByPosition(res);
      },
      fail: () => {
        wx.openSetting && wx.openSetting({
          success: (res) => {
            const authObj = res && res.authSetting;
            if (authObj && authObj['scope.userLocation']) return;
            if (_this.getCurLocation.forcedOnce) return;
            appInfo.showSetting('允许定位才能更好服务你哦 ^_^', _this.getCurLocation.bind(_this));
            _this.getCurLocation.forcedOnce = true;
          },
          fail: appInfo.showSetting.bind(appInfo, '允许定位才能更好服务你哦 ^_^', _this.getCurLocation.bind(_this))
        })
        !wx.openSetting && toast("获取登录信息失败！删除后再次加载可重新授权");
      },
      complete: () => {
        wx.setNavigationBarTitle({ title: '请选择门店' });
      }
    });
  },
  // 切换搜索方式
  setSearchType(e) {
    const _type = e.currentTarget.dataset && e.currentTarget.dataset.type || 'key';
    this.setData({
      showKeySearchRes: this.data.searchKey && _type == 'key',
      keySearchFocus: _type == 'key',
      showSearchLoading: false,
    });
    this.data.searchKey && _type == 'key' && this.searchStoreByKeywords(this.data.searchKey);
    _type == 'map' && this.getCurLocation();
  },
  // 有搜索关键字展示搜索列表
  searchStore(e) {
    const _this = this;
    const key = e.detail && e.detail.value || '';
    this.setData({
      searchKey: key,
      keySearchFocus: true,
      showKeySearchRes: !!key,
    });
    key ? this.searchStoreByKeywords(key) : !this.data.keySearchFocus && this.getCurLocation();
  },
  searchStoreByKeywords(key) {
    this.setData({ showSearchLoading: true });
    Store.getStoresByKeywords(key, this.setStoreList.bind(this));
  },
  searchStoreByPosition(location) {
    if (this.data.keySearchFocus || this.data.showKeySearchRes) return;
    this.setData({ showSearchLoading: true });
    Store.getStoresByPosition(location, this.setStoreList.bind(this));
  },
  // 赋值 搜索门店 结果
  setStoreList(stores) {
    const markers = [];
    const storeIconPath = "../../static/marker.png";
    stores.map((store, index) => {
      markers.push({
        id: index,
        width: 24,
        height: 24,
        title: store.name,
        iconPath: storeIconPath,
        latitude: store.latitude,
        longitude: store.longitude,
      })
    });
    this.setData({
      showSearchLoading: false,
      lightOnMapItemIndex: 0,
      searchStores: stores || [],
      storeMarkers: markers,
    });
    setTimeout(this.setData.bind(this, { storeMarkers: markers }), 50);
  },
  // 选择门店
  setStore(e) {
    const storeInfo = e.currentTarget.dataset && e.currentTarget.dataset.value;
    appInfo.setInfo('store', storeInfo);
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },
  // 准备工作
  onLoad() {
    const _this = this;
    _this.map = wx.createMapContext('map');
    _this.getCurLocation();
    wx.showShareMenu({ withShareTicket: true });
  }
})