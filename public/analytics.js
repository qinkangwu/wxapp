let userId = '';

(function getUserId() {
  wx.getStorage({
    key: 'babiUser',
    success: (res) => {
      userId = res && res.data && res.data.id;
    },
    fail: () => {
      setTimeout(getUserId, 1000);
    }
  });
})()

export function acc(appInfo, action, data) {
  const accObj = {};
  accObj.action = action;
  accObj.info = data;
  accObj.time = +new Date;
  accObj.project = 'wxMiniApp';
  accObj.userId = userId;
  const accInfo = `http://analytics.bestfood517.com/?logInfo=${encodeURIComponent(JSON.stringify(accObj))}`;
  const curPages = getCurrentPages();
  const curPage = curPages && curPages.length && curPages[curPages.length - 1];
  curPage && curPage.setData({ accUrl: accInfo });
}