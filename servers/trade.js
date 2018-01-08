import appInfo from '../utils/util.js';
import User from './user.js';

const toast = appInfo.toast;
const apiPath = appInfo.apiPath;

const tradeServers = {};

const addTrade = (tradeInfo) => {
  appInfo.post(apiPath.addTrade, {
    storeId: tradeInfo.storeId,
    products: tradeInfo.payString || "",
    couponId: tradeInfo.couponId || "",
    offStoreId: tradeInfo.offId || "",
    estimateDate: tradeInfo.estimateDate || "",
    remark: tradeInfo.remark || "",
    tradeSource: tradeInfo.totalAmount ? 'WECHAT_MINI_PAY' : 'WECHAT_MINI',
    totalAmount: tradeInfo.totalAmount || "", // 扫码付款使用金额字段
    deviceId: tradeInfo.deviceId || "",
  }).then(res => {
    if (res.status == 'OK') {
      tradeInfo.tradeId = res.result;
      updateTrade(tradeInfo);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? tradeInfo.failAction(res.message || '创建订单失败') : User.serverInit(addTrade.bind(null, tradeInfo));
  });
}

const updateTrade = (tradeInfo) => {
  const tradeId = tradeInfo.tradeId;
  appInfo.post(`${apiPath.updateTrade}&${appInfo.makeParams({ tradeId })}`).then(res => {
    if (res.status == 'OK') {
      updatePayChannel(tradeInfo);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? tradeInfo.failAction(res.message || '更新订单失败') : User.serverInit(updateTrade.bind(null, tradeInfo));
  });
}

const updatePayChannel = (tradeInfo) => {
  appInfo.post(apiPath.updatePayChannel, {
    tradeId: tradeInfo.tradeId,
    channel: 'WECHAT_WEB'
  }).then(res => {
    if (res.status == 'OK') {
      res.result.tradeId = tradeInfo.tradeId;
      tradeInfo.okAction(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? tradeInfo.failAction(res.message || '设置支付渠道失败') : User.serverInit(updatePayChannel.bind(null, tradeInfo));
  });
}

const getTradeDetail = (tradeId, callback) => {
  appInfo.get(`${apiPath.getTradeDetail}&${appInfo.makeParams({ tradeId })}`).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getTradeDetail.bind(null, tradeId, callback));
  });
}

const checkTradePaid = (tradeId, callback) => {
  appInfo.post(apiPath.checkIfPaid, { tradeId }).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(checkTradePaid.bind(null, tradeId, callback));
  });
}

const setTradeArrived = (tradeId, callback) => {
  appInfo.post(`${apiPath.setTradeArrived}&${appInfo.makeParams({ tradeId })}`).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(setTradeArrived.bind(null, tradeId, callback));
  });
};

const setTradeFail = (tradeId, callback) => {
  appInfo.post(apiPath.setTradeFail, { tradeId }).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(setTradeFail.bind(null, tradeId, callback));
  });
}

const getTradeList = (options, callback) => {
  const requestParams = {
    storeId: options.storeId || '',
    status: options.status || '',
    skip: options.skip || 0,
    limit: options.limit || 20,
  };
  appInfo.get(`${apiPath.getTradeList}&${appInfo.makeParams(requestParams)}`).then(res => {
    if (res.status == 'OK') {
      callback(res);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getTradeList.bind(null, options, callback));
  })
}

tradeServers.getPayInfo = (tradeInfo, actionDone, actionFail) => {
  // 添加订单：门店、商品、优惠券及回调
  tradeInfo.okAction = actionDone || appInfo.noop;
  tradeInfo.failAction = actionFail || appInfo.noop;
  tradeInfo.tradeId ? updateTrade(tradeInfo) : addTrade(tradeInfo);
}

tradeServers.getTradeDetail = getTradeDetail;

tradeServers.checkTradePaid = checkTradePaid;

tradeServers.setTradeArrived = setTradeArrived;

tradeServers.setTradeFail = setTradeFail;

tradeServers.getTradeList = getTradeList;

export default tradeServers