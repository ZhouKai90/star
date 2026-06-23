const app = getApp();

Page({
  data: {
    headerTopPadding: 80,
    stars: 0,
    manualStars: '',
    showModal: false,
    modalTitle: '',
    modalMessage: '',
    modalConfirmText: '确认',
    modalCancelText: '取消',
    modalIsDanger: false,
    modalActionType: '',
    modalActionData: {},
    notification: null,
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

  onShow() {
    this.loadData();
  },

  loadData() {
    this.setData({ stars: app.globalData.stars });
  },

  goBack() {
    wx.navigateBack();
  },

  onManualStarsInput(e) {
    this.setData({ manualStars: e.detail.value });
  },

  handleManualSetStars() {
    const val = parseInt(this.data.manualStars, 10);
    if (isNaN(val) || val < 0) {
      this.showNotification('请输入有效的星星数量（不能为负数）', 'error');
      return;
    }
    wx.hideKeyboard();
    this.setData({
      modalTitle: '确认修改',
      modalMessage: `确定要将星星总数从 ${this.data.stars} 直接修改为 ${val} 吗？`,
      modalConfirmText: '确认修改',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'manualStars',
      modalActionData: { value: val },
      showModal: true,
    });
  },

  handleResetData() {
    this.setData({
      modalTitle: '⚠️ 重置所有数据',
      modalMessage: '这将清空所有星星数量和历史记录。任务和奖励列表将保留。确定要继续吗？',
      modalConfirmText: '确认重置',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'resetData',
      modalActionData: {},
      showModal: true,
    });
  },

  handleModalConfirm() {
    const { modalActionType, modalActionData } = this.data;
    const gd = app.globalData;

    switch (modalActionType) {
      case 'manualStars': {
        gd.stars = modalActionData.value;
        app.saveData();
        this.setData({ manualStars: '' });
        this.showNotification(`星星数量已更新为 ${gd.stars}`);
        this.loadData();
        break;
      }
      case 'resetData': {
        gd.stars = 0;
        gd.history = [];
        app.saveData();
        this.loadData();
        break;
      }
    }

    this.setData({ showModal: false });
  },

  handleModalCancel() {
    this.setData({ showModal: false });
  },

  showNotification(msg, type = 'success') {
    this.setData({ notification: { msg, type } });
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      this.setData({ notification: null });
    }, 2000);
  },

  preventMove() {},

  onUnload() {
    clearTimeout(this._notifTimer);
  },
});
