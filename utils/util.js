function isSameDay(date1, date2) {
  return date1.toDateString() === date2.toDateString();
}

function isToday(date) {
  return isSameDay(date, new Date());
}

function getWeekDays(date) {
  const days = [];
  const day = new Date(date);
  day.setDate(day.getDate() - day.getDay());
  for (let i = 0; i < 7; i++) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  return days;
}

function formatShortDate(isoString) {
  const date = new Date(isoString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}月${date.getDate()}日 ${h}:${m}`;
}

function toDateString(date) {
  return date.toDateString();
}

module.exports = {
  isSameDay,
  isToday,
  getWeekDays,
  formatShortDate,
  formatDateTime,
  toDateString,
};
