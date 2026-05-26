const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    history: [],
    showModal: false,
    modalTitle: '',
    modalMessage: '',
    modalConfirmText: '确认',
    modalCancelText: '取消',
    modalIsDanger: false,
    notification: null,
  },

  onShow() {
    const history = app.globalData.history.map(item => ({
      ...item,
      formattedDate: util.formatDateTime(item.date),
    }));
    this.setData({ history });
  },

  goBack() {
    wx.navigateBack();
  },

  handleClearHistory() {
    this.setData({
      modalTitle: '清空历史记录',
      modalMessage: '确定要清空所有星星的收支历史记录吗？星星总数将保持不变。',
      modalConfirmText: '确认清空',
      modalCancelText: '取消',
      modalIsDanger: true,
      showModal: true,
    });
  },

  handleModalConfirm() {
    app.globalData.history = [];
    app.saveData();
    this.setData({ history: [], showModal: false });
    this.showNotification('历史记录已清空');
  },

  handleModalCancel() {
    this.setData({ showModal: false });
  },

  showNotification(msg, type) {
    this.setData({ notification: { msg, type: type || 'success' } });
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
