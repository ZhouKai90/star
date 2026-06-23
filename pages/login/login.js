const app = getApp();

Page({
  data: {
    nickname: '家长',
    loading: false,
    errorMsg: '',
    disableBtn: false,
  },

  onLoad() {
    // 已有缓存登录 → 直接跳转首页
    const cachedOpenId = wx.getStorageSync('starJar_openId');
    if (cachedOpenId && app.cloudDb) {
      this.startApp();
    }
  },

  onNicknameInput(e) {
    const val = e.detail.value;
    this.setData({ nickname: val, errorMsg: '', disableBtn: !val.trim() });
  },

  async handleLogin() {
    const nickname = this.data.nickname.trim();
    if (!nickname) {
      this.setData({ errorMsg: '请输入昵称' });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    const ok = await app.doLogin(nickname);
    if (ok) {
      this.startApp();
    } else {
      this.setData({
        loading: false,
        errorMsg: '登录失败，请检查网络连接后重试',
      });
    }
  },

  startApp() {
    wx.redirectTo({ url: '/pages/index/index' });
  },
});
