Page({
  data: {
    headerTopPadding: 80,
  },

  onLoad() {
    this.calcSafePadding();
  },

  calcSafePadding() {
    try {
      const sysInfo = wx.getSystemInfoSync();
      const winW = sysInfo.windowWidth;
      const px2rpx = (px) => Math.ceil(px * 750 / winW);
      this.setData({ headerTopPadding: px2rpx(sysInfo.statusBarHeight + 10) });
    } catch (e) {}
  },

  goBack() {
    wx.navigateBack();
  },

  goToItems() {
    wx.navigateTo({ url: '/pages/manage-items/manage-items' });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToData() {
    wx.navigateTo({ url: '/pages/manage-data/manage-data' });
  },
});
