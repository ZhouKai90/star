const defaults = {
  tasks: [
    { id: 1, title: '按时刷牙', value: 1, icon: '🦷' },
    { id: 2, title: '收拾玩具', value: 2, icon: '🧸' },
    { id: 3, title: '阅读绘本(20分钟)', value: 3, icon: '📚' },
    { id: 4, title: '吃完青菜', value: 2, icon: '🥦' },
  ],
  rewards: [
    { id: 1, title: '看电视 (30分钟)', cost: 5, icon: '📺' },
    { id: 2, title: '吃冰淇淋', cost: 10, icon: '🍦' },
    { id: 3, title: '去公园玩', cost: 15, icon: '🎡' },
    { id: 4, title: '买一个小玩具', cost: 50, icon: '🎁' },
  ],
  badHabits: [
    { id: 101, title: '撒谎', value: 5, icon: '🤥' },
    { id: 102, title: '乱发脾气', value: 3, icon: '😠' },
    { id: 103, title: '未经允许拿东西', value: 2, icon: '✋' },
  ],
};

App({
  globalData: {
    stars: 0,
    tasks: [...defaults.tasks],
    rewards: [...defaults.rewards],
    badHabits: [...defaults.badHabits],
    history: [],
  },

  onLaunch() {
    this.loadData();
  },

  loadData() {
    const stars = wx.getStorageSync('starJar_stars');
    const tasks = wx.getStorageSync('starJar_tasks');
    const rewards = wx.getStorageSync('starJar_rewards');
    const history = wx.getStorageSync('starJar_history');
    const badHabits = wx.getStorageSync('starJar_badHabits');

    if (stars) this.globalData.stars = parseInt(stars, 10);
    if (tasks) this.globalData.tasks = JSON.parse(tasks);
    if (rewards) this.globalData.rewards = JSON.parse(rewards);
    if (history) this.globalData.history = JSON.parse(history);
    if (badHabits) this.globalData.badHabits = JSON.parse(badHabits);
  },

  saveData() {
    wx.setStorageSync('starJar_stars', this.globalData.stars);
    wx.setStorageSync('starJar_tasks', JSON.stringify(this.globalData.tasks));
    wx.setStorageSync('starJar_rewards', JSON.stringify(this.globalData.rewards));
    wx.setStorageSync('starJar_history', JSON.stringify(this.globalData.history));
    wx.setStorageSync('starJar_badHabits', JSON.stringify(this.globalData.badHabits));
  },

  getTaskCompletionCountForDate(taskTitle, dateStr) {
    const date = new Date(dateStr);
    return this.globalData.history.filter(item =>
      item.title === taskTitle &&
      item.type === 'earn' &&
      new Date(item.date).toDateString() === date.toDateString()
    ).length;
  },
});
