const app = getApp();
const util = require('../../utils/util');

Page({
  data: {
    stars: 0,
    activeTab: 'earn',
    todayLabel: '',
    showConfetti: false,

    displayTasks: [],
    displayBadHabits: [],
    displayRewards: [],

    customEarnReason: '',
    customEarnValue: '',
    customDeductReason: '',
    customDeductValue: '',
    customSpendReason: '',
    customSpendValue: '',

    showModal: false,
    modalTitle: '',
    modalMessage: '',
    modalConfirmText: '确认',
    modalCancelText: '取消',
    modalIsDanger: false,
    modalActionType: '',
    modalActionData: {},

    notification: null,

    headerTopPadding: 80,
    headerRightPadding: 40,
  },

  onLoad() {
    this.updateTodayLabel();
    this.refreshData();
    this.calcSafePadding();
  },

  calcSafePadding() {
    try {
      const sysInfo = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      const winW = sysInfo.windowWidth;
      const px2rpx = (px) => Math.ceil(px * 750 / winW);
      const topRpx = px2rpx(sysInfo.statusBarHeight + 10);
      const rightRpx = px2rpx(winW - menuButton.left + 16);
      this.setData({
        headerTopPadding: topRpx,
        headerRightPadding: rightRpx,
      });
    } catch (e) {}
  },

  onShow() {
    this.refreshData();
  },

  updateTodayLabel() {
    const now = new Date();
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = weekdayNames[now.getDay()];
    this.setData({ todayLabel: `今天 · ${month}月${day}日 · ${weekday}` });
  },

  refreshData() {
    const gd = app.globalData;
    const today = new Date();
    this.setData({
      stars: gd.stars,
      displayTasks: this.buildTasks(gd, today),
      displayBadHabits: this.buildBadHabits(gd),
      displayRewards: this.buildRewards(gd),
    });
  },

  buildTasks(gd, date) {
    return gd.tasks.map(task => {
      const completionCount = app.getTaskCompletionCountForDate(task.title, date.toISOString());
      const isCompleted = completionCount > 0;
      const statusText = isCompleted ? `已完成 ${completionCount} 次，可继续` : '未完成';
      return { ...task, completionCount, isCompleted, isDisabled: false, statusText };
    });
  },

  buildBadHabits(gd) {
    return gd.badHabits.map(habit => {
      const nextStars = Math.max(0, gd.stars - habit.value);
      const goesNegative = gd.stars - habit.value < 0;
      return { ...habit, nextStars, goesNegative };
    });
  },

  buildRewards(gd) {
    return gd.rewards.map(reward => ({
      ...reward, canAfford: gd.stars >= reward.cost
    }));
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  goToManage() {
    wx.navigateTo({ url: '/pages/manage/manage' });
  },

  onEarnReasonInput(e) { this.setData({ customEarnReason: e.detail.value }); },
  onEarnValueInput(e) { this.setData({ customEarnValue: e.detail.value }); },
  onDeductReasonInput(e) { this.setData({ customDeductReason: e.detail.value }); },
  onDeductValueInput(e) { this.setData({ customDeductValue: e.detail.value }); },
  onSpendReasonInput(e) { this.setData({ customSpendReason: e.detail.value }); },
  onSpendValueInput(e) { this.setData({ customSpendValue: e.detail.value }); },

  handleEarnStar(e) {
    const taskId = parseInt(e.currentTarget.dataset.id, 10);
    const gd = app.globalData;
    const task = gd.tasks.find(t => t.id === taskId);
    if (!task) return;

    const displayTask = this.data.displayTasks.find(t => t.id === taskId);
    if (displayTask && displayTask.isDisabled) return;

    this.setData({
      modalTitle: '确认奖励星星',
      modalMessage: `确定完成 "${task.title}" 并获得 ${task.value} 颗星星吗？`,
      modalConfirmText: '确认奖励',
      modalCancelText: '取消',
      modalIsDanger: false,
      modalActionType: 'earn',
      modalActionData: { title: task.title, value: task.value, icon: task.icon },
      showModal: true,
    });
  },

  handleRevokeEarn(e) {
    const taskTitle = e.currentTarget.dataset.title;
    const taskValue = parseInt(e.currentTarget.dataset.value, 10);
    const today = new Date();

    const gd = app.globalData;
    const recordToDelete = gd.history.find(item =>
      item.title === taskTitle &&
      item.type === 'earn' &&
      util.isSameDay(new Date(item.date), today)
    );
    if (!recordToDelete) return;

    this.setData({
      modalTitle: '确认撤销',
      modalMessage: `确定要撤销 "${taskTitle}" 的完成记录吗？将扣回 ${taskValue} 颗星星。`,
      modalConfirmText: '确认撤销',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'revokeEarn',
      modalActionData: { value: taskValue, recordId: recordToDelete.id },
      showModal: true,
    });
  },

  handleDeductStar(e) {
    const { title, value } = e.currentTarget.dataset;
    const gd = app.globalData;
    this.setData({
      modalTitle: '确认扣除星星',
      modalMessage: `确定要因为 "${title}" 扣除 ${value} 颗星星吗？当前星星数：${gd.stars}。`,
      modalConfirmText: '确认扣除',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'deduct',
      modalActionData: { title, value: parseInt(value, 10) },
      showModal: true,
    });
  },

  handleSpendStar(e) {
    const rewardId = parseInt(e.currentTarget.dataset.id, 10);
    const displayReward = this.data.displayRewards.find(r => r.id === rewardId);
    if (displayReward && !displayReward.canAfford) return;

    const { title, cost } = e.currentTarget.dataset;
    const gd = app.globalData;
    if (gd.stars < parseInt(cost, 10)) {
      this.showNotification(`星星不够哦，还需要 ${parseInt(cost, 10) - gd.stars} 颗星星！`, 'error');
      return;
    }
    this.setData({
      modalTitle: '确认兑换',
      modalMessage: `确定要消耗 ${cost} 颗星星兑换 "${title}" 吗？`,
      modalConfirmText: '确认兑换',
      modalCancelText: '取消',
      modalIsDanger: false,
      modalActionType: 'spend',
      modalActionData: { title, cost: parseInt(cost, 10) },
      showModal: true,
    });
  },

  handleCustomEarn() {
    const reason = this.data.customEarnReason.trim();
    const amount = parseInt(this.data.customEarnValue, 10);
    if (!reason || isNaN(amount) || amount <= 0) {
      this.showNotification('请输入有效的奖励理由和星数', 'error');
      return;
    }
    this.setData({
      modalTitle: '确认自定义奖励',
      modalMessage: `确定因为 "${reason}" 奖励 ${amount} 颗星星吗？`,
      modalConfirmText: '确认奖励',
      modalCancelText: '取消',
      modalIsDanger: false,
      modalActionType: 'customEarn',
      modalActionData: { title: reason, value: amount },
      showModal: true,
    });
  },

  handleCustomDeduct() {
    const reason = this.data.customDeductReason.trim();
    const amount = parseInt(this.data.customDeductValue, 10);
    if (!reason || isNaN(amount) || amount <= 0) {
      this.showNotification('请输入有效的扣星理由和星数', 'error');
      return;
    }
    this.setData({
      modalTitle: '确认扣除星星',
      modalMessage: `确定要因为 "${reason}" 扣除 ${amount} 颗星星吗？`,
      modalConfirmText: '确认扣除',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'customDeduct',
      modalActionData: { title: reason, value: amount },
      showModal: true,
    });
  },

  handleCustomSpend() {
    const reason = this.data.customSpendReason.trim();
    const amount = parseInt(this.data.customSpendValue, 10);
    if (!reason || isNaN(amount) || amount <= 0) {
      this.showNotification('请输入有效的兑换理由和星数', 'error');
      return;
    }
    const gd = app.globalData;
    if (gd.stars < amount) {
      this.showNotification(`星星不够哦，还需要 ${amount - gd.stars} 颗星星！`, 'error');
      return;
    }
    gd.stars -= amount;
    gd.history.unshift({
      id: Date.now(), title: reason, value: amount, type: 'spend',
      date: new Date().toISOString(), icon: '🎁',
    });
    app.saveData();
    this.setData({ customSpendReason: '', customSpendValue: '' });
    this.showNotification(`已兑换：${reason} -${amount} ⭐️`);
    this.refreshData();
  },

  handleModalConfirm() {
    const { modalActionType, modalActionData } = this.data;
    const gd = app.globalData;

    switch (modalActionType) {
      case 'earn': {
        const now = new Date();
        gd.stars += modalActionData.value;
        gd.history.unshift({
          id: Date.now(), title: modalActionData.title, value: modalActionData.value,
          type: 'earn', date: now.toISOString(), icon: modalActionData.icon,
        });
        app.saveData();
        this.showNotification(`太棒了！完成 "${modalActionData.title}" 获得 +${modalActionData.value} ⭐️`);
        this.triggerConfetti();
        break;
      }
      case 'customEarn': {
        const nowCE = new Date();
        gd.stars += modalActionData.value;
        gd.history.unshift({
          id: Date.now(), title: modalActionData.title, value: modalActionData.value,
          type: 'earn', date: nowCE.toISOString(), icon: '✨',
        });
        app.saveData();
        this.setData({ customEarnReason: '', customEarnValue: '' });
        this.showNotification(`已添加自定义奖励：${modalActionData.title} +${modalActionData.value} ⭐️`);
        this.triggerConfetti();
        break;
      }
      case 'deduct': {
        gd.stars = Math.max(0, gd.stars - modalActionData.value);
        gd.history.unshift({
          id: Date.now(), title: modalActionData.title, value: modalActionData.value,
          type: 'deduct', date: new Date().toISOString(), icon: '❌',
        });
        app.saveData();
        this.showNotification(`扣星成功！因 "${modalActionData.title}" 扣除 ${modalActionData.value} 颗星。`, 'error');
        break;
      }
      case 'spend': {
        gd.stars -= modalActionData.cost;
        gd.history.unshift({
          id: Date.now(), title: modalActionData.title, value: modalActionData.cost,
          type: 'spend', date: new Date().toISOString(), icon: '🎁',
        });
        app.saveData();
        this.showNotification(`兑换成功！享受你的 "${modalActionData.title}" 吧！`);
        break;
      }
      case 'revokeEarn': {
        gd.stars = Math.max(0, gd.stars - modalActionData.value);
        gd.history = gd.history.filter(item => item.id !== modalActionData.recordId);
        app.saveData();
        this.showNotification('已撤销', 'success');
        break;
      }
      case 'customDeduct': {
        gd.stars = Math.max(0, gd.stars - modalActionData.value);
        gd.history.unshift({
          id: Date.now(), title: modalActionData.title, value: modalActionData.value,
          type: 'deduct', date: new Date().toISOString(), icon: '📝',
        });
        app.saveData();
        this.setData({ customDeductReason: '', customDeductValue: '' });
        this.showNotification(`已扣除：${modalActionData.title} -${modalActionData.value} ⭐️`, 'error');
        break;
      }
    }

    this.setData({ showModal: false });
    this.refreshData();
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

  triggerConfetti() {
    this.setData({ showConfetti: true });
    clearTimeout(this._confettiTimer);
    this._confettiTimer = setTimeout(() => {
      this.setData({ showConfetti: false });
    }, 1000);
  },

  preventMove() {},

  onUnload() {
    clearTimeout(this._notifTimer);
    clearTimeout(this._confettiTimer);
  },
});
