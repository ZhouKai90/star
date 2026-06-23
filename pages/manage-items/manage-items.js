const app = getApp();

Page({
  data: {
    headerTopPadding: 80,
    tasks: [],
    rewards: [],
    badHabits: [],

    newItemType: 'task',
    newItemTitle: '',
    newItemValue: '',
    newItemIcon: '🌟',
    iconIndex: 0,
    iconList: ['🌟', '🦷', '📚', '🧹', '🧸', '🏃', '🥦', '😴', '🍦', '🎮', '🎡', '🎁', '🤥', '😠', '✋'],

    editingId: null,
    editTitle: '',
    editValue: '',

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
    const gd = app.globalData;
    this.setData({
      tasks: gd.tasks,
      rewards: gd.rewards,
      badHabits: gd.badHabits,
    });
  },

  goBack() {
    wx.navigateBack();
  },

  setType(e) {
    this.setData({
      newItemType: e.currentTarget.dataset.type,
      editingId: null,
    });
  },

  onTitleInput(e) {
    this.setData({ newItemTitle: e.detail.value });
  },
  onValueInput(e) {
    this.setData({ newItemValue: e.detail.value });
  },
  onIconChange(e) {
    const index = e.detail.value;
    this.setData({
      iconIndex: index,
      newItemIcon: this.data.iconList[index],
    });
  },

  handleAddItem() {
    const { newItemTitle, newItemValue, newItemType, newItemIcon } = this.data;
    if (!newItemTitle || !newItemValue) {
      this.showNotification('请填写完整信息', 'error');
      return;
    }
    const parsedValue = parseInt(newItemValue, 10);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      this.showNotification('星数必须是大于0的数字！', 'error');
      return;
    }

    const gd = app.globalData;
    const newItem = { id: Date.now(), title: newItemTitle, icon: newItemIcon };

    if (newItemType === 'task') {
      gd.tasks.push({ ...newItem, value: parsedValue });
      this.showNotification('新任务添加成功！');
    } else if (newItemType === 'reward') {
      gd.rewards.push({ ...newItem, cost: parsedValue });
      this.showNotification('新奖励添加成功！');
    } else if (newItemType === 'badHabit') {
      gd.badHabits.push({ ...newItem, value: parsedValue });
      this.showNotification('新坏习惯添加成功！');
    }

    app.saveData();
    this.setData({ newItemTitle: '', newItemValue: '' });
    this.loadData();
  },

  startEdit(e) {
    const d = e.currentTarget.dataset;
    this.setData({
      editingId: d.id,
      editTitle: d.title,
      editValue: String(d.value),
    });
  },

  onEditTitleInput(e) {
    this.setData({ editTitle: e.detail.value });
  },
  onEditValueInput(e) {
    this.setData({ editValue: e.detail.value });
  },

  saveEdit(e) {
    const itemId = parseInt(e.currentTarget.dataset.id, 10);
    const { editTitle, editValue, newItemType } = this.data;
    if (!editTitle || parseInt(editValue, 10) <= 0) {
      this.showNotification('请输入有效的名称和数值', 'error');
      return;
    }
    const gd = app.globalData;

    if (newItemType === 'task') {
      gd.tasks = gd.tasks.map(t =>
        t.id === itemId ? { ...t, title: editTitle, value: parseInt(editValue, 10) } : t
      );
    } else if (newItemType === 'reward') {
      gd.rewards = gd.rewards.map(r =>
        r.id === itemId ? { ...r, title: editTitle, cost: parseInt(editValue, 10) } : r
      );
    } else if (newItemType === 'badHabit') {
      gd.badHabits = gd.badHabits.map(h =>
        h.id === itemId ? { ...h, title: editTitle, value: parseInt(editValue, 10) } : h
      );
    }

    app.saveData();
    this.setData({ editingId: null });
    this.showNotification('修改成功！');
    this.loadData();
  },

  cancelEdit() {
    this.setData({ editingId: null });
  },

  deleteItem(e) {
    const { id, type } = e.currentTarget.dataset;
    const typeLabel = type === 'task' ? '任务' : type === 'reward' ? '奖励' : '坏习惯';
    this.setData({
      modalTitle: '确认删除项目',
      modalMessage: `确定要永久删除这个${typeLabel}吗？此操作无法撤销。`,
      modalConfirmText: '确认删除',
      modalCancelText: '取消',
      modalIsDanger: true,
      modalActionType: 'deleteItem',
      modalActionData: { id: parseInt(id, 10), type },
      showModal: true,
    });
  },

  handleModalConfirm() {
    const { modalActionType, modalActionData } = this.data;
    const gd = app.globalData;

    switch (modalActionType) {
      case 'deleteItem': {
        const { id, type } = modalActionData;
        if (type === 'task') gd.tasks = gd.tasks.filter(t => t.id !== id);
        else if (type === 'reward') gd.rewards = gd.rewards.filter(r => r.id !== id);
        else if (type === 'badHabit') gd.badHabits = gd.badHabits.filter(h => h.id !== id);
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
