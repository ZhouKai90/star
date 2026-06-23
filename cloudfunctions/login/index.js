// 云函数 login — 获取当前用户的 OpenID
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const { OPENID, APPID } = cloud.getWXContext();
  return {
    openid: OPENID,
    appid: APPID,
  };
};
