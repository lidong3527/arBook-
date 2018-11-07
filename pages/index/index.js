//index.js
//获取应用实例
const app = getApp()

Page({
  data: {

  },
  onLoad: function () {
    
  },
  onShow: function(){
    setTimeout(function(){
      wx.reLaunch({
        url: '../AR/AR',
      })
    },300)
    
  }
})
