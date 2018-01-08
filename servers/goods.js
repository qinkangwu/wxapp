import appInfo from '../utils/util.js';
import User from './user.js';

const toast = appInfo.toast;
const apiPath = appInfo.apiPath;

const goodsServers = {};

const getSpecInfo = (spenInfo, callback) => {
  appInfo.get(`${apiPath.getSpecInfo}&${appInfo.makeParams({ id: spenInfo.storeProductSpecId })}`).then(res => {
    if (res.status == 'OK') {
      callback && callback(res.result);
      return;
    }
    ['1', '2'].indexOf(res.errorCode) == -1 ? toast(res.message) : User.serverInit(getSpecInfo.bind(null, spenInfo, callback));
  });
}

goodsServers.getSpecInfo = getSpecInfo;

export default goodsServers