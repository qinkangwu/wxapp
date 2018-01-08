import appInfo from '../utils/util.js';
import User from './user.js';

const toast = appInfo.toast;
const apiPath = appInfo.apiPath;

const storeServers = {};

let getStoresByPositionTimer = 0;
const getStoresByPosition = (location, callback) => {
  let _timer = ++getStoresByPositionTimer;
  const queryObj = {
    longitude: location.longitude,
    latitude: location.latitude,
    distance: 3
  };
  appInfo.get(`${apiPath.getStoresNearBy}&${appInfo.makeParams(queryObj)}`).then(res => {
    if (_timer != getStoresByPositionTimer) return;
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getStoresByPosition.bind(null, location, callback));
  });
}

let getStoresByKeywordsTimer = 0;
const getStoresByKeywords = (key, callback) => {
  let _timer = ++getStoresByKeywordsTimer;
  const queryObj = {
    keyword: encodeURIComponent(key)
  };
  appInfo.get(`${apiPath.getStoresByKey}&${appInfo.makeParams(queryObj)}`).then(res => {
    if (_timer != getStoresByKeywordsTimer) return;
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getStoresByKeywords.bind(null, key, callback));
  });
}

const getStoreInfo = (storeId, callback) => {
  appInfo.get(`${apiPath.getStoreInfo}&${appInfo.makeParams({ storeId })}`).then(res => {
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getStoreInfo.bind(null, storeId, callback));
  })
}

const getGoods = (storeId, callback) => {
  appInfo.get(`${apiPath.getGoodsList}&${appInfo.makeParams({ storeId })}`).then(res => {
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getGoods.bind(null, storeId, callback));
  })
}

const getOff = (storeId, callback) => {
  appInfo.get(`${apiPath.getOffList}&${appInfo.makeParams({ storeId })}`).then(res => {
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getOff.bind(null, storeId, callback));
  })
}

storeServers.getStoresByPosition = getStoresByPosition;
storeServers.getStoresByKeywords = getStoresByKeywords;
storeServers.getStoreInfo = getStoreInfo;
storeServers.getGoods = getGoods;
storeServers.getOff = getOff;

export default storeServers