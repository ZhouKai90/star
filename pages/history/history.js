const app = getApp();

function dateKey(isoStr) {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMonthYear(year, month) {
  return `${year}年${month + 1}月`;
}

function fmtDateTime(isoStr) {
  const d = new Date(isoStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    headerTopPadding: 80,
    currentYear: 0,
    currentMonth: 0,
    monthLabel: '',
    calendarDays: [],
    weekdayHeaders: ['日', '一', '二', '三', '四', '五', '六'],
    monthEarn: 0,
    monthSpend: 0,
    monthDeduct: 0,
    monthRecordDays: 0,

    selectedDate: '',
    selectedDayLabel: '',
    selectedEarn: 0,
    selectedSpend: 0,
    selectedDeduct: 0,
    selectedRecords: [],

    isEmpty: true,

    showModal: false,
    modalTitle: '',
    modalMessage: '',
    modalConfirmText: '确认',
    modalCancelText: '取消',
    modalIsDanger: false,
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
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const opts = currentPage.options || {};
    if (opts.y && opts.m && opts.d) {
      this.targetDate = `${opts.y}-${String(opts.m).padStart(2, '0')}-${String(opts.d).padStart(2, '0')}`;
      this.buildCalendar(parseInt(opts.y, 10), parseInt(opts.m, 10) - 1);
    } else {
      this.targetDate = '';
      const now = new Date();
      this.buildCalendar(now.getFullYear(), now.getMonth());
    }
  },

  buildCalendar(year, month) {
    const history = app.globalData.history;

    // 按日期聚合历史记录
    const historyMap = {};
    history.forEach(item => {
      const key = dateKey(item.date);
      if (!historyMap[key]) historyMap[key] = [];
      historyMap[key].push(item);
    });

    const hasRecords = Object.keys(historyMap).length > 0;

    // 构建日历网格
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = dateKey(today.toISOString());

    const cells = [];

    // 上月补齐
    const py = month === 0 ? year - 1 : year;
    const pm = month === 0 ? 11 : month - 1;
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const ds = `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr: ds, isCurrent: false, isToday: ds === todayStr, hasRecord: !!historyMap[ds] });
    }

    // 当月
    let monthEarn = 0;
    let monthSpend = 0;
    let monthDeduct = 0;
    let monthRecordDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = historyMap[ds] || [];
      if (dayRecords.length > 0) {
        monthRecordDays += 1;
        dayRecords.forEach(item => {
          if (item.type === 'earn') monthEarn += item.value;
          else if (item.type === 'spend') monthSpend += item.value;
          else if (item.type === 'deduct') monthDeduct += item.value;
        });
      }
      cells.push({ day: d, dateStr: ds, isCurrent: true, isToday: ds === todayStr, hasRecord: !!historyMap[ds] });
    }

    // 下月补齐至 42 格
    const ny = month === 11 ? year + 1 : year;
    const nm = month === 11 ? 0 : month + 1;
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const ds = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr: ds, isCurrent: false, isToday: ds === todayStr, hasRecord: !!historyMap[ds] });
    }

    this.data.historyMap = historyMap;

    let defaultDate = '';
    if (this.targetDate) {
      const targetCell = cells.find(c => c.dateStr === this.targetDate);
      if (targetCell) {
        defaultDate = this.targetDate;
      }
      this.targetDate = '';
    }
    if (!defaultDate) {
      const firstInMonth = cells.find(c => c.isCurrent && c.hasRecord);
      defaultDate = firstInMonth ? firstInMonth.dateStr : '';
    }

    this.setData({
      currentYear: year,
      currentMonth: month,
      monthLabel: formatMonthYear(year, month),
      monthEarn,
      monthSpend,
      monthDeduct,
      monthRecordDays,
      calendarDays: cells,
      isEmpty: !hasRecords,
    });

    if (defaultDate) {
      this.selectDate(defaultDate);
    } else {
      this.setData({
        selectedDate: '',
        selectedDayLabel: '',
        selectedRecords: [],
        selectedEarn: 0,
        selectedSpend: 0,
        selectedDeduct: 0,
      });
    }
  },

  selectDate(dateStr) {
    const d = new Date(dateStr);
    const raw = this.data.historyMap[dateStr] || [];
    const records = raw.map(r => ({ ...r, formattedDate: fmtDateTime(r.date) }));
    let earn = 0, spend = 0, deduct = 0;
    records.forEach(r => {
      if (r.type === 'earn') earn += r.value;
      else if (r.type === 'spend') spend += r.value;
      else if (r.type === 'deduct') deduct += r.value;
    });

    const dayLabel = `${d.getMonth() + 1}月${d.getDate()}日 ${weekdayNames[d.getDay()]}`;

    this.setData({
      selectedDate: dateStr,
      selectedDayLabel: dayLabel,
      selectedRecords: records,
      selectedEarn: earn,
      selectedSpend: spend,
      selectedDeduct: deduct,
    });
  },

  onSelectDay(e) {
    const dateStr = e.currentTarget.dataset.date;
    this.selectDate(dateStr);
  },

  prevMonth() {
    const { currentYear, currentMonth } = this.data;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    this.buildCalendar(y, m);
  },

  nextMonth() {
    const { currentYear, currentMonth } = this.data;
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    this.buildCalendar(y, m);
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
    this.setData({ showModal: false });
    this.showNotification('历史记录已清空');
    const now = new Date();
    this.buildCalendar(now.getFullYear(), now.getMonth());
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
