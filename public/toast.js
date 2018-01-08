export function toast(msg, time) {
  const curPages = getCurrentPages();
  const curPage = curPages && curPages.length && curPages[curPages.length - 1];
  curPage && curPage.setData({ toastMsg: msg });
  curPage && setTimeout(curPage.setData.bind(curPage, { toastMsg: '' }), time > 0 ? time : 1800);
  !curPage && msg && wx.showModal({
    content: `${msg}`,
    showCancel: false,
  });
}